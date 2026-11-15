import logging
import time
import uuid
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.gzip import GZipMiddleware

from app.config import get_settings

log = logging.getLogger("api")


def register_middleware(app: FastAPI) -> None:
    s = get_settings()
    hits: dict[str, deque] = defaultdict(deque)  # in-memory, per-IP, transient

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = uuid.uuid4().hex[:12]
        start = time.perf_counter()

        if request.url.path.startswith("/api") and request.method != "OPTIONS":
            ip = request.client.host if request.client else "unknown"
            now = time.time()
            q = hits[ip]
            while q and now - q[0] > 60:
                q.popleft()
            if len(q) >= s.rate_limit_per_minute:
                return JSONResponse(
                    {"detail": "Rate limit exceeded"}, status_code=429, headers={"Retry-After": "60"}
                )
            q.append(now)

        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = rid
        response.headers["X-Process-Time-ms"] = f"{ms:.1f}"
        log.info("%s %s %s %.1fms [%s]", request.method, request.url.path, response.status_code, ms, rid)
        return response

    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=s.cors_origin_list,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time-ms"],
    )

    @app.exception_handler(StarletteHTTPException)
    async def http_exc(_: Request, exc: StarletteHTTPException):
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exc(_: Request, exc: RequestValidationError):
        return JSONResponse({"detail": "Invalid request", "errors": exc.errors()}, status_code=422)

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):
        log.exception("Unhandled error")
        return JSONResponse({"detail": "Internal server error"}, status_code=500)
