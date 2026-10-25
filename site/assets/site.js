// Aviso de privacidad: se oculta durante la sesión cuando el visitante da "Entendido".
// Usa sessionStorage (no es una cookie): guarda solo "1" y el navegador lo borra al cerrar la pestaña.
(function () {
  var CLAVE = 'sd_aviso_visto';
  function visto() { try { return sessionStorage.getItem(CLAVE) === '1'; } catch (e) { return false; } }
  function marcar() { try { sessionStorage.setItem(CLAVE, '1'); } catch (e) {} }
  function iniciar() {
    var aviso = document.getElementById('aviso');
    if (!aviso) return;
    if (visto()) { aviso.hidden = true; return; }
    aviso.hidden = false;
    var ok = aviso.querySelector('.aviso__ok');
    if (ok) ok.addEventListener('click', function () { aviso.hidden = true; marcar(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
