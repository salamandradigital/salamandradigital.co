<?php
// Recibe el recurso "¿En qué estado está tu proyecto digital?" (JSON desde assets/estado.js).
// 1. Envía a Salamandra el estado completo para revisarlo.
// 2. Envía al visitante una copia de su estado.
// 3. Si existe la configuración privada del servidor, registra el estado en la hoja del pipeline (Google Apps Script).
// No guarda los datos en este servidor. Para frenar abusos guarda, durante una hora,
// una huella cifrada de la IP (no la IP) y la hora de cada envío.
declare(strict_types=1);

const DESTINO = 'contacto@salamandradigital.co';
const EVALUACION = 'https://calendly.com/salamandrradigital/evaluacion';
const POLITICA = 'https://salamandradigital.co/privacidad';
const MAX_ENVIOS = 5;          // por IP
const VENTANA = 3600;          // segundos

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
function responder(int $codigo, array $datos): void { http_response_code($codigo); echo json_encode($datos); exit; }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(405, ['ok' => false]);

// Solo aceptar envíos que vienen de nuestro propio sitio
$origen = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$host = preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? ''));
if ($origen !== '' && parse_url($origen, PHP_URL_HOST) !== $host) responder(403, ['ok' => false]);

$crudo = file_get_contents('php://input', false, null, 0, 40000);
$d = json_decode($crudo ?: '', true);
if (!is_array($d)) responder(400, ['ok' => false]);
if (!empty($d['sitio_web'])) responder(200, ['ok' => true]); // trampa para bots

// Límite de envíos por IP
$huella = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . __FILE__ . '|salamandra');
$archivo = sys_get_temp_dir() . '/sd_estado_' . substr($huella, 0, 32);
$ahora = time();
$marcas = is_file($archivo) ? array_filter(array_map('intval', file($archivo, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > $ahora - VENTANA) : [];
if (count($marcas) >= MAX_ENVIOS) responder(429, ['ok' => false]);

function txt($v, int $max, bool $unaLinea = true): string {
  $v = is_scalar($v) ? (string)$v : '';
  $v = strip_tags(str_replace("\0", '', $v));
  if ($unaLinea) $v = str_replace(["\r", "\n"], ' ', $v);
  return trim(mb_substr($v, 0, $max));
}
function lista($v, int $max): array {
  if (!is_array($v)) return [];
  return array_slice(array_values(array_filter(array_map(fn($x) => txt($x, 300), $v), 'strlen')), 0, $max);
}

$nombre   = txt($d['nombre'] ?? '', 120);
$correo   = filter_var(txt($d['correo'] ?? '', 160), FILTER_VALIDATE_EMAIL);
$negocio  = txt($d['negocio'] ?? '', 120);
$whatsapp = txt($d['whatsapp'] ?? '', 30);
$autoriza = ($d['autoriza'] ?? false) === true;
if ($nombre === '' || !$correo || !$autoriza) responder(400, ['ok' => false]);

$proyecto = txt($d['proyecto'] ?? '', 120);
$tipo     = txt($d['tipo'] ?? '', 60);
$inicio   = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($d['inicio'] ?? '')) ? $d['inicio'] : '';
$entrega  = preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($d['entrega'] ?? '')) ? $d['entrega'] : '';
$avance   = max(0, min(100, (int)($d['avance'] ?? 0)));
$general  = txt($d['estado_general'] ?? '', 60);
$fases    = lista($d['fases'] ?? [], 5);
$atasco   = txt($d['atasco'] ?? '', 600);
$trabado  = txt($d['trabado'] ?? '', 1500);
$decis    = lista($d['decisiones'] ?? [], 20);
$hecho    = lista($d['hecho'] ?? [], 30);
$falta    = lista($d['falta'] ?? [], 30);
$prov     = max(0, min(3, (int)($d['proveedores'] ?? 0)));
$relato   = txt($d['relato'] ?? '', 6000, false);
$estado   = txt($d['estado_texto'] ?? '', 8000, false);

