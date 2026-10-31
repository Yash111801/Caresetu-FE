# CARESETU Frontend — Architecture

## Purpose

Browser SPA for **NP-NCD cancer referral tracking** (CARESETU). Field workers (ASHA → CHO → MO → hospital/pathology/oncology) manage patient pathway stages, bookings, misses, and programme dashboards against the Spring Boot API.

## Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router 7 |
| State | Zustand (auth, i18n, prefs) |
| HTTP | Axios (JWT access + refresh, `X-Request-Id`) |
| Maps | Leaflet |
| Lint | Oxlint |

## High-level diagram

```
┌─────────────────────────────┐
│  Browser (Vite SPA :5174)   │
│  AppLayout · routes · pages │
│  Zustand auth / i18n / prefs│
└──────────────┬──────────────┘
               │ HTTPS JSON
               │ Authorization: Bearer <access>
               ▼
┌─────────────────────────────┐
│  CARESETU API (:18080)      │
│  /api/v1/*                  │
└─────────────────────────────┘
```

## Source layout

```
src/
  api/           Typed clients + axios interceptors (refresh, errors)
  components/    AppLayout shell; ui/ Page, Section, Field, ErrorBoundary
  hooks/         Shared async helpers
  lib/           AppError, validation, CSV export
  pages/         Route screens (home, screening, patient detail, dashboard, …)
  routes/        Auth / role gates
  store/         authStore, i18n, prefs (theme, offline)
  types/         Domain contracts aligned with API DTOs
```

## Auth & session

1. OTP send/verify against `/api/v1/auth/otp/*` (demo OTP `123456`).
2. Access + refresh tokens stored in `localStorage` (`caresetu.access`, `caresetu.refresh`, `caresetu.deviceId`).
3. Axios interceptor attaches Bearer token; on 401, attempts `/auth/refresh` then retries.
4. Bootstrap calls `/auth/me`; rate-limit / network failures surface as login redirect without silent loops.
5. Role chips drive nav visibility (feature groups: Field work, Care pathway, Programme, Account).

## Clinical pathway (UI)

Full referral chain (field → hospital → **diagnostics** → **specialist**):

```
ASHA screen → CHO → REVIEW → MO book → BOOKED
       → HOSP attend → TESTED
       → PATH (Diagnostics) report
            ├─ POSITIVE → ONCO_REQ → MO book oncology → SPECIALIST → ONCO consult → CLOSED
            └─ NEGATIVE / not cancer → CLOSED
```

| Stage chip | Typical actor | Primary UI action |
|------------|---------------|-------------------|
| CHO | ASHA creates screening | Patient detail → await CHO |
| REVIEW | CHO | Forward to MO |
| BOOKED | MO | Approve & book slot → print slip |
| BOOKED (visit due) | **HOSP** (hospital doctor) | Record visit / Could not serve → **TESTED** |
| TESTED | **PATH** (Diagnostics) | Update tests / Mark inconclusive |
| ONCO_REQ | MO | Book oncology (RCC) → **SPECIALIST** |
| SPECIALIST | **ONCO** (Specialist) | Record consultation → close / treatment |
| MISSED | MO / ASHA field follow-up | Rebook / field visit |
| MONITOR | ASHA | Counsel / monitor (low-risk path) |

Happy-path automation today: `scripts/ui-pathway-flow.mjs` (ASHA → CHO → MO **BOOKED**).  
Hospital → Diagnostics → Specialist is supported in UI/API; use seeded patients `CS-GNR-0005` (TESTED), `0006` (ONCO_REQ), `0007` (SPECIALIST) to demo those legs.

## UI kit conventions

- **Page / Section / Field** primitives keep spacing and sticky form actions consistent.
- Viewport shell: sticky sidebar + scrollable content pane (no floating card dashboard chrome).
- i18n: `en` · `gu` · `hi` via store + `label.field` patterns.
- Accessibility: labelled fields, visible focus, SOS / helpdesk chrome in shell footer.

## Configuration

| Variable | Meaning |
|----------|---------|
| `VITE_API_BASE_URL` | API root, e.g. `http://localhost:18080/api/v1` |

See `.env.example`. Never commit `.env`.

## Companion backend

This SPA expects **Caresetu-BE** (Java 21 / Spring Boot / MySQL / Flyway). Architecture for the API lives in that repository under `docs/ARCHITECTURE.md`.
