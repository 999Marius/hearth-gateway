"""
Custom exceptions and error handlers.

Provides consistent error responses across the API.
"""
import logging

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("hearth.api")


class HearthException(Exception):
    """Base exception for Hearth Gateway."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(HearthException):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class UnauthorizedException(HearthException):
    """Authentication failed."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class ForbiddenException(HearthException):
    """Access forbidden."""

    def __init__(self, message: str = "Access forbidden"):
        super().__init__(message, status_code=403)


class BadRequestException(HearthException):
    """Bad request."""

    def __init__(self, message: str = "Bad request"):
        super().__init__(message, status_code=400)


class ServiceUnavailableException(HearthException):
    """External service unavailable."""

    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message, status_code=503)


async def hearth_exception_handler(
    request: Request, exc: HearthException
) -> JSONResponse:
    """Handle custom Hearth exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.message,
                "type": exc.__class__.__name__,
                "path": str(request.url),
            }
        },
    )


async def http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "type": "HTTPException",
                "path": str(request.url),
            }
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = []
    for error in exc.errors():
        errors.append(
            {
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
            }
        )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "message": "Validation error",
                "type": "ValidationError",
                "path": str(request.url),
                "details": errors,
            }
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    logger.error(
        "Unhandled exception for method=%s path=%s error=%s",
        request.method,
        request.url.path,
        exc.__class__.__name__,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "message": "Internal server error",
                "type": exc.__class__.__name__,
                "path": str(request.url),
            }
        },
    )
