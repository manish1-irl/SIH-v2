import os

port = os.environ.get("PORT", "10000")
bind = f"0.0.0.0:{port}"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
