"""Core configuration management for the backend."""

from functools import lru_cache
from typing import Any

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Hearth Gateway"
    APP_VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    APP_ENV: str = Field(default="development", description="development, production")
    DEBUG: bool = Field(default=False, description="Enable debug mode")

    HOST: str = Field(
        default="0.0.0.0",
        description="Server host",
        validation_alias=AliasChoices("HOST", "APP_HOST"),
    )
    PORT: int = Field(
        default=8000,
        description="Server port",
        validation_alias=AliasChoices("PORT", "APP_PORT"),
    )

    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./data/hearth.db",
        description="Async SQLAlchemy URL",
    )

    SECRET_KEY: str = Field(
        default="change-me-to-a-random-64-char-hex-string-please",
        min_length=32,
        description="Secret key used to sign JWT tokens",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Access token expiration in minutes",
        validation_alias=AliasChoices(
            "ACCESS_TOKEN_EXPIRE_MINUTES",
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
        ),
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(
        default=7,
        description="Refresh token expiration in days",
        validation_alias=AliasChoices(
            "REFRESH_TOKEN_EXPIRE_DAYS",
            "JWT_REFRESH_TOKEN_EXPIRE_DAYS",
        ),
    )

    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins",
    )

    PIHOLE_FTL_DB: str = Field(
        default="/pihole-data/pihole-FTL.db",
        description="Path to Pi-hole FTL database (read-only)",
    )
    WG_CONFIG_PATH: str = Field(
        default="/wireguard-config/wg0/wg0.conf",
        description="Path to WireGuard config file",
    )
    WG_INTERFACE: str = Field(default="wg0", description="WireGuard interface name")

    ADMIN_USERNAME: str = Field(default="admin", description="Default admin username")
    ADMIN_EMAIL: str = Field(
        default="admin@hearth.local",
        description="Default admin email",
    )
    ADMIN_PASSWORD: str = Field(
        default="change-me-on-first-run",
        min_length=8,
        description="Default admin password for first boot",
    )

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: Any) -> str:
        """Normalize sync SQLite URLs into async URLs when needed."""
        if not isinstance(value, str):
            raise TypeError("DATABASE_URL must be a string")

        normalized = value.strip()
        if normalized.startswith("sqlite:///") and not normalized.startswith(
            "sqlite+aiosqlite:///"
        ):
            return normalized.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
        return normalized

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        raise TypeError("ALLOWED_ORIGINS must be a list or comma-separated string")

    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.APP_ENV.lower() == "development"

    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.APP_ENV.lower() == "production"

    @model_validator(mode="after")
    def validate_security_defaults(self) -> "Settings":
        """Reject insecure default secrets in production."""
        if not self.is_production():
            return self

        if "change-me" in self.SECRET_KEY.lower():
            raise ValueError("SECRET_KEY must be changed in production")
        if "change-me" in self.ADMIN_PASSWORD.lower():
            raise ValueError("ADMIN_PASSWORD must be changed in production")
        return self


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