function enviar_correo(string $para, string $asunto, string $cuerpo, string $responderA): bool {
  $cab = "From: Salamandra Digital <" . DESTINO . ">\r\nReply-To: $responderA\r\nContent-Type: text/plain; charset=UTF-8\r\n";
  return mail($para, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cab);
}

// 1. Aviso a Salamandra
$puntos = fn(array $a) => $a ? '- ' . implode("\n- ", $a) : '-';
$interno = "Nuevo estado de proyecto (origen: Estado de proyecto)\n\n"
  . "Nombre: $nombre\nCorreo: $correo\nWhatsApp: " . ($whatsapp ?: '-') . "\nNegocio: " . ($negocio ?: '-') . "\n"
  . "Autoriza el tratamiento de datos: sí\nFecha: " . date('Y-m-d H:i') . "\n\n"
  . "Proyecto: " . ($proyecto ?: '-') . ' · ' . ($tipo ?: '-') . "\nInicio: " . ($inicio ?: '-') . " · Entrega: " . ($entrega ?: '-') . " · Avance: $avance% · Proveedores: $prov\n\n"
  . $estado . "\n\n"
  . "Lo que ve trabado: " . ($trabado ?: '-') . "\n\nHecho:\n" . $puntos($hecho) . "\n\nFalta:\n" . $puntos($falta) . "\n\n"
  . "Relato:\n" . ($relato ?: '-') . "\n\nRevísalo antes de cualquier contacto.\n";
$okInterno = enviar_correo(DESTINO, 'Nuevo estado de proyecto: ' . ($negocio ?: $nombre) . ' · ' . $general, $interno, (string)$correo);

// 2. Copia al visitante
$copia = "$nombre, aquí tienes el estado de tu proyecto tal como lo contaste.\n\n"
  . $estado . "\n\n"
  . "Si solo vas a hacer una cosa esta semana, que sea el paso 1.\n\n"
  . "Este estado es orientativo y se basa solo en lo que contaste. Si quieres revisarlo con nosotros, "
  . "puedes agendar una evaluación gratuita de 30 minutos: " . EVALUACION . "\n\n"
  . "Vilma Fajardo\nSalamandra Digital · El sistema que hace que tu negocio funcione\n\n"
  . "Recibes este correo porque pediste tu estado en salamandradigital.co. Si quieres que borremos tus datos, "
  . "escribe a " . DESTINO . ". Política de tratamiento de datos: " . POLITICA . "\n";
$okCopia = enviar_correo((string)$correo, 'El estado de tu proyecto digital', $copia, DESTINO);

// 3. Registro en la hoja del pipeline (opcional). La configuración vive fuera de la carpeta pública y del repositorio:
//    <?php return ['sheets_url' => 'https://script.google.com/macros/s/.../exec', 'sheets_token' => '...'];
$cfgArchivo = dirname(__DIR__) . '/salamandra-config.php';
$cfg = is_file($cfgArchivo) ? (include $cfgArchivo) : [];
if (is_array($cfg) && !empty($cfg['sheets_url']) && !empty($cfg['sheets_token']) && function_exists('curl_init')) {
  $fila = [
    'token' => $cfg['sheets_token'], 'nombre' => $nombre, 'correo' => $correo, 'whatsapp' => $whatsapp, 'negocio' => $negocio,
    'proyecto' => $proyecto, 'tipo' => $tipo, 'inicio' => $inicio, 'entrega' => $entrega, 'avance' => $avance,
    'estado_general' => $general, 'fases' => $fases, 'atasco' => $atasco, 'trabado' => $trabado,
    'decisiones' => $decis, 'hecho' => $hecho, 'falta' => $falta, 'proveedores' => $prov, 'relato' => $relato
  ];
  $ch = curl_init((string)$cfg['sheets_url']);
  curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($fila), CURLOPT_HTTPHEADER => ['Content-Type: text/plain;charset=utf-8'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 8]);
  curl_exec($ch);
  curl_close($ch);
}

$marcas[] = $ahora;
@file_put_contents($archivo, implode("\n", $marcas), LOCK_EX);
responder(200, ['ok' => $okCopia]);
