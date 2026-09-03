// Minimal static file server for local preview only.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/faiqkarimli/Downloads/WebSite/saytlab-proje';
const PORT = 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

// Mirrors vercel.json { cleanUrls: true }: extensionless paths serve <path>.html.
function resolve(urlPath, cb) {
  if (urlPath === '/') return cb(path.join(ROOT, 'index.html'));
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const base = path.join(ROOT, safe);
  fs.stat(base, (err, st) => {
    if (!err && st.isFile()) return cb(base);
    if (path.extname(base)) return cb(base);
    cb(base + '.html');
  });
}

// Mirrors vercel.json "headers" so local preview reflects the production CSP / security headers.
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://connect.facebook.net; " +
    "style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://www.facebook.com; " +
    "font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.facebook.com https://connect.facebook.net; " +
    "frame-src https://www.facebook.com; frame-ancestors 'none'; base-uri 'self'; " +
    "form-action 'self' https://www.facebook.com; object-src 'none'; upgrade-insecure-requests",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  resolve(urlPath, (filePath) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end('Not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
        ...SECURITY_HEADERS,
      });
      res.end(data);
    });
  });
}).listen(PORT, '127.0.0.1', () => console.log('preview on http://127.0.0.1:' + PORT));
