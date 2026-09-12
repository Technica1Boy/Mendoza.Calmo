/* ============================================================
   SAFgt - Sistema de Facturación
   app.js · Lógica completa
   ============================================================ */

// ============================================================
// VARIABLES GLOBALES
// ============================================================
let contribuyentes = [];
let facturasEmitidas = [];
let facturasAnuladas = [];
let ordenesInteligentes = [];
let historialNIT = [];
let administradores = [];
let usuarioActual = null;
let adminActual = null;
let contadoresSerie = {}; // { nit: { GS: n, GR: n, D: n } }

// ============================================================
// INICIALIZACIÓN
// ============================================================
function init() {
    cargarAdministradores();
    cargarContribuyentes();
    cargarFacturasEmitidas();
    cargarFacturasAnuladas();
    cargarOrdenesInteligentes();
    cargarHistorialNIT();
    cargarContadoresSerie();
    cargarPreciosActuales();
    configurarEnter();
    console.log('SAFgt · Sistema de Facturación listo');
}

// ============================================================
// STORAGE HELPERS
// ============================================================
function load(key, def = []) {
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : def;
    } catch { return def; }
}
function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// ADMINISTRADORES
// ============================================================
function cargarAdministradores() {
    administradores = load('administradores', []);
    if (administradores.length === 0) {
        administradores = [{ nombre: 'Heivyn Torres', password: 'Rootadmin' }];
        save('administradores', administradores);
    }
    actualizarSelectAdmins();
}

function actualizarSelectAdmins() {
    const sel = document.getElementById('adminLoginSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Selecciona administrador --</option>';
    administradores.forEach((a, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = a.nombre;
        sel.appendChild(opt);
    });
}

function renderListaAdmins() {
    const cont = document.getElementById('listaAdmins');
    if (!cont) return;
    if (administradores.length === 0) {
        cont.innerHTML = '<div class="sin-usuarios">No hay administradores</div>';
        return;
    }
    let html = '';
    administradores.forEach((a, i) => {
        html += `<div class="item-usuario">
            <div><span class="nit">${a.nombre}</span></div>
            <button class="btn-eliminar-usuario" onclick="eliminarAdmin(${i})" style="background:#c62828;color:white;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.65rem;font-weight:700;">Eliminar</button>
        </div>`;
    });
    cont.innerHTML = html;
}

function agregarAdmin() {
    const nombre = document.getElementById('nuevoAdminNombre').value.trim();
    const pass = document.getElementById('nuevoAdminPass').value.trim();
    if (!nombre || !pass) {
        mostrarMsg('ErrorSuperuser2', 'Completa todos los campos', 'error');
        return;
    }
    if (administradores.some(a => a.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarMsg('ErrorSuperuser2', 'Ese administrador ya existe', 'error');
        return;
    }
    administradores.push({ nombre, password: pass });
    save('administradores', administradores);
    actualizarSelectAdmins();
    renderListaAdmins();
    document.getElementById('nuevoAdminNombre').value = '';
    document.getElementById('nuevoAdminPass').value = '';
    mostrarMsg('Superuser', `"${nombre}" agregado`, 'exito');
}

function eliminarAdmin(i) {
    if (administradores.length <= 1) {
        alert('Debe existir al menos un administrador');
        return;
    }
    if (!confirm(`¿Eliminar a "${administradores[i].nombre}"?`)) return;
    administradores.splice(i, 1);
    save('administradores', administradores);
    actualizarSelectAdmins();
    renderListaAdmins();
}

// ============================================================
// SUPERUSER
// ============================================================
function abrirSuperuser() {
    document.getElementById('modalSuperuser').classList.add('activo');
    document.getElementById('superuserLogin').style.display = 'block';
    document.getElementById('superuserPanel').style.display = 'none';
    document.getElementById('passSuperuser').value = '';
    limpiarMsgs();
}

function cerrarModalSuperuser() {
    document.getElementById('modalSuperuser').classList.remove('activo');
}

function loginSuperuser() {
    const pass = document.getElementById('passSuperuser').value.trim();
    if (pass === 'Superuser') {
        document.getElementById('superuserLogin').style.display = 'none';
        document.getElementById('superuserPanel').style.display = 'block';
        renderListaAdmins();
        limpiarMsgs();
    } else {
        mostrarMsg('ErrorSuperuser', 'Contraseña incorrecta', 'error');
    }
}

// ============================================================
// CONTRIBUYENTES
// ============================================================
function cargarContribuyentes() {
    contribuyentes = load('contribuyentes', []);
    if (contribuyentes.length === 0) {
        contribuyentes = [
            { nit: '123456-7', nombre: 'Juan Pérez', empresa: 'Pérez y Asociados', direccion: '4 calle 10 av zona 3 Barillas', password: '1234' },
            { nit: '789012-3', nombre: 'María López', empresa: 'López y Cía.', direccion: 'Zona 1, Ciudad', password: '5678' }
        ];
        save('contribuyentes', contribuyentes);
    }
    renderizarListaAdmin();
    actualizarSelectNIT();
}

function guardarContribuyentes() { save('contribuyentes', contribuyentes); }

function renderizarListaAdmin() {
    const cont = document.getElementById('listaUsuarios');
    if (!cont) return;
    if (contribuyentes.length === 0) {
        cont.innerHTML = '<div class="sin-usuarios">No hay contribuyentes registrados</div>';
        return;
    }
    let html = '';
    contribuyentes.forEach((c, i) => {
        html += `<div class="item-usuario">
            <div>
                <span class="nit">${c.nit}</span>
                <span class="nombre">${c.nombre}</span>
                <span class="empresa">${c.empresa}</span>
                <div style="font-size:0.65rem;color:#666;">${c.direccion || ''}</div>
            </div>
            <button class="btn-eliminar-usuario" onclick="eliminarContribuyente(${i})" style="background:#c62828;color:white;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.65rem;font-weight:700;">Eliminar</button>
        </div>`;
    });
    cont.innerHTML = html;
}

function actualizarSelectNIT() {
    const sel = document.getElementById('nitLogin');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Selecciona tu NIT --</option>';
    contribuyentes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.nit;
        opt.textContent = `${c.nit} - ${c.nombre}`;
        sel.appendChild(opt);
    });
}

function registrarContribuyente() {
    const nit = document.getElementById('nitRegistro').value.trim();
    const nombre = document.getElementById('nombreRegistro').value.trim();
    const empresa = document.getElementById('empresaRegistro').value.trim();
    const direccion = document.getElementById('direccionRegistro').value.trim();
    const password = document.getElementById('passRegistro').value.trim();

    if (!nit || !nombre || !empresa || !direccion || !password) {
        mostrarMsg('ErrorRegistro', 'Completa todos los campos', 'error');
        return;
    }
    if (contribuyentes.some(c => c.nit === nit)) {
        mostrarMsg('ErrorRegistro', 'Este NIT ya está registrado', 'error');
        return;
    }

    contribuyentes.push({ nit, nombre, empresa, direccion, password });
    guardarContribuyentes();
    renderizarListaAdmin();
    actualizarSelectNIT();

    ['nitRegistro','nombreRegistro','empresaRegistro','direccionRegistro','passRegistro'].forEach(id => {
        document.getElementById(id).value = '';
    });
    mostrarMsg('Registro', `"${nombre}" registrado`, 'exito');
}

function eliminarContribuyente(i) {
    if (!confirm(`¿Eliminar a "${contribuyentes[i].nombre}"?`)) return;
    contribuyentes.splice(i, 1);
    guardarContribuyentes();
    renderizarListaAdmin();
    actualizarSelectNIT();
}

// ============================================================
// FACTURAS EMITIDAS / ANULADAS
// ============================================================
function cargarFacturasEmitidas() {
    facturasEmitidas = load('facturasEmitidas', []);
}
function guardarFacturasEmitidas() { save('facturasEmitidas', facturasEmitidas); }

