# salamandradigital.co

Sitio web de Salamandra Digital. HTML y CSS estáticos, sin cookies ni rastreadores.

## Estructura
- `site/`: lo que se publica (raíz pública del dominio).
- `site/.htaccess`: URLs sin `.html`, HTTPS, cabeceras de seguridad (CSP estricta) y caché.
- `site/enviar-chequeo.php`: formulario del Chequeo de Privacidad. Envía por correo, no guarda datos del formulario y limita a 3 envíos por hora por conexión.
- `.github/workflows/deploy.yml`: despliegue por rsync sobre SSH.

## Ramas y despliegue
| Rama | Publica en | Carpeta en el servidor |
| --- | --- | --- |
| `develop` | staging.salamandradigital.co (no indexable) | `/home/belltehp/staging.salamandradigital.co/` |
| `main` | salamandradigital.co | `/home/belltehp/salamandradigital.co/` |

Secretos requeridos (Settings → Secrets and variables → Actions): `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`.

El despliegue usa `--delete`: lo que no esté en `site/` se borra del servidor, salvo `.well-known/`, `cgi-bin/`, `error_log`, `.user.ini`, `php.ini` y `.ftpquota`.

## Reglas
- Sin JavaScript ni estilos en línea: la CSP los bloquea. Usar `assets/site.js` y `assets/style.css`.
- Enlaces internos sin extensión `.html`.
- No subir secretos ni llaves al repositorio.
