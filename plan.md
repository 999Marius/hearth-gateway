# Pi-Based Network Security & Privacy Gateway — Architectural Review & Project Plan

**Student:** Lucacel Marius · **Course:** SD 2026 – 30434 · **Deadline:** 18 March 2026

---

## 1. Rubric Verification

### ✅ Requirements Met

| Requirement | Status | Evidence |
|---|---|---|
| **~2–3 Roles** | ✅ 3 roles | Admin, User, Guest |
| **~5 DB tables** | ✅ 5 tables | `users`, `devices`, `vpn_connections`, `adblock_logs`, `alerts` |
| **Client-server architecture** | ✅ | FastAPI backend + web dashboard frontend |
| **Real-life application** | ✅ | Home network security gateway — genuinely useful |
| **Not a "classic Student Manager"** | ✅ | Creative, embedded/Linux-focused project |
| **Title page** | ✅ | Student, project name, course, date, deadline |
| **Table of Contents** | ✅ | `\tableofcontents` present |
| **Introduction (5–10 lines)** | ✅ | ~8 lines covering motivation and approach |
| **Database diagram with relations** | ✅ | ER diagram with 1–n relationships marked |
| **Use-case diagram** | ✅ | 3 actors, system interactions shown |
| **Activity diagram per role** | ✅ | Admin, User, Guest — all three present |

### ⚠️ Potential Risk Areas

1. **Introduction length:** The rubric says "~5–10 lines". Your introduction is currently right on the edge. Consider adding 1–2 more sentences about *why you personally chose this project* (the rubric says "explaining the reason of the project and what made you chose the project"). The current text explains what it does but is light on personal motivation.

2. **"OOP principles" are mentioned in sd.txt but NOT in the rubric.** The rubric doesn't explicitly require OOP class diagrams for iteration 1, so you're fine — but having the OOP design ready will position you well for iteration 2.

3. **Diagram quality matters.** The rubric says "please mark the relations (1-1, 1-n, etc)." Ensure your ER diagram image clearly labels cardinality on every line. If any line is ambiguous, a professor may dock points.

4. **The optional `roles` table** mentioned in sd.txt — consider whether to include it. With 5 tables you already meet the minimum, but a 6th table shows extra effort and normalizes the role–permission mapping properly. A `roles` table with a `role_permissions` join table would be the "textbook" approach a professor might appreciate.

5. **No sequence diagram or class diagram is required for iteration 1**, but these will almost certainly be needed for iteration 2. Start thinking about them now.

### 🔴 Missing Element

- **The rubric explicitly asks for PDF format.** Make sure your LaTeX compiles cleanly and all `.png` diagram files are present in the same directory. Missing images = broken PDF = lost points.

---

## 2. Tech Stack Exploration & Comparison

### Context: Raspberry Pi 5 (4 GB RAM)
- ARM64 (aarch64), Broadcom BCM2712
- Typical OS: Raspberry Pi OS (Debian Bookworm) or Ubuntu Server 24.04
- Storage: microSD (slow random writes) or USB SSD (recommended)
- Must co-exist with Pi-hole (Docker or native) + WireGuard (kernel module)
- Idle RAM usage with OS + Pi-hole + WireGuard ≈ 400–600 MB → **~3.4 GB available for your app**

---

### 2A. Backend Framework Comparison

| Criteria | **Python + FastAPI** | **Node.js + Express** | **Go + Gin** |
|---|---|---|---|
| **RAM footprint** | ~30–80 MB | ~40–80 MB | ~10–20 MB |
| **CPU efficiency** | Moderate (interpreted) | Moderate (V8 JIT) | Excellent (compiled, native) |
| **Pi-hole integration** | ★★★★★ — Pi-hole IS Python; `pihole` CLI + REST API are trivial to call from Python; many existing Pi-hole Python libraries | ★★★☆☆ — Must HTTP-call Pi-hole's API or shell-exec. No native libraries. | ★★★☆☆ — Same as Node; must HTTP or exec |
| **WireGuard integration** | ★★★★☆ — `subprocess` calls to `wg` CLI are easy; `python-wireguard` library exists | ★★★☆☆ — `child_process.exec('wg ...')` works but less ergonomic | ★★★★★ — Go has `golang.zx2c4.com/wireguard` (WireGuard is written in Go!) |
| **ORM / DB tooling** | SQLAlchemy (excellent), Tortoise ORM, Peewee | Sequelize, Prisma, Knex | GORM, sqlx |
| **Learning curve** | Low–Medium (you likely know Python from uni) | Low (JS is ubiquitous) | Medium–High (strict typing, no exceptions, goroutines) |
| **Async / concurrency** | Native `async/await` in FastAPI; great for I/O-bound dashboard | Event loop — excellent for I/O-bound | Goroutines — excellent for everything |
| **Ecosystem for dashboards** | Jinja2 templates, or serve React/Vue as static | Natively serves JS frontends | `html/template` or serve static SPA |
| **Deployment complexity** | `pip install` + `uvicorn` | `npm install` + `node` | Single binary, zero dependencies |
| **University context** | Professors likely familiar with Python; easy to explain in documentation | Common but less academic in SE courses | Uncommon in undergrad courses; may raise questions |
| **Code volume estimate** | ~1000–1500 lines | ~1000–1500 lines | ~800–1200 lines (more verbose but fewer files) |

