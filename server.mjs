import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./public/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon' };

export const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!['GET','HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow:'GET, HEAD' }); res.end('Method not allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) {
    res.writeHead(404); res.end('Not found'); return;
  }
  let target = path.resolve(root, '.' + pathname);
  if (target !== path.resolve(root) && !target.startsWith(root)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  try {
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith('/')) { res.writeHead(308, { Location: pathname + '/' }); res.end(); return; }
      target = path.join(target, 'index.html');
    }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type':types[path.extname(target)] || 'application/octet-stream', 'Content-Length':content.length, 'Cache-Control':'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('페이지를 찾을 수 없습니다.'); }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5000);
  server.listen(port, '0.0.0.0', () => console.log(`Study site: http://localhost:${port}`));
}
