<?php
// Recibe el formulario del Chequeo de Privacidad y lo envía por correo. No guarda datos en el servidor.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: chequeo-enviar.html'); exit; }
if (!empty($_POST['sitio_web'])) { header('Location: chequeo-recibido.html'); exit; } // trampa para bots
function limpio($k, $max) { return trim(substr(str_replace(array("\r", "\n"), ' ', strip_tags($_POST[$k] ?? '')), 0, $max)); }
$nombre = limpio('nombre', 120);
$correo = filter_var(limpio('correo', 160), FILTER_VALIDATE_EMAIL);
$web = filter_var(limpio('web', 300), FILTER_VALIDATE_URL);
$pagina = limpio('pagina', 300);
$autoriza = ($_POST['autoriza'] ?? '') === 'si';
$politica = ($_POST['politica'] ?? '') === 'si';
if (!$nombre || !$correo || !$web || !$autoriza || !$politica || !preg_match('#^https?://#i', $web)) {
  http_response_code(400);
  echo '<!doctype html><meta charset="utf-8"><p style="font-family:sans-serif">Faltan datos o la dirección no es válida. <a href="chequeo-enviar.html">Volver al formulario</a>.</p>';
  exit;
}
$para = 'contacto@salamandradigital.co';
$asunto = 'Chequeo de Privacidad: ' . $web;
$cuerpo = "Nueva solicitud de Chequeo de Privacidad\n\n"
  . "Nombre: $nombre\nCorreo: $correo\nWeb: $web\nPágina adicional: " . ($pagina ?: '-') . "\n"
  . "Autoriza la revisión (dueño o representante): sí\nAcepta la política de privacidad: sí\n"
  . "Fecha: " . date('Y-m-d H:i') . "\n";
$cabeceras = "From: Salamandra Digital <contacto@salamandradigital.co>\r\nReply-To: $correo\r\nContent-Type: text/plain; charset=UTF-8\r\n";
mail($para, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras);
header('Location: chequeo-recibido.html');
exit;