#### 🏆 Recommendation: **Python + FastAPI**

**Why:** The killer advantage is Pi-hole synergy. Pi-hole's internals, its gravity database (`/etc/pihole/gravity.db`), its CLI, and its API are all Python-native. You can directly query Pi-hole's SQLite database from your FastAPI backend — no HTTP overhead, no parsing. For WireGuard, `subprocess.run(["wg", "show", ...])` is clean enough. FastAPI's auto-generated OpenAPI docs (`/docs`) are also impressive for a university demo.

Go would be the superior engineering choice for production (tiny binary, no runtime), but in a university context where you need to explain your code in documentation and the professor likely reads Python, FastAPI is the pragmatic winner.

---

### 2B. Database Comparison

| Criteria | **SQLite** | **PostgreSQL** |
|---|---|---|
| **RAM usage** | ~0 MB (in-process) | ~50–150 MB (server process) |
| **Setup complexity** | Zero — it's a file | Must install, configure, manage `pg_hba.conf`, create databases |
| **Concurrent writes** | ⚠️ Single-writer lock (WAL mode helps) | ✅ Full MVCC concurrency |
| **Fits Pi constraints?** | ★★★★★ Perfect | ★★★☆☆ Usable but overkill |
| **SD card wear** | ⚠️ Risk with WAL + frequent writes | ⚠️ Same risk, plus WAL of its own |
| **Pi-hole compatibility** | ★★★★★ Pi-hole itself uses SQLite! You could even query its DB directly | ★★★☆☆ Separate from Pi-hole's storage |
| **Backup simplicity** | `cp gateway.db gateway.db.bak` | `pg_dump` (more complex) |
| **ORM support** | Full SQLAlchemy support | Full SQLAlchemy support |
| **Academic impression** | "Simple" — some professors prefer seeing a "real" RDBMS | "Professional" — shows you know enterprise tools |

#### 🏆 Recommendation: **SQLite (with WAL mode enabled)**

**Why:** On a Pi with 4 GB RAM, every megabyte counts. You're already running Pi-hole + WireGuard + your FastAPI app + a web server. SQLite is in-process (no extra daemon), and Pi-hole itself uses SQLite — so your entire system speaks the same storage dialect. You could even join your tables with Pi-hole's `gravity.db` in a single query.

