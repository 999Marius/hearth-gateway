"""FastAPI application entrypoint."""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, close_db, init_db
from app.core.exceptions import (
    HearthException,
    generic_exception_handler,
    hearth_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.logging import configure_logging
from app.services.bootstrap import ensure_admin_user

settings = get_settings()
configure_logging(settings.DEBUG)

logger = logging.getLogger("hearth.app")
request_logger = logging.getLogger("hearth.request")


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifecycle hooks."""
    logger.info("Starting %s", settings.APP_NAME)
    await init_db()

    async with AsyncSessionLocal() as session:
        await ensure_admin_user(session, settings)
        await session.commit()

    yield

    await close_db()
    logger.info("Stopped %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(HearthException, hearth_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with status code and duration."""
    request_id = str(uuid.uuid4())
    start = time.perf_counter()

    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        request_logger.exception(
            "request_id=%s method=%s path=%s status=500 duration_ms=%.2f",
            request_id,
            request.method,
            request.url.path,
            elapsed_ms,
        )
        raise

    elapsed_ms = (time.perf_counter() - start) * 1000
    request_logger.info(
        "request_id=%s method=%s path=%s status=%s duration_ms=%.2f",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/health")
async def health() -> dict[str, str]:
    """Basic healthcheck endpoint."""
    return {"status": "ok", "version": settings.APP_VERSION}


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
