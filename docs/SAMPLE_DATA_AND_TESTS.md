# Sample data & test cases (Frontend)

This document mirrors the **running CARESETU stack**: Flyway demo seed in **Caresetu-BE**, role-gated actions on patient detail, and the Playwright scripts that already pass against a live API + Vite app.

**Prerequisites**

| Service | Typical local URL |
|---------|-------------------|
| FE (Vite) | http://localhost:5174 |
| API | http://localhost:18080/api/v1 |
| MySQL | localhost:3307 (`docker compose` in Caresetu-BE) |

Demo OTP for every seeded mobile: **`123456`**.

---

## 1. Seeded users (login chips)

Loaded by BE migrations `V1__init_rbac_auth.sql` + `V7__super_admin_user.sql`.

| Mobile | Name | Role | Scope notes |
|--------|------|------|-------------|
| `9999999999` | CARESETU Super Admin | ADMIN | Statewide / all permissions |
| `9876543210` | Meena Rathod | ASHA | PHC `ADL` (Adalaj) |
| `9876543211` | Kiran Patel | CHO | PHC `ADL` |
| `9876543212` | Dr A. Shah | MO | PHC `ADL` |
| `9876543213` | Dr P. Trivedi | HOSP | Facility `DH` |
| `9876543214` | Dr R. Rao | PATH | Facility `DH` |
| `9876543215` | Dr S. Iyer | ONCO | Facility `RCC` |
| `9876543216` | Dr J. Raval | BLK | Taluka Gandhinagar |
| `9876543217` | District Programme Officer | DIST | District Gandhinagar |
| `9876543218` | State Nodal Officer | SNO | State `GJ` |
| `9876543219` | National Programme Officer | NAT | National |

UI login: pick a role chip → OTP `123456` → home. Scripts inject tokens via API OTP (same mobiles) to avoid UI rate limits.

---

## 2. Seeded patients (what you see on Patients / Map)

From `V3__seed_demo_patients.sql` (Gandhinagar). Use these to exercise **next-step** UI without creating a new case.

| UHID | Name | Stage | Risk | Cancer | Best role to open next | Expected action on detail |
|------|------|-------|------|--------|------------------------|---------------------------|
| CS-GNR-0001 | Kamla Ben | **CHO** | HIGH | oral | CHO | **Forward to MO** (`approve`) |
| CS-GNR-0002 | Savita Patel | **REVIEW** | HIGH | breast | MO | **Approve & book** (`refer`) — day pool + Confirm booking |
| CS-GNR-0003 | Ramesh Thakor | **BOOKED** | MEDIUM | oral | HOSP (visit ≤ today) | **Record visit** / **Could not serve**; Print slip |
| CS-GNR-0004 | Bharti Solanki | **MONITOR** | LOW | cervical | ASHA | **Counsel / monitor** (`monitor`) |
| CS-GNR-0005 | Hansaben Raval | **TESTED** | HIGH | cervical | PATH | **Update tests** / **Mark inconclusive** |
| CS-GNR-0006 | Prakash Zala | **ONCO_REQ** | HIGH | oral | MO | **Book oncology** (`obook`) → RCC |
| CS-GNR-0007 | Naina Joshi | **SPECIALIST** | HIGH | breast | ONCO (onco visit ≤ today) | **Record consultation** (`consult`) |
| CS-GNR-0008 | Dinesh Dabhi | **MISSED** | MEDIUM | oral | MO | **Rebook or close**; ASHA/CHO may see **field visit** (no mobile) |
| CS-GNR-0009 | Geeta Prajapati | **BOOKED** | MEDIUM | cervical | — | Future visit (+2 days); Print slip when due |
| CS-GNR-0010 | Sumanben Makwana | **CLOSED** | LOW | breast | — | Closed reason set; limited further actions |

Related seed side-data (visible on detail / Messages / Alerts):

- Bookings for 0003, 0009 (ACTIVE), 0008 (MISSED), 0007 (ONCOLOGY).
- Diagnostic tests: pending colposcopy on 0005; positive oral biopsy on 0006.
- Alerts: CHO pending (0001), MO booking (0002), hospital visit today (0003), missed visit CRIT (0008).
- Messages: SMS booking (0003), IVRS reminder (0009).

---

## 3. Working clinical pathway (create → next steps)

Happy path exercised by `npm run test:pathway` (headed Playwright). Stages must match chips on patient detail.

```
ASHA  New screening  →  stage CHO
CHO   Forward to MO  →  stage REVIEW
MO    Approve & book →  stage BOOKED (+ Timeline, Print slip)
```

### Step-by-step (manual)

1. **ASHA** (`9876543210`) → **New screening**
   - Fill: Full name, Age (empty by default — do not leave demo `45`), Sex, Mobile, Village, PHC, Findings (≥ meaningful text).
   - **Save screening** → navigates to `/patients/{id}`.
   - Assert: heading = name; chip **CHO**; risk chip present.