function cargarFacturasAnuladas() {
    facturasAnuladas = load('facturasAnuladas', []);
}
function guardarFacturasAnuladas() { save('facturasAnuladas', facturasAnuladas); }

function cargarOrdenesInteligentes() {
    ordenesInteligentes = load('ordenesInteligentes', []);
}
function guardarOrdenesInteligentes() { save('ordenesInteligentes', ordenesInteligentes); }

function cargarHistorialNIT() {
    historialNIT = load('historialNIT', []);
}
function guardarHistorialNIT() { save('historialNIT', historialNIT); }

function cargarContadoresSerie() {
    contadoresSerie = load('contadoresSerie', {});
}
function guardarContadoresSerie() { save('contadoresSerie', contadoresSerie); }

// ============================================================
// NAVEGACIÓN
// ============================================================
function ocultarTodo() {
    document.getElementById('menuPrincipal').style.display = 'none';
    ['formLoginUsuario','formLoginAuditor','panelAuditor','panelUsuario'].forEach(id => {
        document.getElementById(id).classList.remove('activo');
    });
}

function volverMenu() {
    ocultarTodo();
    document.getElementById('menuPrincipal').style.display = 'flex';
    limpiarMsgs();
    document.getElementById('passLogin').value = '';
    document.getElementById('passAuditor').value = '';
    document.getElementById('nitLogin').value = '';
    usuarioActual = null;
    adminActual = null;
}

function mostrarLoginUsuario() {
    ocultarTodo();
    document.getElementById('formLoginUsuario').classList.add('activo');
    limpiarMsgs();
    actualizarSelectNIT();
}

function mostrarLoginAuditor() {
    ocultarTodo();
    document.getElementById('formLoginAuditor').classList.add('activo');
    limpiarMsgs();
    actualizarSelectAdmins();
}

function cambiarPanel(panel) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('activo'));
    const map = {
        contribuyentes: 'panelContribuyentes',
        facturas: 'panelFacturas',
        facturasInteligentes: 'panelFacturasInteligentes',
        precios: 'panelPrecios',
        busqueda: 'panelBusqueda',
        anuladas: 'panelAnuladas'
    };
    const el = document.getElementById(map[panel]);
    if (el) el.classList.add('activo');

    document.querySelectorAll('.btn-menu-opcion').forEach(b => b.classList.remove('activo'));
    const btnMap = {
        contribuyentes: 'btnContribuyentes',
        facturas: 'btnFacturas',
        facturasInteligentes: 'btnFacturasInteligentes',
        precios: 'btnPrecios',
        busqueda: 'btnBusqueda',
        anuladas: 'btnAnuladas'
    };
    const btn = document.getElementById(btnMap[panel]);
    if (btn) btn.classList.add('activo');

    if (panel === 'facturas') { cargarDatosFactura(); cargarListaFacturas(); }
    if (panel === 'facturasInteligentes') { cargarDatosInteligentes(); cargarListaOrdenes(); }
    if (panel === 'precios') cargarPreciosActuales();
    if (panel === 'busqueda') cargarBusquedaFacturas();
    if (panel === 'anuladas') cargarListaAnuladas();
    if (panel === 'contribuyentes') { cargarInfoUsuario(); llenarSelectMes(); }
}

// ============================================================
// LOGIN
// ============================================================
function loginUsuario() {
    const nit = document.getElementById('nitLogin').value;
    const pass = document.getElementById('passLogin').value.trim();
    if (!nit) { mostrarMsg('ErrorLogin', 'Selecciona tu NIT', 'error'); return; }
    if (!pass) { mostrarMsg('ErrorLogin', 'Ingresa tu contraseña', 'error'); return; }

    const encontrado = contribuyentes.find(c => c.nit === nit && c.password === pass);
    if (encontrado) {
        usuarioActual = encontrado;
        setTimeout(() => {
            ocultarTodo();
            document.getElementById('panelUsuario').classList.add('activo');
            cargarInfoUsuario();
            llenarSelectMes();
            cargarDatosFactura();
            cargarDatosInteligentes();
            cargarListaFacturas();
            cargarBusquedaFacturas();
            cargarListaOrdenes();
            cargarListaAnuladas();
            limpiarMsgs();
            // Activar C/F por defecto
            document.getElementById('tipoDocumento').value = 'CF';
            cambiarTipoDocumento();
        }, 300);
    } else {
        mostrarMsg('ErrorLogin', 'Contraseña incorrecta', 'error');
    }
}

function loginAuditor() {
    const idx = document.getElementById('adminLoginSelect').value;
    const pass = document.getElementById('passAuditor').value.trim();
    if (idx === '') { mostrarMsg('ErrorAuditor', 'Selecciona un administrador', 'error'); return; }
    const admin = administradores[parseInt(idx)];
    if (admin && admin.password === pass) {
        adminActual = admin;
        ocultarTodo();
        document.getElementById('panelAuditor').classList.add('activo');
        document.getElementById('adminConectadoInfo').innerHTML = `Conectado como: <strong>${admin.nombre}</strong>`;
        limpiarMsgs();
        renderizarListaAdmin();
        document.getElementById('passAuditor').value = '';
    } else {
        mostrarMsg('ErrorAuditor', 'Contraseña incorrecta', 'error');
    }
}

function cerrarSesionAuditor() {
    if (confirm('¿Cerrar sesión?')) { adminActual = null; volverMenu(); }
}
function cerrarSesionUsuario() {
    if (confirm('¿Cerrar sesión?')) volverMenu();
}

// ============================================================
// MENSAJES
// ============================================================
function limpiarMsgs() {
    document.querySelectorAll('.mensaje-error, .mensaje-exito').forEach(el => {
        el.classList.remove('mostrar');
        el.textContent = '';
    });
}
function mostrarMsg(tipo, texto, clase) {
    // tipo: ErrorLogin, Registro, ErrorRegistro, ErrorAuditor, ErrorSuperuser, Superuser, ErrorSuperuser2
    const map = {
        ErrorLogin: 'mensajeErrorLogin',
        Registro: 'mensajeRegistro',
        ErrorRegistro: 'mensajeErrorRegistro',
        ErrorAuditor: 'mensajeErrorAuditor',
        ErrorSuperuser: 'mensajeErrorSuperuser',
        Superuser: 'mensajeSuperuser',
        ErrorSuperuser2: 'mensajeErrorSuperuser2'
    };
    const el = document.getElementById(map[tipo]);
    if (el) {
        el.textContent = texto;
        el.className = `mensaje-${clase} mostrar`;
        setTimeout(() => el.classList.remove('mostrar'), 4000);
    }
}

// ============================================================
// INFO CONTRIBUYENTE + SELECTOR DE MES
// ============================================================
function cargarInfoUsuario() {
    if (!usuarioActual) return;
    document.getElementById('userNit').textContent = usuarioActual.nit;
    document.getElementById('userNombre').textContent = usuarioActual.nombre;
    document.getElementById('userEmpresa').textContent = usuarioActual.empresa;
    document.getElementById('userDireccion').textContent = usuarioActual.direccion || '-';
    actualizarStatsMes();
}

function llenarSelectMes() {
    const sel = document.getElementById('selectMes');
    if (!sel || !usuarioActual) return;
    const facturas = facturasEmitidas.filter(f => f.nitEmisor === usuarioActual.nit && !f.anulada);
    const meses = new Set();
    facturas.forEach(f => {
        if (f.fecha) {
            // fecha formato DD/MM/YYYY o YYYY-MM-DD
            let y, m;
            if (f.fecha.includes('/')) {
                const p = f.fecha.split('/');
                y = p[2]; m = p[1];
            } else {
                const p = f.fecha.split('-');
                y = p[0]; m = p[1];
            }
            meses.add(`${y}-${m}`);
        }
    });
    const ordenados = [...meses].sort().reverse();
    sel.innerHTML = '<option value="todos">Todos los meses</option>';
    const nombres = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    ordenados.forEach(ym => {
        const [y, m] = ym.split('-');
        const opt = document.createElement('option');
        opt.value = ym;
        opt.textContent = `${nombres[parseInt(m)]} ${y}`;
        sel.appendChild(opt);
    });
}