**Mitigate SD card wear:**
- Enable WAL mode: `PRAGMA journal_mode=WAL;`
- Batch writes (don't INSERT on every DNS query; aggregate in memory, flush every 30–60 seconds)
- Consider mounting the DB on a USB SSD or tmpfs with periodic sync
- Set `PRAGMA synchronous=NORMAL;` (not FULL) for less fsync pressure

**If the professor specifically wants PostgreSQL**, it's a 10-minute switch in SQLAlchemy — just change the connection string. Design your code to be DB-agnostic via the ORM.

---

### 2C. Frontend Comparison (Brief)

| Option | Pros | Cons |
|---|---|---|
| **Vanilla HTML/CSS/JS + Jinja2** | Zero build step, tiny, professor can read it | No reactivity, manual DOM updates, harder to achieve polished UI |
| **React (Vite)** | ★★★★★ Rich ecosystem, gorgeous component libraries (shadcn/ui), professional polish, excellent for dashboards | Requires build step (~10-30s); node_modules during development |
| **Vue 3 (Vite)** | Simpler than React, great docs | Still needs Node.js build; smaller ecosystem than React |
| **HTMX + Jinja2** | Server-rendered reactivity, ~14 KB JS, no build step | Less well-known; harder to achieve modern UI polish |

#### 🏆 Recommendation: **React 18 + Vite + Tailwind CSS + shadcn/ui**

**Why React wins for a "really good looking" dashboard:**

1. **Visual Polish:** Component libraries like [shadcn/ui](https://ui.shadcn.com/) give you beautiful cards, tables, dialogs, animations, and dark mode out of the box — exactly what a monitoring dashboard needs.

2. **Zero Pi Runtime Cost:** After `npm run build`, React is just optimized static files (~200-500 KB gzipped). The Pi serves them via nginx or FastAPI's StaticFiles — no server-side rendering overhead.

3. **Perfect for Dashboards:** Auto-refreshing stats with React Query, smooth loading states, real-time device updates, toast notifications — all trivial to implement.

4. **University Impression:** A polished React dashboard with Chart.js graphs and smooth animations shows you know modern web development. Professors will be impressed.

**Development workflow:** Build on your laptop with hot reload (`npm run dev`), then `npm run build` and serve the `dist/` folder from FastAPI or nginx on the Pi.

---

## 3. Pros & Cons — Brutally Honest Assessment

### ✅ Strengths

1. **Genuinely useful.** This isn't a toy project — it replaces commercial products (Firewalla, NextDNS). You'll actually use it after the course.

2. **Smart integration > reinventing the wheel.** Using Pi-hole + WireGuard instead of writing a DNS sinkhole or VPN from scratch is *exactly* what a senior dev would do. The code you write focuses on the **orchestration layer** (dashboard, user management, alerting), which is the interesting part.

3. **Perfect rubric fit.** 3 roles, 5 tables, client-server, real-life — all boxes checked without forcing the design.

4. **Embedded/Linux angle is unique.** Most classmates will submit a web-only CRUD app. Yours runs on real hardware with networking, Docker, kernel modules. It stands out.

5. **Low custom code volume** (~1000–1500 lines) means you can polish quality over quantity.

### 🔴 Weaknesses & Risks

1. **SD Card Wear (Critical Risk)**
   - Pi-hole logs every DNS query. Your app logs VPN connections and alerts. SQLite on an SD card with continuous writes **will** degrade the card within 6–12 months of heavy use.
   - **Mitigation:** USB SSD ($15), or log to tmpfs (`/tmp`) and flush to disk on a schedule, or use `log2ram`.

2. **Pi-hole Coupling**
   - Your `adblock_logs` table duplicates data that Pi-hole already stores in its own SQLite DB (`/etc/pihole/pihole-FTL.db`). This means either:
     - (a) You poll Pi-hole's API and copy data → duplication, latency, wasted writes
     - (b) You query Pi-hole's DB directly → tight coupling, breaks if Pi-hole changes schema
   - **Recommendation:** Option (b) with a read-only connection and a version check. It's pragmatic and avoids the write overhead.

3. **Single Point of Failure**
   - The Pi IS the gateway. If it crashes, the network loses DNS filtering and VPN. No failover.
   - **Mitigation:** Configure your router's secondary DNS to `1.1.1.1` so devices don't lose internet if Pi-hole goes down. WireGuard has no easy failover — accept this limitation and document it.

4. **Concurrency Under Load**
   - A busy home network (30+ IoT devices) can generate hundreds of DNS queries/second. FastAPI + SQLite's single-writer model could bottleneck.
   - **Mitigation:** Don't write every query to your DB. Let Pi-hole handle its own logging. Your app only reads Pi-hole's data for the dashboard and writes only user actions / alerts.

5. **Demo Complexity**
   - Demoing a Pi-based project in a university setting is harder than showing a web app on your laptop. You need the Pi running, network configured, devices connected.
   - **Mitigation:** Prepare a recorded video demo as backup. Also consider running a "mock mode" where the backend serves fake data for the dashboard, so you can demo the UI on any laptop.

6. **WireGuard Key Management**
   - Generating and distributing WireGuard configs (with private/public keys, preshared keys, endpoint IPs) from a web dashboard is non-trivial and has security implications if done wrong.
   - **Mitigation:** Use `wg genkey`, `wg pubkey` via subprocess. Generate QR codes for mobile clients (`qrencode` library). Never store private keys in your DB — generate, display once, discard.

7. **Scope Creep Potential**
   - IoT device monitoring, anomaly detection, alert rules — each of these is a project unto itself. Don't try to build Snort.
   - **Mitigation:** For iteration 1, keep "monitoring" simple: periodic ARP scans (`arp-scan --localnet`) to detect new devices, store in `devices` table, alert if unknown MAC appears.

---

## 4. Step-by-Step Implementation Plan

### Phase 0: Foundation & Environment (Days 1–2)
- [ ] Flash Raspberry Pi OS Lite (64-bit) onto SSD/SD
- [ ] `sudo apt update && sudo apt upgrade`
- [ ] Install Docker & Docker Compose
- [ ] Deploy Pi-hole container (test DNS blocking works)
- [ ] Install WireGuard (`sudo apt install wireguard`), generate server keys, test tunnel
- [ ] Confirm Pi-hole + WireGuard coexist (Pi as DNS for WireGuard clients)
- [ ] Set up Git repo for your project code

### Phase 1: Database & Core API (Days 3–5)
- [ ] Initialize Python project: `pyproject.toml`, virtualenv, FastAPI + Uvicorn
- [ ] Define SQLAlchemy models for all 5 tables
- [ ] Create Alembic migrations (or use `metadata.create_all()` for simplicity)
- [ ] Enable WAL mode: `PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;`
- [ ] Implement auth: JWT-based login, password hashing (`bcrypt`), role middleware
- [ ] CRUD endpoints: `/api/users`, `/api/devices`, `/api/alerts`
- [ ] Test with `curl` or FastAPI's `/docs` Swagger UI

### Phase 2: Service Integration (Days 6–8)
- [ ] **Pi-hole integration:**
  - Read Pi-hole's FTL database (`/etc/pihole/pihole-FTL.db`) — query `queries` table for recent blocked/allowed counts
  - Expose `/api/pihole/stats` and `/api/pihole/top-blocked`
  - Admin endpoint to manage blocklists (call `pihole` CLI via subprocess)
- [ ] **WireGuard integration:**
  - Endpoint to generate new peer config (`wg genkey | wg pubkey`, append to `wg0.conf`, `wg syncconf`)
  - Endpoint to list active peers: parse `wg show wg0 dump`
  - Log connections to `vpn_connections` table
  - Generate QR codes for mobile configs
- [ ] **Device monitoring:**
  - Background task (FastAPI `on_event("startup")` or APScheduler): run `arp-scan --localnet` every 60 seconds
  - Compare results with known devices in `devices` table
  - Insert alert if unknown MAC detected

### Phase 3: Frontend Dashboard (Days 9–12)
- [ ] Initialize React project: `npm create vite@latest dashboard -- --template react`
- [ ] Install dependencies: `npm install react-router-dom @tanstack/react-query axios tailwindcss shadcn-ui lucide-react recharts`
- [ ] Set up Tailwind CSS + shadcn/ui components
- [ ] Configure API client (axios) to hit FastAPI backend `/api/*`
- [ ] **Login page** → JWT stored in localStorage or httpOnly cookie
- [ ] **Dashboard home:** cards showing # devices, # blocked queries (24h), VPN status, active alerts (use shadcn Card components)
- [ ] **Devices page:** responsive table with device status badges, "mark as trusted" button (use shadcn Table + Badge)
- [ ] **VPN page:** peer list with connection logs, "generate new peer" form + QR code display
- [ ] **Pi-hole page:** top blocked domains chart (Recharts or Chart.js), query volume line graph
- [ ] **Alerts page:** list with dismiss button, severity filtering (use shadcn Alert + Dialog)
- [ ] **Admin panel:** user CRUD table, role dropdown, system settings form
- [ ] Role-based routing (use React Router + protected routes)
- [ ] Build production bundle: `npm run build` → serve `dist/` from FastAPI StaticFiles

### Phase 4: Hardening & Polish (Days 13–15)
- [ ] Rate limiting on API endpoints (`slowapi`)
- [ ] Input validation (Pydantic models — FastAPI does this natively)
- [ ] HTTPS via self-signed cert or Let's Encrypt (if you have a domain)
- [ ] Firewall rules: only allow dashboard access from LAN/VPN
- [ ] Error handling: global exception handler, clean error pages
- [ ] Logging: structured logs with `loguru` or Python `logging`
- [ ] Write `docker-compose.yml` that brings up Pi-hole + your app together (optional but impressive)

### Phase 5: Documentation & Submission
- [ ] Update LaTeX document with any design changes
- [ ] Add/update all diagrams (ensure they match final implementation)
- [ ] Add personal motivation sentence to Introduction
- [ ] Compile PDF, verify all images render
- [ ] Prepare demo: live if possible, recorded video as backup
- [ ] Write `README.md` with setup instructions

---

## Final Verdict: Recommended Stack

```
┌─────────────────────────────────────────┐
│  Frontend:  React 18 + Vite             │
│  Styling:   Tailwind CSS + shadcn/ui    │
│  Charts:    Recharts or Chart.js        │
│  State:     TanStack Query (React Query)│
│  Backend:   Python 3.11 + FastAPI       │
│  Database:  SQLite (WAL mode)           │
│  ORM:       SQLAlchemy 2.0              │
│  Auth:      JWT (PyJWT) + bcrypt        │
│  Pi-hole:   Docker container            │
│  VPN:       WireGuard (native)          │
│  Platform:  Raspberry Pi 5 (4GB)        │
│  OS:        Raspberry Pi OS Lite 64-bit │
└─────────────────────────────────────────┘
```

**Why this stack:**
- **React + shadcn/ui** delivers a professional, polished dashboard that will impress in demos
- **Zero Pi runtime cost** — React builds to static files served by nginx or FastAPI
- **FastAPI + SQLAlchemy** maximizes Pi-hole integration (direct SQLite access)
- **SQLite WAL mode** minimizes SD card wear and RAM usage
- Every component is swappable via clean abstractions (ORM for DB, Pydantic for validation, React Router for navigation)
