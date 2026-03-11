# Hearth — Pi-Based Network Security & Privacy Gateway

## Stack (non-negotiable)
- Backend: Python 3.12 + FastAPI + SQLAlchemy 2.0 (sync, StaticPool for SQLite)
- Database: SQLite with WAL mode — NO PostgreSQL, NO Redis, NO other DBs
- Auth: JWT (PyJWT) + bcrypt + httpOnly cookies
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Deployment: Docker Compose — Pi-hole + WireGuard + backend + nginx
- Rate limiting: slowapi (NOT Upstash, NOT Redis-based)
- Platform: Raspberry Pi 5, 4 GB RAM, ARM64

## DB Tables
users, devices, vpn_connections, adblock_logs, alerts

## Key Constraints
- Pi-hole FTL DB (`/etc/pihole/pihole-FTL.db`) read in READ-ONLY mode — never write to it
- WireGuard private keys are NEVER stored in DB — generate, display once, discard
- SQLite pragmas: cache_size=-32000, temp_store=MEMORY, synchronous=NORMAL, WAL mode, foreign_keys=ON
- Memory budget: backend process ~80 MB max
- All DB access via SQLAlchemy ORM — no raw SQL in route handlers
- Passwords hashed with bcrypt cost factor 12
- JWT: access token 15 min, refresh token 7 days, stored in httpOnly cookie

## Project Structure
backend/app/{models,schemas,api,services,core,tasks}
frontend/src/{api,components,pages,hooks,lib,types}

## Coding Standards
- Python: type hints everywhere, Pydantic v2 schemas, service layer between routes and DB
- TypeScript: strict mode, no `any` types
- All API routes return consistent response shapes
- Background tasks use asyncio, NOT threading