function actualizarStatsMes() {
    if (!usuarioActual) return;
    const sel = document.getElementById('selectMes');
    const valor = sel ? sel.value : 'todos';

    const facturas = facturasEmitidas.filter(f => f.nitEmisor === usuarioActual.nit && !f.anulada);

    // Totales generales
    document.getElementById('userTotalFacturas').textContent = facturas.length;
    const montoTotal = facturas.reduce((s, f) => s + (f.total || 0), 0);
    document.getElementById('userMontoTotal').textContent = `Q ${montoTotal.toFixed(2)}`;

    // Período
    let periodo = facturas;
    if (valor !== 'todos') {
        periodo = facturas.filter(f => {
            if (!f.fecha) return false;
            let y, m;
            if (f.fecha.includes('/')) {
                const p = f.fecha.split('/');
                y = p[2]; m = p[1];
            } else {
                const p = f.fecha.split('-');
                y = p[0]; m = p[1];
            }
            return `${y}-${m}` === valor;
        });
    }
    document.getElementById('userFacturasPeriodo').textContent = periodo.length;
    const montoPeriodo = periodo.reduce((s, f) => s + (f.total || 0), 0);
    document.getElementById('userMontoPeriodo').textContent = `Q ${montoPeriodo.toFixed(2)}`;
}

// ============================================================
// PRECIOS
// ============================================================
function guardarConfiguracionCombustible() {
    const precios = {
        superior: {
            precio: parseFloat(document.getElementById('precioSuperior').value) || 0,
            etanol: document.getElementById('etanolSuperior').checked
        },
        regular: {
            precio: parseFloat(document.getElementById('precioRegular').value) || 0,
            etanol: document.getElementById('etanolRegular').checked
        },
        diesel: {
            precio: parseFloat(document.getElementById('precioDiesel').value) || 0
        }
    };
    save('preciosCombustible', precios);
    alert('Precios guardados correctamente');
    cargarPreciosActuales();
}

function cargarPreciosActuales() {
    const precios = load('preciosCombustible', null);
    if (precios) {
        document.getElementById('precioActualSuperior').textContent = `Q${precios.superior.precio.toFixed(2)}`;
        document.getElementById('idpActualSuperior').textContent = precios.superior.etanol ? 'Q4.23 (E10)' : 'Q4.70';
        document.getElementById('idpMostrarSuperior').textContent = precios.superior.etanol ? 'IDP: Q4.23' : 'IDP: Q4.70';
        document.getElementById('precioSuperior').value = precios.superior.precio || '';
        document.getElementById('etanolSuperior').checked = precios.superior.etanol;

        document.getElementById('precioActualRegular').textContent = `Q${precios.regular.precio.toFixed(2)}`;
        document.getElementById('idpActualRegular').textContent = precios.regular.etanol ? 'Q4.14 (E10)' : 'Q4.60';
        document.getElementById('idpMostrarRegular').textContent = precios.regular.etanol ? 'IDP: Q4.14' : 'IDP: Q4.60';
        document.getElementById('precioRegular').value = precios.regular.precio || '';
        document.getElementById('etanolRegular').checked = precios.regular.etanol;

        document.getElementById('precioActualDiesel').textContent = `Q${precios.diesel.precio.toFixed(2)}`;
        document.getElementById('precioDiesel').value = precios.diesel.precio || '';
    } else {
        document.getElementById('precioActualSuperior').textContent = 'No configurado';
        document.getElementById('precioActualRegular').textContent = 'No configurado';
        document.getElementById('precioActualDiesel').textContent = 'No configurado';
        document.getElementById('idpActualSuperior').textContent = '-';
        document.getElementById('idpActualRegular').textContent = '-';
        document.getElementById('etanolSuperior').checked = true;
        document.getElementById('etanolRegular').checked = true;
    }
}

function obtenerPrecios() {
    return load('preciosCombustible', {
        superior: { precio: 0, etanol: true },
        regular: { precio: 0, etanol: true },
        diesel: { precio: 0 }
    });
}

// ============================================================
// FACTURACIÓN NORMAL - DATOS
// ============================================================
function cargarDatosFactura() {
    if (!usuarioActual) return;
    document.getElementById('facturaEmisor').textContent = usuarioActual.nombre;
    document.getElementById('facturaNitEmisor').textContent = usuarioActual.nit;
    document.getElementById('facturaEstablecimiento').textContent = usuarioActual.empresa;
    document.getElementById('facturaDireccion').textContent = usuarioActual.direccion || '-';

    const fecha = new Date();
    document.getElementById('facturaFecha').value = fecha.toLocaleDateString('es-GT', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });

    actualizarSerie();
}

function getContador(nit, prefijo) {
    if (!contadoresSerie[nit]) contadoresSerie[nit] = { GS: 0, GR: 0, D: 0 };
    return contadoresSerie[nit][prefijo] || 0;
}

function incrementarContador(nit, prefijo) {
    if (!contadoresSerie[nit]) contadoresSerie[nit] = { GS: 0, GR: 0, D: 0 };
    contadoresSerie[nit][prefijo] = (contadoresSerie[nit][prefijo] || 0) + 1;
    guardarContadoresSerie();
    return contadoresSerie[nit][prefijo];
}

function actualizarSerie() {
    if (!usuarioActual) return;
    const tipo = document.getElementById('tipoCombustibleFactura').value;
    let prefijo = tipo === 'superior' ? 'GS' : tipo === 'regular' ? 'GR' : 'D';
    const cont = getContador(usuarioActual.nit, prefijo) + 1;
    document.getElementById('facturaSerie').value = `${prefijo}${String(cont).padStart(2, '0')}`;
    document.getElementById('facturaNumero').value = cont;
}

// ============================================================
// COMPRADOR / NIT
// ============================================================
function buscarComprador() {
    const nit = document.getElementById('nitComprador').value.trim().toUpperCase();
    if (nit === 'C/F' || nit === 'CF') {
        document.getElementById('nombreComprador').value = '';
        document.getElementById('direccionComprador').value = usuarioActual ? (usuarioActual.direccion || '') : '';
        document.getElementById('tipoDocumento').value = 'CF';
        document.getElementById('sugerenciasNIT').style.display = 'none';
        return;
    }

    const hist = historialNIT.find(h => h.nit === nit);
    if (hist) {
        document.getElementById('nombreComprador').value = hist.nombre || '';
        document.getElementById('direccionComprador').value = hist.direccion || '';
        document.getElementById('sugerenciasNIT').style.display = 'none';
        return;
    }

    const c = contribuyentes.find(x => x.nit === nit);
    if (c) {
        document.getElementById('nombreComprador').value = c.nombre || '';
        document.getElementById('direccionComprador').value = c.direccion || '';
        agregarNITHistorial(nit, c.nombre, c.direccion);
        document.getElementById('sugerenciasNIT').style.display = 'none';
        return;
    }
    mostrarSugerenciasNIT(nit);
}

function mostrarSugerenciasNIT(busqueda) {
    const cont = document.getElementById('sugerenciasNIT');
    if (busqueda.length < 2) { cont.style.display = 'none'; return; }

    const res = [];
    contribuyentes.forEach(c => {
        if (c.nit.includes(busqueda) || c.nombre.toLowerCase().includes(busqueda.toLowerCase())) res.push(c);
    });
    historialNIT.forEach(h => {
        if (h.nit.includes(busqueda) && !res.find(r => r.nit === h.nit)) {
            res.push({ nit: h.nit, nombre: h.nombre, direccion: h.direccion });
        }
    });

    if (res.length === 0) { cont.style.display = 'none'; return; }

    let html = '';
    res.forEach(r => {
        html += `<div style="padding:6px 10px;cursor:pointer;border-bottom:1px solid #eee;"
            onclick="seleccionarNIT('${r.nit}')"
            onmouseover="this.style.background='#f0f4f8'" onmouseout="this.style.background='white'">
            <strong>${r.nit}</strong> - ${r.nombre}
            <span style="color:#666;font-size:0.72rem;"> ${r.direccion || ''}</span>
        </div>`;
    });
    cont.innerHTML = html;
    cont.style.display = 'block';
}

