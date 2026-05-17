#!/bin/bash
# Self-restarting QMS server
while true; do
  cd /home/z/my-project/qms-saas-pro
  node -e "
    const {createServer} = require('http');
    const fs = require('fs');
    const path = require('path');
    const DIST = '/home/z/my-project/qms-saas-pro/dist';
    const server = createServer((req, res) => {
      let p = req.url.split('?')[0];
      if (p === '/') p = '/index.html';
      const fp = path.join(DIST, p);
      fs.readFile(fp, (e, d) => {
        if (e) {
          fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
            res.writeHead(200, {'Content-Type':'text/html'});
            res.end(d2);
          });
          return;
        }
        const ext = path.extname(fp);
        const ct = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[ext]||'application/octet-stream';
        res.writeHead(200, {'Content-Type':ct});
        res.end(d);
      });
    });
    server.listen(3000, '::', () => console.log('QMS_DEPLOYED'));
  "
  sleep 2
done
