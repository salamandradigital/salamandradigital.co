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

// Lista "¿Te suena?": marcar lo que le pasa al visitante. No guarda nada.
(function () {
  function iniciar() {
    var items = document.querySelectorAll('.mirror__item');
    var out = document.getElementById('mirror-count');
    if (!items.length || !out) return;
    items.forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        var n = document.querySelectorAll('.mirror__item[aria-pressed="true"]').length;
        out.hidden = n === 0;
        out.textContent = n >= 2
          ? 'Marcaste ' + n + '. Tu proyecto necesita a alguien que responda por él completo.'
          : 'Marcaste 1. Sigue: ¿te pasa alguna otra?';
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
