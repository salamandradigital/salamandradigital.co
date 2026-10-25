// Cierra el aviso de privacidad. No guarda nada en el navegador.
document.addEventListener('DOMContentLoaded', function () {
  var aviso = document.getElementById('aviso');
  var ok = aviso && aviso.querySelector('.aviso__ok');
  if (ok) ok.addEventListener('click', function () { aviso.hidden = true; });
});
