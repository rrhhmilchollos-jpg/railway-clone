# creatuwebyappgratis.com — Panel de Control

Infraestructura tipo Railway para el despliegue de backends, bases de datos y repositorios de GitHub. Este repositorio contiene el panel de control que corre en producción en [https://creatuwebyappgratis.com](https://creatuwebyappgratis.com), desplegado sobre Coolify.

## Arquitectura

| Componente | Descripción |
|---|---|
| `app.js` | Servidor HTTP de Node.js (sin dependencias externas) que sirve el panel y la API |
| `index.html` | Interfaz visual del panel de control |
| `Dockerfile` | Imagen de producción usada por Coolify (build pack: Dockerfile) |
| `docker-compose.yml` | Orquestación local opcional (app + Postgres + MongoDB) |
| `digitalocean.yml` | Workflow de despliegue legado (no usado por Coolify) |

## Endpoints de la API

| Ruta | Método | Protección | Descripción |
|---|---|---|---|
| `/health` | GET | Pública | Health check (devuelve `OK`) |
| `/api/status` | GET | Pública | Lista los contenedores Docker activos |
| `/api/get-vars` | GET | `ADMIN_TOKEN` | Devuelve las variables de entorno guardadas |
| `/api/save-vars` | POST | `ADMIN_TOKEN` | Guarda el bloque de variables de entorno |
| `/api/logs/{servicio}` | GET | `ADMIN_TOKEN` | Devuelve los últimos logs del servicio |

Las rutas protegidas requieren la cabecera `x-admin-token` con el valor del `ADMIN_TOKEN` configurado en el entorno.

## Configuración

1. Copia `.env.example` a `.env` y rellena los valores reales.
2. **Nunca** subas el `.env` real a GitHub: está excluido en `.gitignore` y las claves reales viven únicamente en las variables de entorno de Coolify (Application → Environment Variables).
3. Genera un token de administración seguro: `openssl rand -hex 24`.

## Despliegue en producción (Coolify)

La aplicación se despliega automáticamente: cada push a la rama `main` dispara un nuevo despliegue en Coolify, que construye la imagen con el `Dockerfile` y publica en:

- https://creatuwebyappgratis.com
- https://api.creatuwebyappgratis.com

Los certificados TLS (Let's Encrypt) se gestionan automáticamente mediante Traefik.

## Desarrollo local

```bash
cp .env.example .env   # rellena tus valores
npm start              # arranca en http://localhost:5001
```

## Seguridad

- El `.env` real no existe en este repositorio ni en su historial.
- Todas las credenciales (MongoDB, Redis, ADMIN_TOKEN) se inyectan como variables de entorno en Coolify.
- Si una credencial se filtra, rótala inmediatamente y actualízala solo en Coolify.
