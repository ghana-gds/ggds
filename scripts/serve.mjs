// Serves the built documentation site (site/) under the strict Content Security Policy GGDS promises to work
// with: no inline scripts, no inline styles, no style attributes. The browser tests run against this server, so
// a component that needs 'unsafe-inline' fails them. No dependencies.
//
//   pnpm run serve            http://localhost:4173
//   PORT=8080 pnpm run serve
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../site', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "frame-src 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(root)) {
  console.error(`serve: ${root} does not exist; run pnpm run build first`);
  process.exit(1);
}

createServer((req, res) => {
  const headers = {
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store',
  };
  let path;
  try {
    path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400, headers).end('Bad request');
    return;
  }
  let file = normalize(join(root, path));
  if (file !== root && !file.startsWith(root + sep)) {
    res.writeHead(403, headers).end('Forbidden');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serve: http://localhost:${port} (strict CSP) from ${root}`));
