import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..', '..', '..', '..');

function parseArgs(argv) {
  const args = {
    host: '127.0.0.1',
    port: 1420,
    root: DEFAULT_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];
    if ((token === '--port' || token === '-p') && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.port = parsed;
      }
      index += 1;
      continue;
    }
    if ((token === '--host' || token === '-h') && next) {
      args.host = next;
      index += 1;
      continue;
    }
    if ((token === '--root' || token === '-r') && next) {
      args.root = path.resolve(process.cwd(), next);
      index += 1;
    }
  }

  return args;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
};

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function normalizePathname(urlPathname) {
  try {
    return decodeURIComponent(urlPathname);
  } catch (_error) {
    return urlPathname;
  }
}

function resolveRequestPath(rootDir, requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const requestedPath = normalizePathname(url.pathname || '/');
  const unsafePath = requestedPath === '/' ? '/index.html' : requestedPath;
  const absolutePath = path.resolve(rootDir, `.${unsafePath}`);
  const normalizedRoot = path.resolve(rootDir);
  if (!absolutePath.startsWith(normalizedRoot)) {
    return null;
  }
  return absolutePath;
}

function serveFile(response, filePath, method) {
  try {
    const stat = fs.statSync(filePath);
    let finalPath = filePath;
    if (stat.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
    }

    const fileBuffer = fs.readFileSync(finalPath);
    const headers = {
      'Content-Type': contentTypeFor(finalPath),
      'Cache-Control': 'no-store',
    };
    response.writeHead(200, headers);
    if (method === 'HEAD') {
      response.end();
      return;
    }
    response.end(fileBuffer);
  } catch (_error) {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end('Not found');
  }
}

const options = parseArgs(process.argv.slice(2));
const server = http.createServer((request, response) => {
  const method = request.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    response.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  const resolved = resolveRequestPath(options.root, request.url || '/');
  if (!resolved) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  serveFile(response, resolved, method);
});

server.listen(options.port, options.host, () => {
  process.stdout.write(
    `Workbench dev server running at http://${options.host}:${options.port}/ (root: ${options.root})\n`,
  );
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

