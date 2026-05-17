#!/usr/bin/env python3
import http.server
import os
import sys
import socket
import mimetypes

DIST = '/home/z/my-project/qms-saas-pro/dist'
PORT = 3000

MIME_TYPES = {
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
}

class SPAHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/':
            path = '/index.html'
        
        filepath = os.path.join(DIST, path.lstrip('/'))
        
        if os.path.isfile(filepath):
            self.serve_file(filepath)
        else:
            # SPA fallback
            index_path = os.path.join(DIST, 'index.html')
            self.serve_file(index_path)
    
    def serve_file(self, filepath):
        try:
            ext = os.path.splitext(filepath)[1]
            content_type = MIME_TYPES.get(ext, 'application/octet-stream')
            
            with open(filepath, 'rb') as f:
                data = f.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())
    
    def log_message(self, format, *args):
        pass

class DualStackServer(http.server.HTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = True
    
    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        super().server_bind()

if __name__ == '__main__':
    server = DualStackServer(('::', PORT), SPAHandler)
    print(f'QMS SaaS Pro deployed on [::]:{PORT} (dual-stack)', flush=True)
    sys.stdout.flush()
    server.serve_forever()
