import os
import sys

# Add backend directory to sys.path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app

try:
    from a2wsgi import ASGIMiddleware
    # Wrap ASGI app so standard Gunicorn WSGI can run it seamlessly
    application = ASGIMiddleware(app)
except ImportError:
    application = app