function seleccionarNIT(nit) {
    document.getElementById('nitComprador').value = nit;
    document.getElementById('sugerenciasNIT').style.display = 'none';
    buscarComprador();
}

function agregarNITHistorial(nit, nombre, direccion) {
    if (nit === 'C/F' || nit === 'CF') return;
    const existe = historialNIT.find(h => h.nit === nit);
    if (!existe) {
        historialNIT.push({ nit, nombre, direccion });
        guardarHistorialNIT();
    } else {
        // actualizar
        existe.nombre = nombre;
        existe.direccion = direccion;
        guardarHistorialNIT();
    }
}

function cambiarTipoDocumento() {
    const tipo = document.getElementById('tipoDocumento').value;
    if (tipo === 'CF') {
        document.getElementById('nitComprador').value = 'C/F';
        document.getElementById('nitComprador').readOnly = true;
        document.getElementById('nombreComprador').value = '';
        document.getElementById('nombreComprador').readOnly = false;
        document.getElementById('direccionComprador').value = usuarioActual ? (usuarioActual.direccion || '') : '';
        document.getElementById('direccionComprador').readOnly = false;
        document.getElementById('sugerenciasNIT').style.display = 'none';
    } else {
        document.getElementById('nitComprador').value = '';
        document.getElementById('nitComprador').readOnly = false;
        document.getElementById('nombreComprador').value = '';
        document.getElementById('nombreComprador').readOnly = false;
        document.getElementById('direccionComprador').value = '';
        document.getElementById('direccionComprador').readOnly = false;
        document.getElementById('nitComprador').focus();
    }
}

// ============================================================
// CÁLCULO FACTURA
// ============================================================
function calcularFactura() {
    const tipo = document.getElementById('tipoCombustibleFactura').value;
    const totalPagar = parseFloat(document.getElementById('montoFactura').value) || 0;

    const zero = () => {
        ['galonesFactura'].forEach(id => document.getElementById(id).value = '0.0000');
        ['resumenSubtotal','resumenIDP','resumenIVA','resumenTotal'].forEach(id => document.getElementById(id).textContent = 'Q 0.00');
        document.getElementById('resumenGalones').textContent = '0.0000';
        document.getElementById('detalleTotalPago').textContent = 'Q 0.00';
        document.getElementById('detalleIDPValor').textContent = 'Q 0.00';
        document.getElementById('detalleIVAValor').textContent = 'Q 0.00';
        document.getElementById('detalleSubtotal').textContent = 'Q 0.00';
        document.getElementById('detalleGalones').textContent = '0.0000';
    };

    if (totalPagar <= 0) { zero(); return; }

    const precios = obtenerPrecios();
    let precioGalon = 0, idpGalon = 0;
    if (tipo === 'superior') {
        precioGalon = precios.superior.precio || 0;
        idpGalon = precios.superior.etanol ? 4.23 : 4.70;
    } else if (tipo === 'regular') {
        precioGalon = precios.regular.precio || 0;
        idpGalon = precios.regular.etanol ? 4.14 : 4.60;
    } else {
        precioGalon = precios.diesel.precio || 0;
        idpGalon = 1.30;
    }

    if (precioGalon <= 0) {
        alert('Primero configura los precios de combustible');
        return;
    }

    const factor = (precioGalon + idpGalon) * 1.12;
    const galones = totalPagar / factor;
    const subtotal = galones * precioGalon;
    const idpTotal = galones * idpGalon;
    const iva = (subtotal + idpTotal) * 0.12;
    const totalCalc = subtotal + idpTotal + iva;

    document.getElementById('galonesFactura').value = galones.toFixed(4);
    document.getElementById('resumenSubtotal').textContent = `Q ${subtotal.toFixed(2)}`;
    document.getElementById('resumenIDP').textContent = `Q ${idpTotal.toFixed(2)}`;
    document.getElementById('resumenIVA').textContent = `Q ${iva.toFixed(2)}`;
    document.getElementById('resumenTotal').textContent = `Q ${totalCalc.toFixed(2)}`;
    document.getElementById('resumenGalones').textContent = galones.toFixed(4);

    document.getElementById('detalleTotalPago').textContent = `Q ${totalPagar.toFixed(2)}`;
    document.getElementById('detalleIDPValor').textContent = `Q ${idpTotal.toFixed(2)}`;
    document.getElementById('detalleIVAValor').textContent = `Q ${iva.toFixed(2)}`;
    document.getElementById('detalleSubtotal').textContent = `Q ${subtotal.toFixed(2)}`;
    document.getElementById('detalleGalones').textContent = galones.toFixed(4);
}

// ============================================================
// GENERAR FACTURA NORMAL
// ============================================================
function generarFactura() {
    if (!usuarioActual) { alert('Debes iniciar sesión'); return; }
    const totalPagar = parseFloat(document.getElementById('montoFactura').value) || 0;
    if (totalPagar <= 0) { alert('Ingresa un monto válido'); return; }

    const tipo = document.getElementById('tipoCombustibleFactura').value;
    const nitComprador = document.getElementById('nitComprador').value.trim() || 'C/F';
    const nombreComprador = document.getElementById('nombreComprador').value.trim() || 'Consumidor Final';
    const direccionComprador = document.getElementById('direccionComprador').value.trim() || (usuarioActual.direccion || '');
    const tipoDoc = document.getElementById('tipoDocumento').value;
    const serie = document.getElementById('facturaSerie').value;
    const numero = document.getElementById('facturaNumero').value;
    const fecha = document.getElementById('facturaFecha').value;

    const subtotal = parseFloat(document.getElementById('resumenSubtotal').textContent.replace('Q ', '')) || 0;
    const idpTotal = parseFloat(document.getElementById('resumenIDP').textContent.replace('Q ', '')) || 0;
    const iva = parseFloat(document.getElementById('resumenIVA').textContent.replace('Q ', '')) || 0;
    const total = parseFloat(document.getElementById('resumenTotal').textContent.replace('Q ', '')) || 0;
    const galones = parseFloat(document.getElementById('galonesFactura').value) || 0;

    if (nitComprador !== 'C/F') agregarNITHistorial(nitComprador, nombreComprador, direccionComprador);

    const prefijo = tipo === 'superior' ? 'GS' : tipo === 'regular' ? 'GR' : 'D';
    incrementarContador(usuarioActual.nit, prefijo);

    const factura = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        emisor: usuarioActual.nombre,
        nitEmisor: usuarioActual.nit,
        establecimiento: usuarioActual.empresa,
        direccionEmisor: usuarioActual.direccion,
        nitComprador, nombreComprador, direccionComprador,
        tipoDocumento: tipoDoc,
        serie, numero, fecha,
        tipoCombustible: tipo,
        monto: totalPagar,
        galones, idp: idpTotal, iva, subtotal, total,
        fechaGeneracion: new Date().toISOString(),
        esInteligente: false,
        lote: null,
        anulada: false
    };

    facturasEmitidas.push(factura);
    guardarFacturasEmitidas();

    actualizarSerie();
    cargarListaFacturas();
    cargarBusquedaFacturas();
    cargarInfoUsuario();
    llenarSelectMes();
    limpiarFactura();

    alert(`Factura ${serie} generada\nTotal: Q ${total.toFixed(2)}\nGalones: ${galones.toFixed(4)}`);
}

