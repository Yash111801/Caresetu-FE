# CARESETU Frontend

Open-source React SPA for **NP-NCD cancer referral tracking** (CARESETU) — Gujarat Health & Family Welfare / NP-NCD prototype.

**React 19 · TypeScript · Vite · Zustand · Axios · React Router · Leaflet**

| Requirement | Location |
|-------------|----------|
| Complete source | this repository (`src/`) |
| Setup instructions | [below](#setup) |
| Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Sample data & tests | [`docs/SAMPLE_DATA_AND_TESTS.md`](docs/SAMPLE_DATA_AND_TESTS.md) |
| License | [`LICENSE`](LICENSE) (MIT) |

Companion API: **Caresetu-BE** (Java 21 / Spring Boot / MySQL). Run both for a full demo.

---

## Setup

### Prerequisites

- Node.js 20+ (npm)
- Running **Caresetu-BE** (default local API `http://localhost:18080/api/v1`)
- Chromium for UI scripts: `npx playwright install chromium`

### Install & run

```bash
git clone https://github.com/Yash111801/Caresetu-FE.git Caresetu-Fe
cd Caresetu-Fe
cp .env.example .env
# Edit if needed — match BE port:
# VITE_API_BASE_URL=http://localhost:18080/api/v1

npm install
npm run dev -- --port 5174
```

Open http://localhost:5174

### Demo login

1. Choose a role chip (e.g. **ADMIN** `9999999999` or **ASHA** `9876543210`)
2. OTP: **`123456`**

Full role table and seeded patients: see [`docs/SAMPLE_DATA_AND_TESTS.md`](docs/SAMPLE_DATA_AND_TESTS.md) and the backend README.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Serve production build |
| `npm run test:ui` | Headed page walk (`scripts/ui-walk.mjs`) |
| `npm run test:pathway` | ASHA → CHO → MO booking flow |

Env for scripts: `CARESETU_URL`, `CARESETU_API`.

---

## Source map

```
src/
  api/           HTTP clients (JWT refresh, correlation id)
  components/    App shell + ui/ design-system primitives
  hooks/         Shared data hooks
  lib/           AppError, validation, CSV export
  pages/         Route screens
  routes/        Auth gates
  store/         Auth / i18n / prefs
  types/         Domain contracts
docs/            Architecture + sample data / tests
scripts/         Playwright UI walks
```

---

## License

MIT — see [`LICENSE`](LICENSE).
