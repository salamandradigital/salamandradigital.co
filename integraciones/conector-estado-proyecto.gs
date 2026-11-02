/**
 * Conector · Estado de tu proyecto digital → Pipeline Comercial 2026
 *
 * El formulario del sitio (site/enviar-estado.php) ya envía los correos. Este script solo
 * guarda cada estado como una fila en la pestaña "Leads Estado" del Pipeline Comercial.
 *
 * Instalación (una sola vez):
 *   1. Abrir "Pipeline Comercial 2026 - Salamandra" → Extensiones → Apps Script.
 *   2. Pegar este archivo completo. Cambiar TOKEN por una clave larga inventada (40 caracteres o más).
 *   3. Ejecutar la función "probar" y autorizar el acceso a la hoja: debe aparecer la pestaña con una fila.
 *   4. Implementar → Nueva implementación → Aplicación web. Ejecutar como: Yo. Acceso: Cualquier persona.
 *   5. En el servidor, FUERA de la carpeta pública, crear /home/belltehp/salamandra-config.php con:
 *        <?php return ['sheets_url' => 'URL que termina en /exec', 'sheets_token' => 'la misma TOKEN'];
 *      (Un solo archivo sirve para producción y staging. No se sube al repositorio.)
 *   6. Si se cambia el código: Implementar → Gestionar implementaciones → Editar → Nueva versión.
 */

const TOKEN = 'CAMBIAR-POR-UNA-CLAVE-LARGA';
const PESTANA = 'Leads Estado';
const COLUMNAS = [
  'Fecha', 'Nombre', 'Correo', 'WhatsApp', 'Negocio', 'Consentimiento', 'Origen',
  'Proyecto', 'Tipo', 'Inicio', 'Entrega', 'Avance %', 'Estado general',
  'Inicio (fase)', 'Planificación', 'Ejecución', 'Seguimiento y control', 'Cierre',
  'Dónde está atascado', 'Lo que el cliente ve trabado', 'Decisiones pendientes',
  'Hecho', 'Falta', 'Proveedores', 'Relato', 'Revisado por Vilma', 'Estado del contacto'
];

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (TOKEN.indexOf('CAMBIAR') === 0 || d.token !== TOKEN) return respuesta({ ok: false });
    const f = Array.isArray(d.fases) ? d.fases : [];
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      obtenerHoja().appendRow([
        new Date(), limpio(d.nombre, 120), limpio(d.correo, 160), limpio(d.whatsapp, 30), limpio(d.negocio, 120), 'Sí', 'Estado de proyecto',
        limpio(d.proyecto, 120), limpio(d.tipo, 60), limpio(d.inicio, 10), limpio(d.entrega, 10), Number(d.avance) || 0, limpio(d.estado_general, 60),
        limpio(f[0], 10), limpio(f[1], 10), limpio(f[2], 10), limpio(f[3], 10), limpio(f[4], 10),
        limpio(d.atasco, 600), limpio(d.trabado, 1500), lista(d.decisiones),
        lista(d.hecho), lista(d.falta), Number(d.proveedores) || 0, limpio(d.relato, 6000), 'No', 'Nuevo'
      ]);
    } finally {
      lock.releaseLock();
    }
    return respuesta({ ok: true });
  } catch (err) {
    console.error(err);
    return respuesta({ ok: false });
  }
}

function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(PESTANA);
  if (!hoja) {
    hoja = libro.insertSheet(PESTANA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
  }
  return hoja;
}

function limpio(v, max) {
  let s = String(v == null ? '' : v).trim();
  // Evita que un texto que empiece con =, +, - o @ se interprete como fórmula
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s.slice(0, max);
}

function lista(v) {
  return Array.isArray(v) ? limpio(v.map(x => '• ' + x).join('\n'), 2000) : limpio(v, 2000);
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Prueba desde el editor: ejecutar "probar" y revisar la pestaña Leads Estado. Borrar la fila después. */
function probar() {
  doPost({ postData: { contents: JSON.stringify({
    token: TOKEN, nombre: 'Prueba', correo: 'prueba@ejemplo.com', negocio: 'Prueba interna',
    proyecto: 'Proyecto de prueba', tipo: 'Web nueva o rediseño', avance: 50, estado_general: 'En riesgo',
    fases: ['Débil', 'Roto', 'Débil', 'Roto', 'Bien'], atasco: 'Prueba del conector.', decisiones: ['Decisión de prueba']
  }) } });
}
