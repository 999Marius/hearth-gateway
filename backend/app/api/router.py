"""API route registration."""

from fastapi import APIRouter

from app.api.routes import alerts, auth, devices, users, vpn_peers

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(devices.router)
api_router.include_router(alerts.router)
api_router.include_router(vpn_peers.router)

