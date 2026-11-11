# SGSK-Wealth

Unified monorepo for the **SGSK-Wealth** investment portfolio tracker and wealth analytics platform.

```
SGSK-Wealth/
├── backend/              # FastAPI Python backend (calculations, APIs, proxy layer)
│   ├── main.py
│   ├── config/
│   ├── models/
│   ├── routers/
│   ├── services/
│   ├── tests/
│   ├── pyproject.toml
│   └── vercel.json
├── frontend/             # Angular 22 Single Page Application
│   ├── src/
│   ├── e2e/
│   ├── angular.json
│   ├── proxy.conf.json
│   ├── package.json
│   └── vercel.json
├── .agents/              # AI Agent skills & domain guidance (e.g. dividend-payments)
├── .github/workflows/    # Unified GitHub Actions pipelines
│   ├── backend-ci.yml
│   ├── frontend-e2e.yml
│   └── live-e2e-cron.yml
├── scripts/
│   └── dev.mjs           # Concurrent local runner for backend & frontend
├── package.json          # Root workspace configuration & unified scripts
└── GEMINI.md             # Developer & AI quality assurance rules
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v20+` or `v24 LTS`
- **npm**: `v10+` or `v11+`
- **Python**: `3.10+` or `3.11+`

### 1. Install Dependencies

Install frontend dependencies:
```bash
npm install
```

Install backend dependencies (optional, for local Python tooling):
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
pip install -r requirements-dev.txt
cd ..
```

---

## Local Development

Start **both** the FastAPI backend and Angular frontend concurrently with one command from the root directory:

```bash
npm start
# or
npm run dev
```

- **Backend API**: `http://127.0.0.1:8000` (Swagger UI at `/docs`)
- **Frontend App**: `http://localhost:4200` (Proxy configured to route `/api/backend/*` to `:8000`)

To start services individually:
```bash
npm run dev:backend    # Starts only FastAPI
npm run dev:frontend   # Starts only Angular
```

---

## Testing & Quality Assurance

Run unified checks directly from the root:

| Command | Description |
|---|---|
| `npm run check` | Run complete QA suite (backend lint, backend test, frontend test, frontend build) |
| `npm run lint:backend` | Run Ruff linter and Mypy static type checker on `backend/` |
| `npm run test:backend` | Run Pytest unit & API tests in `backend/` |
| `npm run test:frontend`| Run Vitest unit tests in `frontend/` |
| `npm run test:e2e` | Run Cucumber + Serenity/JS E2E and API regression suite in `frontend/` |
| `npm run build` | Compile Angular frontend for production |

---

## Vercel Deployment

This repository is designed for independent or linked deployment on Vercel:

1. **Backend Project**:
   - Link project to `https://github.com/vipatpolk/SGSK-Wealth`
   - Set **Root Directory** to `backend`
   - Uses `backend/vercel.json` with `@vercel/python` runtime

2. **Frontend Project**:
   - Link project to `https://github.com/vipatpolk/SGSK-Wealth`
   - Set **Root Directory** to `frontend`
   - Uses `frontend/vercel.json` with SPA routing and API proxy rewrites
