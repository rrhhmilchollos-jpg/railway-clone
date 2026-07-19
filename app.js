const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ENV_PATH = path.join(__dirname, '.env');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;

if (!fs.existsSync(ENV_PATH)) {
    fs.writeFileSync(ENV_PATH, 'PORT=5001\nNODE_ENV=production\n');
    console.log('Aviso: se creó un .env vacío. Rellena tus variables reales a mano en el servidor.');
}

if (!ADMIN_TOKEN) {
    console.warn('AVISO DE SEGURIDAD: ADMIN_TOKEN no está definido. Las rutas /api/get-vars, /api/save-vars y /api/logs quedan sin protección. Define ADMIN_TOKEN en el entorno para protegerlas.');
}

function isAuthorized(req) {
    if (!ADMIN_TOKEN) return true;
    return req.headers['x-admin-token'] === ADMIN_TOKEN;
}

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
    }

    if (req.url === '/api/status') {
        exec('docker ps --format "{{.Names}}"', (err, stdout) => {
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
            res.end(JSON.stringify({ active: stdout || '' }));
        });
        return;
    }

    if (req.url === '/api/get-vars') {
        if (!isAuthorized(req)) { res.writeHead(401); res.end('No autorizado'); return; }
        const vars = fs.readFileSync(ENV_PATH, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ env: vars }));
        return;
    }

    if (req.url === '/api/save-vars' && req.method === 'POST') {
        if (!isAuthorized(req)) { res.writeHead(401); res.end('No autorizado'); return; }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            fs.writeFileSync(ENV_PATH, body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Variables guardadas.' }));
        });
        return;
    }

    if (req.url.startsWith('/api/logs/')) {
        if (!isAuthorized(req)) { res.writeHead(401); res.end('No autorizado'); return; }
        const service = req.url.split('/').pop();
        let dockerCmd = 'docker logs --tail 30 coolify';
        if (service === 'Postgres') dockerCmd = 'docker logs --tail 30 postgres-zocoia-postgres-1';
        if (service === 'backend') dockerCmd = 'docker logs --tail 30 coolify';

        exec(dockerCmd, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(stdout || stderr || 'Sin datos de log.');
        });
        return;
    }

    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
        return;
    }

    res.writeHead(404);
    res.end('No encontrado');
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
