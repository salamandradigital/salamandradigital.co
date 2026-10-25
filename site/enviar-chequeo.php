<?php
// Recibe el formulario del Chequeo de Privacidad y lo envía por correo.
// No guarda los datos del formulario. Para frenar abusos guarda, durante una hora,
// una huella cifrada de la IP (no la IP) y la hora de cada envío.
declare(strict_types=1);

const DESTINO = 'contacto@salamandradigital.co';
const MAX_ENVIOS = 3;          // por IP
const VENTANA = 3600;          // segundos

function volver(string $ruta): void { header('Location: ' . $ruta, true, 303); exit; }
function error_formulario(int $codigo, string $texto): void {
  http_response_code($codigo);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Chequeo de Privacidad</title>'
     . '<link rel="stylesheet" href="/assets/style.css"><main class="legal"><h1>No pudimos enviar tu solicitud</h1><p>'
     . htmlspecialchars($texto, ENT_QUOTES, 'UTF-8')
     . '</p><p><a href="/chequeo-enviar">Volver al formulario</a></p></main></html>';
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') volver('/chequeo-enviar');
if (!empty($_POST['sitio_web'])) volver('/chequeo-recibido'); // trampa para bots

// Solo aceptar envíos que vienen de nuestro propio sitio
$origen = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origen !== '' && parse_url($origen, PHP_URL_HOST) !== $host) error_formulario(403, 'El envío no viene de nuestro sitio.');

// Límite de envíos por IP
$huella = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . __FILE__ . '|salamandra');
$archivo = sys_get_temp_dir() . '/sd_chequeo_' . substr($huella, 0, 32);
$ahora = time();
$marcas = is_file($archivo) ? array_filter(array_map('intval', file($archivo, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > $ahora - VENTANA) : [];
if (count($marcas) >= MAX_ENVIOS) error_formulario(429, 'Recibimos varias solicitudes seguidas desde tu conexión. Intenta de nuevo en una hora o escríbenos a ' . DESTINO . '.');

function limpio(string $k, int $max): string {
  $v = is_string($_POST[$k] ?? null) ? $_POST[$k] : '';
  return trim(mb_substr(str_replace(["\r", "\n", "\0"], ' ', strip_tags($v)), 0, $max));
}
$nombre = limpio('nombre', 120);
$correo = filter_var(limpio('correo', 160), FILTER_VALIDATE_EMAIL);
$web    = filter_var(limpio('web', 300), FILTER_VALIDATE_URL);
$pagina = limpio('pagina', 300);
if ($pagina !== '' && !filter_var($pagina, FILTER_VALIDATE_URL)) $pagina = '';
$autoriza = ($_POST['autoriza'] ?? '') === 'si';
$politica = ($_POST['politica'] ?? '') === 'si';

if ($nombre === '' || !$correo || !$web || !$autoriza || !$politica || !preg_match('#^https?://#i', (string)$web)) {
  error_formulario(400, 'Faltan datos o la dirección de la web no es válida.');
}

$asunto = 'Chequeo de Privacidad: ' . $web;
$cuerpo = "Nueva solicitud de Chequeo de Privacidad\n\n"
  . "Nombre: $nombre\nCorreo: $correo\nWeb: $web\nPágina adicional: " . ($pagina ?: '-') . "\n"
  . "Autoriza la revisión (dueño o representante): sí\nAcepta la política de privacidad: sí\n"
  . 'Fecha: ' . date('Y-m-d H:i') . "\n";
$cabeceras = "From: Salamandra Digital <" . DESTINO . ">\r\nReply-To: $correo\r\nContent-Type: text/plain; charset=UTF-8\r\n";

if (!mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras)) {
  error_formulario(500, 'Hubo un problema al enviar. Escríbenos a ' . DESTINO . '.');
}
$marcas[] = $ahora;
@file_put_contents($archivo, implode("\n", $marcas), LOCK_EX);
volver('/chequeo-recibido');