2. **Log out / switch to CHO** (`9876543211`) → open same patient URL  
   - Assert: button **Forward to MO**.
   - Click → chip becomes **REVIEW**.

3. **Switch to MO** (`9876543212`) → same patient  
   - Assert: section **Approve & book**, enabled day buttons in `.pool`.
   - Pick a day → **Confirm booking**.
   - Assert: chip **BOOKED**; **Timeline** section; **Print slip** enabled.

4. Optional later stages (seeded or after hospital flow):
   - HOSP on BOOKED (visit due): Attend / Can't serve → often **TESTED**.
   - PATH on TESTED: report result → may move to **ONCO_REQ** / close paths.
   - MO on ONCO_REQ: Book oncology → **SPECIALIST**.
   - ONCO on SPECIALIST: Record consultation.

---

## 4. Role → UI actions (patient detail)

Backend `WorklistService.actionsFor` drives the **Available actions** / booking panels. Frontend maps `act` codes:

| `act` | UI control | Typical stage + role |
|-------|------------|----------------------|
| `approve` | Forward to MO | CHO + CHO |
| `refer` | Approve & book | REVIEW + MO |
| `obook` | Book oncology | ONCO_REQ + MO |
| `rebook` | Rebook or close | MISSED / ONCO_MISSED + MO |
| `ack` | Acknowledge | Hospital-entry + MO (not yet acked) |
| `attend` / `cantserve` | Record visit / Could not serve | BOOKED + HOSP, visit ≤ today |
| `report` / `inconclusive` | Update tests / Mark inconclusive | TESTED + PATH |
| `consult` | Record consultation | SPECIALIST + ONCO, onco visit ≤ today |
| `monitor` | Counsel / monitor | MONITOR + ASHA |
| `fieldvisit` | Field follow-up / Record contact | ASHA/CHO when miss ladder or no mobile |
| `exit` | Exit pathway | MO/HOSP/ONCO/CHO, not CLOSED |
| `txstart` | Start treatment | CLOSED + POSITIVE result, not yet started |

If the wrong role opens a patient, actions list is empty or limited — that is expected (scope + stage).

---

## 5. Automated UI tests

```bash
# FE + BE must already be running
npx playwright install chromium   # once
npm run test:ui                   # scripts/ui-walk.mjs
npm run test:pathway              # scripts/ui-pathway-flow.mjs
```

Env overrides: `CARESETU_URL`, `CARESETU_API`.

### `test:ui` — route walk (ADMIN preferred)

Covers soft-nav + screenshot for:

`/` · `/patients` · `/screening` · `/add-patient` · `/appointments` · `/dashboard` · `/intervals` · `/audit` · `/map` · `/alerts` · `/messages` · `/finder` · `/settings` · `/help` · `/about` · first patient detail · Print slip trial click.

Extra asserts: not bounced to login; age fields on screening/add/finder are **not** stuck at 45/50.

Artefacts: `ui-walk-shots/*.png` + `summary.json` (gitignored).

### `test:pathway` — create then next step

| Step id | Role | Pass criteria |
|---------|------|---------------|
| `01-asha-home` | ASHA | Session accepted, not on `/login` |
| `02-create-screening` | ASHA | URL `/patients/…`; name heading; chip **CHO** |
| `03-cho-forward` | CHO | Forward to MO; chip **REVIEW** |
| `04-mo-book` | MO | Day selected; Confirm booking; chip **BOOKED** |
| `05-timeline-print` | MO | Timeline visible; Print slip visible |

Artefacts: `ui-walk-shots/pathway/` + `summary.json`. Last verified run: **5/5 PASS**.

---

## 6. Manual regression checklist (beyond pathway)

| # | Case | How | Pass |
|---|------|-----|------|
| M1 | Login all role chips | Each mobile + OTP | Correct name/role in header |
| M2 | Seeded CHO queue | CHO opens CS-GNR-0001 | Forward to MO works |
| M3 | Seeded REVIEW book | MO opens CS-GNR-0002 | Book → BOOKED |
| M4 | Print slip | BOOKED patient | New window/print content (not blank) |
| M5 | Missed field path | ASHA opens CS-GNR-0008 | Field contact / miss UI available |
| M6 | PATH report | PATH opens CS-GNR-0005 | Update tests form |
| M7 | i18n | EN → GU → HI | Labels change; layout intact |
| M8 | Offline / theme | Settings prefs | Toggle without crash |
| M9 | SOS / helpdesk chrome | Any page | SOS 108, footer 104/108 visible |
| M10 | Build gates | `npm run lint` · `npm run build` | Exit 0 |

---

## 7. Companion backend tests

Unit / service tests live in **Caresetu-BE** (`./mvnw test`). See that repo’s `docs/SAMPLE_DATA_AND_TESTS.md` for seed SQL detail and `WorklistServiceTest` cases (ASHA monitor; HOSP attend/cantserve on BOOKED).
