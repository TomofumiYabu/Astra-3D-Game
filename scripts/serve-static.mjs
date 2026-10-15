// Test-only static host: no Vite middleware, SPA fallback, or root asset fallback.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const directory = resolve('dist');
const prefix = '/Astra-3D-Game/';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://127.0.0.1:4174').pathname;
    if (pathname === prefix.slice(0, -1)) {
      response.writeHead(308, { Location: prefix }).end();
      return;
    }
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const file = resolve(
      directory,
      decodeURIComponent(pathname.slice(prefix.length)) || 'index.html',
    );
    if (!file.startsWith(directory + sep)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const body = await readFile(file);
    response
      .writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
      .end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(4174, '127.0.0.1');
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