function limpiarFactura() {
    document.getElementById('montoFactura').value = '';
    document.getElementById('galonesFactura').value = '0.0000';
    ['resumenSubtotal','resumenIDP','resumenIVA','resumenTotal'].forEach(id => document.getElementById(id).textContent = 'Q 0.00');
    document.getElementById('resumenGalones').textContent = '0.0000';
    document.getElementById('detalleTotalPago').textContent = 'Q 0.00';
    document.getElementById('detalleIDPValor').textContent = 'Q 0.00';
    document.getElementById('detalleIVAValor').textContent = 'Q 0.00';
    document.getElementById('detalleSubtotal').textContent = 'Q 0.00';
    document.getElementById('detalleGalones').textContent = '0.0000';
    document.getElementById('sugerenciasNIT').style.display = 'none';
    document.getElementById('tipoDocumento').value = 'CF';
    cambiarTipoDocumento();
    actualizarSerie();
}

// ============================================================
// LISTA FACTURAS (usuario)
// ============================================================
function cargarListaFacturas() {
    const tbody = document.getElementById('tablaFacturasBody');
    if (!usuarioActual) return;
    const mias = facturasEmitidas.filter(f => f.nitEmisor === usuarioActual.nit && !f.anulada);
    if (mias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:14px;">No hay facturas</td></tr>';
        return;
    }
    let html = '';
    [...mias].reverse().forEach((f, i) => {
        const badge = f.esInteligente ? ' <span class="badge-lote">Lote</span>' : '';
        html += `<tr>
            <td>${i + 1}</td>
            <td><strong>${f.serie}</strong>${badge}</td>
            <td>${f.fecha}</td>
            <td>Q ${f.total.toFixed(2)}</td>
            <td>
                <button class="btn-ingresar btn-sm" onclick="verFactura('${f.id}')">Ver</button>
                <button class="btn-ingresar btn-sm" style="background:linear-gradient(135deg,#e65100,#bf360c);" onclick="imprimirPDF('${f.id}')">PDF</button>
                <button class="btn-danger" onclick="anularFactura('${f.id}')">Anular</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ============================================================
// ANULAR / ELIMINAR
// ============================================================
function anularFactura(id) {
    if (!confirm('¿Anular esta factura? Seguirá en el correlativo pero quedará marcada como anulada.')) return;
    const f = facturasEmitidas.find(x => String(x.id) === String(id));
    if (!f) return;
    f.anulada = true;
    f.fechaAnulacion = new Date().toISOString();
    facturasAnuladas.push({ ...f, estado: 'Anulada' });
    // quitar de emitidas activas conceptualmente (la dejamos pero marcada)
    guardarFacturasEmitidas();
    guardarFacturasAnuladas();
    cargarListaFacturas();
    cargarBusquedaFacturas();
    cargarListaAnuladas();
    cargarInfoUsuario();
    llenarSelectMes();
    alert('Factura anulada');
}

function eliminarFactura(id) {
    if (!confirm('¿Eliminar esta factura? Se moverá al menú Anuladas/Eliminadas.')) return;
    const idx = facturasEmitidas.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return;
    const f = facturasEmitidas[idx];
    f.anulada = true;
    f.fechaAnulacion = new Date().toISOString();
    facturasAnuladas.push({ ...f, estado: 'Eliminada' });
    facturasEmitidas.splice(idx, 1);
    guardarFacturasEmitidas();
    guardarFacturasAnuladas();

    // Si pertenecía a una orden, actualizar
    if (f.ordenId) {
        const orden = ordenesInteligentes.find(o => String(o.id) === String(f.ordenId));
        if (orden) {
            orden.facturas = orden.facturas.filter(fid => String(fid) !== String(id));
            if (orden.facturas.length === 0) {
                ordenesInteligentes = ordenesInteligentes.filter(o => String(o.id) !== String(f.ordenId));
            }
            guardarOrdenesInteligentes();
        }
    }

    cargarListaFacturas();
    cargarBusquedaFacturas();
    cargarListaAnuladas();
    cargarListaOrdenes();
    cargarInfoUsuario();
    llenarSelectMes();
    alert('Factura movida a Anuladas/Eliminadas');
}

function cargarListaAnuladas() {
    const tbody = document.getElementById('tablaAnuladasBody');
    if (!tbody) return;
    const mias = usuarioActual
        ? facturasAnuladas.filter(f => f.nitEmisor === usuarioActual.nit)
        : facturasAnuladas;
    if (mias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:14px;">No hay facturas anuladas</td></tr>';
        return;
    }
    let html = '';
    [...mias].reverse().forEach(f => {
        html += `<tr class="anulada">
            <td><strong>${f.serie}</strong></td>
            <td>${f.fecha}</td>
            <td>${f.nombreComprador}</td>
            <td>Q ${f.total.toFixed(2)}</td>
            <td><span class="badge-anulada">${f.estado || 'Anulada'}</span></td>
            <td>
                <button class="btn-ingresar btn-sm" onclick="verFacturaAnulada('${f.id}')">Ver</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function verFacturaAnulada(id) {
    const f = facturasAnuladas.find(x => String(x.id) === String(id));
    if (f) verFacturaObj(f);
}

// ============================================================
// FACTURAS INTELIGENTES - ALGORITMO MEJORADO
// ============================================================
function sugerirCantidad() {
    const total = parseFloat(document.getElementById('inteligenteMontoTotal').value) || 0;
    const min = parseFloat(document.getElementById('inteligenteMinimo').value) || 50;
    const max = parseFloat(document.getElementById('inteligenteMaximo').value) || 500;
    const box = document.getElementById('sugerenciaCantidad');
    if (total < min * 2 || total % 5 !== 0) {
        box.style.display = 'none';
        return;
    }
    // Sugerir cantidad para buena variedad
    const minFact = Math.ceil(total / max);
    const maxFact = Math.floor(total / min);
    // Ideal: montos promedio entre 100-300
    let ideal = Math.round(total / 200);
    ideal = Math.max(minFact, Math.min(maxFact, ideal));
    // Otras opciones
    const op2 = Math.round(total / 150);
    const op3 = Math.round(total / 250);
    const opciones = [...new Set([ideal, op2, op3].filter(n => n >= minFact && n <= maxFact && n >= 2))].sort((a,b)=>a-b);

    if (opciones.length === 0) {
        box.style.display = 'none';
        return;
    }
    box.style.display = 'block';
    box.innerHTML = `<strong>Sugerencia:</strong> Para montos variados y realistas prueba con <strong>${opciones.join(', ')}</strong> facturas (rango posible: ${minFact} – ${maxFact}).`;
}

/**
 * Algoritmo mejorado de distribución variable
 * Genera montos múltiplos de 5, dentro de [min, max], que sumen exactamente total,
 * con buena variedad (no se quedan solo en extremos).
 */
function generarDistribucionVariable(total, cantidad, minimo, maximo) {
    minimo = Math.ceil(minimo / 5) * 5;
    maximo = Math.floor(maximo / 5) * 5;
    if (minimo < 5) minimo = 5;
    if (maximo < minimo) return [];
    if (total % 5 !== 0) total = Math.round(total / 5) * 5;

    if (cantidad * minimo > total || cantidad * maximo < total) return [];

    // Intentar varias veces con diferentes seeds de aleatoriedad
    for (let intento = 0; intento < 80; intento++) {
        const resultado = intentarDistribucion(total, cantidad, minimo, maximo);
        if (resultado.length === cantidad) {
            // Verificar variedad: al menos 40% de montos distintos si cantidad > 3
            const unicos = new Set(resultado);
            if (cantidad <= 3 || unicos.size >= Math.min(3, Math.ceil(cantidad * 0.35))) {
                return resultado;
            }
        }
    }
    // Fallback más determinista
    return distribucionDeterminista(total, cantidad, minimo, maximo);
}

function intentarDistribucion(total, cantidad, minimo, maximo) {
    const res = [];
    let restante = total;

    for (let i = 0; i < cantidad; i++) {
        const quedan = cantidad - i - 1;
        const minPosible = minimo;
        const maxPosible = Math.min(maximo, restante - quedan * minimo);
        if (maxPosible < minPosible) return [];

        // Preferir valores en el tercio medio para variedad
        const rango = maxPosible - minPosible;
        let valor;
        if (rango <= 5) {
            valor = minPosible;
        } else {
            // Distribución sesgada al centro pero con aleatoriedad
            const centro = minPosible + rango / 2;
            const desv = rango / 3;
            let raw = centro + (Math.random() - 0.5) * 2 * desv;
            raw = Math.max(minPosible, Math.min(maxPosible, raw));
            valor = Math.round(raw / 5) * 5;
            valor = Math.max(minPosible, Math.min(maxPosible, valor));
        }
        // Asegurar que el restante permita terminar
        const maxParaEste = restante - quedan * minimo;
        valor = Math.min(valor, Math.floor(maxParaEste / 5) * 5);
        if (valor < minimo) valor = minimo;

        res.push(valor);
        restante -= valor;
    }

    // Ajuste final del residual
    if (restante !== 0) {
        for (let i = 0; i < res.length && restante !== 0; i++) {
            const puede = restante > 0
                ? Math.min(maximo - res[i], restante)
                : Math.max(minimo - res[i], restante);
            const adj = Math.floor(puede / 5) * 5;
            if (adj !== 0) {
                res[i] += adj;
                restante -= adj;
            }
        }
    }

    if (restante !== 0) return [];
    if (res.some(v => v < minimo || v > maximo || v % 5 !== 0)) return [];
    return res;
}

function distribucionDeterminista(total, cantidad, minimo, maximo) {
    // Distribuir lo más equitativo posible y luego variar
    const base = Math.floor((total / cantidad) / 5) * 5;
    const res = new Array(cantidad).fill(Math.max(minimo, Math.min(maximo, base)));
    let suma = res.reduce((a, b) => a + b, 0);
    let diff = total - suma;

    // Ajustar
    let i = 0;
    while (diff !== 0 && i < cantidad * 20) {
        const idx = i % cantidad;
        if (diff > 0 && res[idx] + 5 <= maximo) {
            res[idx] += 5;
            diff -= 5;
        } else if (diff < 0 && res[idx] - 5 >= minimo) {
            res[idx] -= 5;
            diff += 5;
        }
        i++;
    }
    if (diff !== 0) return [];
    // Introducir un poco de variedad
    for (let j = 0; j < Math.min(cantidad - 1, 6); j++) {
        if (res[j] + 10 <= maximo && res[j + 1] - 10 >= minimo) {
            res[j] += 10;
            res[j + 1] -= 10;
        }
    }
    return res;
}

// ============================================================
// PREVISUALIZAR / GENERAR ORDEN INTELIGENTE
// ============================================================
function cargarDatosInteligentes() {
    if (!usuarioActual) return;
    document.getElementById('inteligenteEmisor').textContent = usuarioActual.nombre;
    document.getElementById('inteligenteNitEmisor').textContent = usuarioActual.nit;
    document.getElementById('inteligenteEstablecimiento').textContent = usuarioActual.empresa;
    document.getElementById('inteligenteDireccion').textContent = usuarioActual.direccion || '-';
    document.getElementById('inteligenteMontoTotal').value = '';
    document.getElementById('inteligenteCantidad').value = '';
    document.getElementById('inteligentePreview').style.display = 'none';
    document.getElementById('btnGenerarOrden').disabled = true;
    document.getElementById('sugerenciaCantidad').style.display = 'none';
}

function previsualizarOrden() {
    const montoTotal = parseFloat(document.getElementById('inteligenteMontoTotal').value) || 0;
    const cantidad = parseInt(document.getElementById('inteligenteCantidad').value) || 0;
    const minimo = parseFloat(document.getElementById('inteligenteMinimo').value) || 50;
    const maximo = parseFloat(document.getElementById('inteligenteMaximo').value) || 500;
    const tipo = document.getElementById('inteligenteCombustible').value;
    const preview = document.getElementById('inteligentePreview');
    const btn = document.getElementById('btnGenerarOrden');

    if (montoTotal <= 0 || cantidad <= 0 || minimo <= 0 || maximo <= 0 || minimo > maximo) {
        preview.style.display = 'none'; btn.disabled = true; return;
    }
    if (montoTotal % 5 !== 0) {
        alert('El monto total debe ser múltiplo de Q5');
        preview.style.display = 'none'; btn.disabled = true; return;
    }
    if (minimo % 5 !== 0 || maximo % 5 !== 0) {
        alert('Mínimo y máximo deben ser múltiplos de Q5');
        preview.style.display = 'none'; btn.disabled = true; return;
    }
    if (cantidad * minimo > montoTotal) {
        alert(`Mínimo × cantidad (${minimo * cantidad}) supera el total`);
        preview.style.display = 'none'; btn.disabled = true; return;
    }
    if (cantidad * maximo < montoTotal) {
        alert(`Máximo × cantidad (${maximo * cantidad}) es menor que el total`);
        preview.style.display = 'none'; btn.disabled = true; return;
    }

    const dist = generarDistribucionVariable(montoTotal, cantidad, minimo, maximo);
    if (!dist || dist.length !== cantidad) {
        alert('No se pudo generar una distribución válida. Prueba ajustar cantidad o rangos.');
        preview.style.display = 'none'; btn.disabled = true; return;
    }

    // Guardar temporalmente
    window._ultimaDistribucion = dist;

    preview.style.display = 'block';
    btn.disabled = false;

    document.getElementById('previewCantidad').textContent = dist.length;
    document.getElementById('previewMontoTotal').textContent = `Q ${montoTotal.toFixed(2)}`;

    const nombres = { superior: 'Superior', regular: 'Regular', diesel: 'Diésel' };
    const clases = { superior: 'superior', regular: 'regular', diesel: 'diesel' };
    document.getElementById('previewCombustible').innerHTML = `<span class="badge-combustible ${clases[tipo]}">${nombres[tipo]}</span>`;

    const detalle = document.getElementById('previewDetalle');
    detalle.innerHTML = dist.map((m, i) => `<span class="factura-item">#${i+1}: Q${m}</span>`).join('');

    document.getElementById('resumenCantidad').textContent = dist.length;
    document.getElementById('resumenTotal').textContent = `Q ${montoTotal.toFixed(2)}`;
    document.getElementById('resumenCombustible').textContent = nombres[tipo];
    document.getElementById('resumenRango').textContent = `Q${minimo} – Q${maximo}`;
    document.getElementById('resumenLote').textContent = 'Se asignará al generar';
}

function generarOrdenInteligente() {
    if (!usuarioActual) { alert('Debes iniciar sesión'); return; }
    const montoTotal = parseFloat(document.getElementById('inteligenteMontoTotal').value) || 0;
    const cantidad = parseInt(document.getElementById('inteligenteCantidad').value) || 0;
    const minimo = parseFloat(document.getElementById('inteligenteMinimo').value) || 50;
    const maximo = parseFloat(document.getElementById('inteligenteMaximo').value) || 500;
    const tipo = document.getElementById('inteligenteCombustible').value;

    const dist = window._ultimaDistribucion;
    if (!dist || dist.length !== cantidad) {
        alert('Primero calcula la distribución');
        return;
    }

    if (!confirm(`¿Generar ${cantidad} facturas por un total de Q${montoTotal.toFixed(2)}?`)) return;

    const precios = obtenerPrecios();
    let precioGalon = 0, idpGalon = 0;
    if (tipo === 'superior') {
        precioGalon = precios.superior.precio || 0;
        idpGalon = precios.superior.etanol ? 4.23 : 4.70;
    } else if (tipo === 'regular') {
        precioGalon = precios.regular.precio || 0;
        idpGalon = precios.regular.etanol ? 4.14 : 4.60;
    } else {
        precioGalon = precios.diesel.precio || 0;
        idpGalon = 1.30;
    }
    if (precioGalon <= 0) {
        alert('Primero configura los precios de combustible');
        return;
    }

    const idOrden = Date.now() + Math.floor(Math.random() * 900);
    const loteId = `L${String(idOrden).slice(-6)}`;
    const fecha = new Date().toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const nombres = { superior: 'Superior', regular: 'Regular', diesel: 'Diésel' };
    const prefijoBase = tipo === 'superior' ? 'GS' : tipo === 'regular' ? 'GR' : 'D';
    const facturasGeneradas = [];

    dist.forEach((monto, index) => {
        const cont = incrementarContador(usuarioActual.nit, prefijoBase);
        const serie = `${prefijoBase}${String(cont).padStart(2, '0')}`;

        const factor = (precioGalon + idpGalon) * 1.12;
        const galones = monto / factor;
        const subtotal = galones * precioGalon;
        const idpTotal = galones * idpGalon;
        const iva = (subtotal + idpTotal) * 0.12;
        const total = subtotal + idpTotal + iva;

        const factura = {
            id: Date.now() + Math.floor(Math.random() * 1000) + index,
            emisor: usuarioActual.nombre,
            nitEmisor: usuarioActual.nit,
            establecimiento: usuarioActual.empresa,
            direccionEmisor: usuarioActual.direccion,
            nitComprador: 'C/F',
            nombreComprador: 'Consumidor Final',
            direccionComprador: usuarioActual.direccion || '',
            tipoDocumento: 'CF',
            serie,
            numero: cont,
            fecha,
            tipoCombustible: tipo,
            monto,
            galones, idp: idpTotal, iva, subtotal, total,
            fechaGeneracion: new Date().toISOString(),
            esInteligente: true,
            ordenId: idOrden,
            lote: loteId,
            anulada: false
        };
        facturasEmitidas.push(factura);
        facturasGeneradas.push(factura);
    });

    guardarFacturasEmitidas();

    const orden = {
        id: idOrden,
        lote: loteId,
        fecha,
        montoTotal,
        cantidadFacturas: cantidad,
        tipoCombustible: tipo,
        minimo, maximo,
        facturas: facturasGeneradas.map(f => f.id)
    };
    ordenesInteligentes.push(orden);
    guardarOrdenesInteligentes();

    cargarListaFacturas();
    cargarBusquedaFacturas();
    cargarListaOrdenes();
    cargarInfoUsuario();
    llenarSelectMes();

    document.getElementById('inteligenteMontoTotal').value = '';
    document.getElementById('inteligenteCantidad').value = '';
    document.getElementById('inteligentePreview').style.display = 'none';
    document.getElementById('btnGenerarOrden').disabled = true;
    document.getElementById('sugerenciaCantidad').style.display = 'none';

    alert(`${cantidad} facturas generadas\nLote: ${loteId}\nTotal: Q${montoTotal.toFixed(2)}`);
}

function cargarListaOrdenes() {
    const tbody = document.getElementById('tablaOrdenesBody');
    if (!tbody) return;
    const mias = usuarioActual
        ? ordenesInteligentes.filter(o => {
            const f = facturasEmitidas.find(x => x.ordenId === o.id);
            return f && f.nitEmisor === usuarioActual.nit;
        })
        : ordenesInteligentes;

    if (mias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:14px;">No hay órdenes</td></tr>';
        return;
    }
    let html = '';
    [...mias].reverse().forEach((o, i) => {
        html += `<tr>
            <td>${i + 1}</td>
            <td><span class="badge-lote">${o.lote || 'L'+String(o.id).slice(-6)}</span></td>
            <td>${o.fecha}</td>
            <td><strong>${o.cantidadFacturas}</strong></td>
            <td>Q ${o.montoTotal.toFixed(2)}</td>
            <td>
                <button class="btn-ingresar btn-sm" onclick="verOrden('${o.id}')">Ver</button>
                <button class="btn-ingresar btn-sm" style="background:linear-gradient(135deg,#e65100,#bf360c);" onclick="imprimirOrden('${o.id}')">PDF</button>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function verOrden(id) {
    const orden = ordenesInteligentes.find(o => String(o.id) === String(id));
    if (!orden) { alert('Orden no encontrada'); return; }
    let msg = `ORDEN ${orden.lote || ''}\nFecha: ${orden.fecha}\nFacturas: ${orden.cantidadFacturas}\nTotal: Q${orden.montoTotal.toFixed(2)}\n\n`;
    orden.facturas.forEach((fid, i) => {
        const f = facturasEmitidas.find(x => String(x.id) === String(fid));
        if (f) msg += `${i+1}. ${f.serie}  Q${f.monto.toFixed(2)}\n`;
    });
    alert(msg);
}

// ============================================================
// BÚSQUEDA
// ============================================================
function cargarBusquedaFacturas() {
    const tbody = document.getElementById('tablaBusquedaBody');
    if (!tbody) return;
    const lista = usuarioActual
        ? facturasEmitidas.filter(f => f.nitEmisor === usuarioActual.nit)
        : facturasEmitidas;

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding:14px;">No hay facturas</td></tr>';
        document.getElementById('contadorBusqueda').textContent = '0 facturas';
        return;
    }

    let html = '';
    [...lista].reverse().forEach(f => {
        const clase = f.anulada ? ' class="anulada"' : '';
        const lote = f.lote ? `<span class="badge-lote">${f.lote}</span>` : '-';
        const estado = f.anulada ? ' <span class="badge-anulada">Anulada</span>' : '';
        html += `<tr${clase} data-busqueda="${f.serie} ${f.fecha} ${f.nombreComprador} ${f.nitComprador} ${f.total} ${f.lote || ''} ${f.monto}">
            <td><strong>${f.serie}</strong>${estado}</td>
            <td>${f.fecha}</td>
            <td>${f.nombreComprador}</td>
            <td>${f.nitComprador}</td>
            <td>Q ${f.total.toFixed(2)}</td>
            <td>${lote}</td>
            <td>
                <button class="btn-ingresar btn-sm" onclick="verFactura('${f.id}')">Ver</button>
                <button class="btn-ingresar btn-sm" style="background:linear-gradient(135deg,#e65100,#bf360c);" onclick="imprimirPDF('${f.id}')">PDF</button>
                ${!f.anulada ? `<button class="btn-danger" onclick="anularFactura('${f.id}')">Anular</button>
                <button class="btn-danger" onclick="eliminarFactura('${f.id}')">Eliminar</button>` : ''}
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
    document.getElementById('contadorBusqueda').textContent = `${lista.length} facturas`;
    document.getElementById('sinResultadosBusqueda').style.display = 'none';
    document.getElementById('busquedaFactura').value = '';
}

function filtrarFacturasBusqueda() {
    const q = document.getElementById('busquedaFactura').value.toLowerCase().trim();
    const filas = document.querySelectorAll('#tablaBusquedaBody tr');
    let visibles = 0;
    filas.forEach(fila => {
        if (fila.querySelector('.text-muted')) return;
        const datos = (fila.getAttribute('data-busqueda') || '').toLowerCase();
        if (!q || datos.includes(q)) {
            fila.style.display = '';
            visibles++;
        } else {
            fila.style.display = 'none';
        }
    });
    document.getElementById('contadorBusqueda').textContent = `${visibles} facturas`;
    document.getElementById('sinResultadosBusqueda').style.display = (visibles === 0 && q) ? 'block' : 'none';
}

function limpiarBusqueda() {
    document.getElementById('busquedaFactura').value = '';
    filtrarFacturasBusqueda();
}

// ============================================================
// VER / IMPRIMIR FACTURA
// ============================================================
function verFactura(id) {
    const f = facturasEmitidas.find(x => String(x.id) === String(id))
           || facturasAnuladas.find(x => String(x.id) === String(id));
    if (!f) { alert('Factura no encontrada'); return; }
    verFacturaObj(f);
}

function verFacturaObj(f) {
    const estado = f.anulada ? ' (ANULADA)' : '';
    const msg = `FACTURA${estado}
═══════════════════════════════════
Emisor: ${f.emisor}
NIT: ${f.nitEmisor}
Establecimiento: ${f.establecimiento}
Dirección: ${f.direccionEmisor}
═══════════════════════════════════
Comprador: ${f.nombreComprador}
NIT: ${f.nitComprador}
Dirección: ${f.direccionComprador}
═══════════════════════════════════
Serie: ${f.serie}   Número: ${f.numero}
Fecha: ${f.fecha}
${f.lote ? 'Lote: ' + f.lote + '\n' : ''}═══════════════════════════════════
Combustible: ${f.tipoCombustible}
Total pagado: Q ${f.monto.toFixed(2)}
Galones: ${f.galones.toFixed(4)}
Subtotal: Q ${f.subtotal.toFixed(2)}
IDP: Q ${f.idp.toFixed(2)}
IVA 12%: Q ${f.iva.toFixed(2)}
TOTAL: Q ${f.total.toFixed(2)}
═══════════════════════════════════
Sujeto a retención definitiva ISR
Sujeto a pagos trimestrales ISR`;
    alert(msg);
}

function imprimirPDF(id) {
    const f = facturasEmitidas.find(x => String(x.id) === String(id))
           || facturasAnuladas.find(x => String(x.id) === String(id));
    if (!f) { alert('Factura no encontrada'); return; }

    const nombreComb = { superior: 'Gasolina Superior', regular: 'Gasolina Regular', diesel: 'Diésel' }[f.tipoCombustible] || f.tipoCombustible;
    const anuladaTag = f.anulada ? '<div style="text-align:center;color:#c62828;font-weight:700;font-size:14px;margin:8px 0;">*** ANULADA ***</div>' : '';

    // Código de barras simple con CSS (barras verticales simuladas)
    const barcode = generarBarcodeHTML(f.serie + f.numero);

    const html = `<!DOCTYPE html><html><head><title>Factura ${f.serie}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,Helvetica,sans-serif;width:320px;margin:0 auto;padding:16px;font-size:12px;color:#111;}
  .logo{text-align:center;margin-bottom:8px;}
  .logo img{max-width:80px;max-height:80px;}
  .empresa{text-align:center;font-weight:700;font-size:14px;margin-bottom:2px;}
  .datos-emp{text-align:center;font-size:11px;line-height:1.4;margin-bottom:10px;}
  .titulo{text-align:center;font-weight:700;font-size:13px;border-top:1px dashed #333;border-bottom:1px dashed #333;padding:6px 0;margin:8px 0;}
  .barcode{text-align:center;margin:8px 0;}
  .row{display:flex;justify-content:space-between;margin:3px 0;}
  .label{font-weight:600;}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11px;}
  th,td{padding:4px 2px;text-align:left;border-bottom:1px solid #ddd;}
  th{font-weight:700;}
  .totales{margin-top:8px;font-size:12px;}
  .totales .row{margin:2px 0;}
  .total-final{font-size:16px;font-weight:700;text-align:right;margin-top:6px;}
  .frase{text-align:center;font-size:10px;font-weight:600;color:#e65100;margin-top:12px;padding-top:8px;border-top:1px solid #333;}
  .footer{text-align:center;font-size:10px;color:#666;margin-top:10px;}
</style></head><body>
  <div class="logo"><img src="SX/Logo.png" onerror="this.style.display='none'"></div>
  <div class="empresa">SAFgt</div>
  <div class="datos-emp">
    ${f.emisor}<br>
    NIT: ${f.nitEmisor}<br>
    ${f.establecimiento}<br>
    ${f.direccionEmisor || ''}
  </div>
  <div class="titulo">FACTURA ELECTRÓNICA DE VENTA<br>No. ${f.serie}</div>
  ${anuladaTag}
  <div class="barcode">${barcode}</div>
  <div class="row"><span class="label">Fecha:</span><span>${f.fecha}</span></div>
  <div class="row"><span class="label">Cliente:</span><span>${f.nombreComprador}</span></div>
  <div class="row"><span class="label">NIT:</span><span>${f.nitComprador}</span></div>
  <div class="row"><span class="label">Dirección:</span><span>${f.direccionComprador || '-'}</span></div>
  <table>
    <thead><tr><th>Cant</th><th>Detalle</th><th>Total</th></tr></thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>${nombreComb}<br><small>${f.galones.toFixed(4)} gal</small></td>
        <td>Q ${f.total.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totales">
    <div class="row"><span>Subtotal:</span><span>Q ${f.subtotal.toFixed(2)}</span></div>
    <div class="row"><span>IDP:</span><span>Q ${f.idp.toFixed(2)}</span></div>
    <div class="row"><span>IVA 12%:</span><span>Q ${f.iva.toFixed(2)}</span></div>
    <div class="total-final">Total: Q ${f.total.toFixed(2)}</div>
  </div>
  <div class="frase">Sujeto a retención definitiva ISR / Sujeto a pagos trimestrales ISR</div>
  <div class="footer">Generado: ${new Date().toLocaleString('es-GT')}<br>SAFgt · Facturación</div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) { alert('Permite ventanas emergentes para imprimir'); return; }
    w.document.write(html);
    w.document.close();
}

function generarBarcodeHTML(texto) {
    // Genera barras simples basadas en el código
    let bars = '';
    for (let i = 0; i < texto.length; i++) {
        const code = texto.charCodeAt(i);
        const w = (code % 3) + 1;
        bars += `<span style="display:inline-block;width:${w}px;height:40px;background:#000;margin:0 0.5px;"></span>`;
        bars += `<span style="display:inline-block;width:1px;height:40px;background:#fff;"></span>`;
    }
    return `<div style="letter-spacing:0;">${bars}</div><div style="font-size:10px;margin-top:2px;">${texto}</div>`;
}

function imprimirOrden(id) {
    const orden = ordenesInteligentes.find(o => String(o.id) === String(id));
    if (!orden) { alert('Orden no encontrada'); return; }
    // Imprimir resumen de la orden
    let filas = '';
    orden.facturas.forEach((fid, i) => {
        const f = facturasEmitidas.find(x => String(x.id) === String(fid));
        if (f) {
            filas += `<tr><td>${i+1}</td><td>${f.serie}</td><td>Q ${f.monto.toFixed(2)}</td><td>${f.galones.toFixed(4)}</td><td>Q ${f.total.toFixed(2)}</td></tr>`;
        }
    });
    const html = `<!DOCTYPE html><html><head><title>Orden ${orden.lote}</title>
<style>body{font-family:Arial;padding:30px;font-size:13px;} table{width:100%;border-collapse:collapse;margin-top:15px;} th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;} th{background:#1a3a5c;color:#fff;}</style></head>
<body>
<h2>Orden ${orden.lote || ''}</h2>
<p>Fecha: ${orden.fecha} · Facturas: ${orden.cantidadFacturas} · Total: Q ${orden.montoTotal.toFixed(2)}</p>
<table><thead><tr><th>#</th><th>Serie</th><th>Monto</th><th>Galones</th><th>Total</th></tr></thead><tbody>${filas}</tbody></table>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { alert('Permite ventanas emergentes'); return; }
    w.document.write(html);
    w.document.close();
}

// ============================================================
// ENTER KEY
// ============================================================
function configurarEnter() {
    const bindEnter = (ids, fn) => {
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (i === ids.length - 1) fn();
                    else {
                        const next = document.getElementById(ids[i + 1]);
                        if (next) next.focus();
                    }
                }
            });
        });
    };
    bindEnter(['nitLogin', 'passLogin'], loginUsuario);
    bindEnter(['passAuditor'], loginAuditor);
    bindEnter(['nitRegistro','nombreRegistro','empresaRegistro','direccionRegistro','passRegistro'], registrarContribuyente);
    bindEnter(['precioSuperior','precioRegular','precioDiesel'], guardarConfiguracionCombustible);
    bindEnter(['inteligenteMontoTotal','inteligenteCantidad'], previsualizarOrden);
    bindEnter(['passSuperuser'], loginSuperuser);
}

// Click fuera de sugerencias
document.addEventListener('click', e => {
    const sug = document.getElementById('sugerenciasNIT');
    if (sug && !sug.contains(e.target) && e.target.id !== 'nitComprador') {
        sug.style.display = 'none';
    }
});

// Arrancar
init();
