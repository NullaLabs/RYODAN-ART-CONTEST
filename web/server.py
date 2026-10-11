import http.server
import socketserver
import os
from pathlib import Path

PORT = 8080
DIRECTORY = Path(r"E:\RYODAN_STUDIO\web")

class DualStackServer(http.server.ThreadingHTTPServer):
    def server_bind(self):
        self.socket.setsockopt(http.server.socket.SOL_SOCKET, http.server.socket.SO_REUSEADDR, 1)
        super().server_bind()

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        # Enable CORS and Cache headers for high speed WebGL texture streaming
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    with DualStackServer(('0.0.0.0', PORT), Handler) as httpd:
        print(f"Ethernium Multi-Threaded Studio Server serving at http://localhost:{PORT}")
        httpd.serve_forever()
