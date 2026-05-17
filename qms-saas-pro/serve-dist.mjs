import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

const DIST = '/home/z/my-project/qms-saas-pro/dist';
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';
    
    const filePath = join(DIST, urlPath);
    const fileStat = await stat(filePath);
    
    if (fileStat.isFile()) {
      const ext = extname(filePath);
      const data = await readFile(filePath);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': data.length,
      });
      res.end(data);
    } else {
      throw new Error('Not a file');
    }
  } catch {
    // SPA fallback
    try {
      const data = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': data.length,
      });
      res.end(data);
    } catch (e) {
      res.writeHead(500);
      res.end('Server error');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`QMS SaaS Pro server listening on 0.0.0.0:${PORT}`);
});

server.on('error', (e) => {
  console.error('Server error:', e);
  process.exit(1);
});

// Keep process alive
process.on('SIGTERM', () => { /* ignore */ });
process.on('SIGINT', () => { /* ignore */ });
