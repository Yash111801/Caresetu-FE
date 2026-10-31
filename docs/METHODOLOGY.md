# Methodology and process for implementation

CARESETU was built as a layered referral system: **domain model first**, then **API**, then **role-aware SPA**, then **validation** and **docs**. The clinical flow does not stop at the hospital doctor — **Diagnostics (PATH)** and **Specialists (ONCO)** are first-class stages.

---

## 1. Implementation process

| Phase | What we did | Outcome |
|-------|-------------|---------|
| **1. Domain model** | Roles ASHA → CHO → MO → **HOSP** → **PATH** → **ONCO** (+ oversight ADMIN/BLK/DIST/SNO/NAT); patient stages `MONITOR … CLOSED` | Shared language for FE + BE |
| **2. API first** | OTP/JWT auth, RBAC + geographic scope, pathway actions, Flyway schema + demo seed | Stable `/api/v1` contract |
| **3. SPA** | React shell, role-gated nav, patient detail actions from backend worklist | Field and facility UIs |
| **4. Validate** | BE unit tests; headed UI walk; pathway ASHA → CHO → MO → BOOKED; manual seed cases for HOSP/PATH/ONCO | Working end-to-end demo |
| **5. Docs** | README, architecture, sample data/tests, methodology (this file), MIT license | Reproducible public repos |

```mermaid
flowchart LR
  A[1 Domain model] --> B[2 API first]
  B --> C[3 SPA]
  C --> D[4 Validate]
  D --> E[5 Docs + license]
```

---

## 2. Domain model — roles

```mermaid
flowchart TB
  subgraph Field["Field / PHC"]
    ASHA[ASHA<br/>Screening]
    CHO[CHO<br/>Review & forward]
    MO[MO<br/>Book hospital / oncology]
  end
  subgraph Facility["Facility"]
    HOSP[HOSP<br/>Hospital doctor]
    PATH[PATH<br/>Diagnostics]
    ONCO[ONCO<br/>Specialist]
  end
  subgraph Oversight["Programme"]
    ADM[ADMIN / BLK / DIST / SNO / NAT]
  end
  ASHA --> CHO --> MO
  MO --> HOSP
  HOSP --> PATH
  PATH --> MO
  MO --> ONCO
  ADM -.-> Field
  ADM -.-> Facility
```

| Role | Actor | Responsibility |
|------|-------|----------------|
| ASHA | Field worker | Create screening → stage **CHO** |
| CHO | Community Health Officer | Forward to MO → **REVIEW** |
| MO | Medical Officer | Book hospital → **BOOKED**; later book oncology → **SPECIALIST** |
| **HOSP** | **Hospital doctor** | Record visit / can’t serve → **TESTED** |
| **PATH** | **Diagnostics** | Enter test report → **ONCO_REQ** or **CLOSED** |
| **ONCO** | **Specialist** | Oncology consult → **CLOSED** / treatment start |
| ADMIN… | Oversight | Dashboard, map, audit, alerts |

---

## 3. Domain model — patient stages

```mermaid
stateDiagram-v2
  [*] --> CHO: ASHA symptomatic screen
  [*] --> MONITOR: ASHA low-risk / counsel
  [*] --> REVIEW: Hospital walk-in / direct MO path

  CHO --> REVIEW: CHO forward
  CHO --> MONITOR: CHO → monitor
  MONITOR --> [*]: continue counsel

  REVIEW --> BOOKED: MO approve & book
  BOOKED --> TESTED: HOSP attend
  BOOKED --> MISSED: no-show
  MISSED --> BOOKED: MO rebook
  MISSED --> CLOSED: close / exit

  TESTED --> ONCO_REQ: PATH report POSITIVE
  TESTED --> CLOSED: PATH not cancer / negative
  TESTED --> TESTED: PATH inconclusive (repeat)

  ONCO_REQ --> SPECIALIST: MO book oncology
  SPECIALIST --> CLOSED: ONCO consult
  CLOSED --> [*]
```

---

## 4. End-to-end clinical flowchart (primary)

Use this diagram for submission slides / images.

```mermaid
flowchart TD
  Start([Person screened in community]) --> ASHA[ASHA: New screening]
  ASHA --> CHO_S[Stage: CHO]
  CHO_S --> CHO[CHO: Forward to MO]
  CHO --> REV[Stage: REVIEW]
  REV --> MO1[MO: Approve & book hospital]
  MO1 --> BOOK[Stage: BOOKED<br/>Print slip / SMS]
  BOOK --> HOSP[HOSP: Hospital doctor<br/>Record visit]
  HOSP --> TEST[Stage: TESTED]
  TEST --> PATH[PATH: Diagnostics<br/>Update test report]

  PATH -->|POSITIVE| ONR[Stage: ONCO_REQ]
  PATH -->|Negative / not cancer| CL1[Stage: CLOSED]
  PATH -->|Inconclusive| TEST

  ONR --> MO2[MO: Book oncology RCC]
  MO2 --> SPEC[Stage: SPECIALIST]
  SPEC --> ONCO[ONCO: Specialist<br/>Record consultation]
  ONCO --> CL2[Stage: CLOSED]
  CL2 --> TX{Treatment needed?}
  TX -->|Yes| TXS[ONCO/MO: Start treatment]
  TX -->|No| End([Pathway complete])
  TXS --> End
  CL1 --> End
```

### Compact one-liner (for slide bullets)

`ASHA screen → CHO → REVIEW → MO book → BOOKED → HOSP (hospital) → TESTED → PATH (diagnostics) → ONCO_REQ → MO oncology book → SPECIALIST → ONCO (specialist) → CLOSED`

---

## 5. Swimlane — who acts when

```mermaid
sequenceDiagram
  actor ASHA
  actor CHO
  actor MO
  actor HOSP as HOSP (Hospital)
  actor PATH as PATH (Diagnostics)
  actor ONCO as ONCO (Specialist)

  ASHA->>CHO: Screening created (CHO)
  CHO->>MO: Forward (REVIEW)
  MO->>HOSP: Booked visit (BOOKED)
  HOSP->>PATH: Attend → tests ordered (TESTED)
  PATH->>MO: POSITIVE report (ONCO_REQ)
  MO->>ONCO: Oncology booked (SPECIALIST)
  ONCO->>ONCO: Consult → CLOSED
```

---

## 6. API-first process

```mermaid
flowchart LR
  subgraph Auth
    OTP[OTP send/verify] --> JWT[Access + refresh JWT]
  end
  subgraph Security
    RBAC[Roles × permissions] --> Scope[PHC / facility / district scope]
  end
  subgraph Pathway
    Ctrl[Controllers] --> Svc[PatientService actions]
    Svc --> WL[WorklistService<br/>role×stage actions]
    Svc --> DB[(MySQL + Flyway seed)]
  end
  JWT --> Ctrl
  Scope --> Svc
```

- **Auth:** `/api/v1/auth/otp/*`, refresh, `/me`
- **Pathway:** create/screen, approve, refer/book, attend, report, oncology book, consult, rebook, exit, txstart
- **Seed:** Flyway `V1`–`V7` — demo users + patients parked at CHO, REVIEW, BOOKED, TESTED, ONCO_REQ, SPECIALIST, MISSED, CLOSED

---

## 7. SPA process

```mermaid
flowchart TB
  Login[OTP login] --> Shell[AppLayout + role nav]
  Shell --> List[Patients / Home worklist]
  List --> Detail[Patient detail]
  Detail --> Acts[Available actions<br/>from API worklist]
  Acts --> API[POST pathway action]
  API --> Detail
```

UI only shows actions the backend returns for **current role × stage** (e.g. PATH sees report only on **TESTED**; ONCO sees consult only on **SPECIALIST**).

---

## 8. Validation process

| Layer | Coverage |
|-------|----------|
| BE unit | `WorklistServiceTest` (e.g. HOSP attend on BOOKED; ASHA monitor) |
| FE headed walk | `npm run test:ui` — major routes |
| FE pathway | `npm run test:pathway` — ASHA → CHO → MO → **BOOKED** |
| Manual / seed | HOSP **CS-GNR-0003**; PATH **0005**; ONCO_REQ **0006**; ONCO **0007** |

```mermaid
flowchart LR
  U[Unit tests] --> W[UI route walk]
  W --> P[Pathway to BOOKED]
  P --> M[Manual HOSP → PATH → ONCO<br/>via seeded patients]
```

---

## 9. Deliverables checklist

- [x] Working prototype (FE + BE)
- [x] Flowcharts (this document — Mermaid; export to PNG/SVG for slides if needed)
- [x] Architecture docs (`docs/ARCHITECTURE.md`)
- [x] Sample data & test cases (`docs/SAMPLE_DATA_AND_TESTS.md`)
- [x] README setup + MIT `LICENSE`
- [x] Public GitHub: [Caresetu-FE](https://github.com/Yash111801/Caresetu-FE) · [Caresetu-BE](https://github.com/Yash111801/Caresetu-BE)

### Exporting charts for PPT

GitHub renders Mermaid in this file. For PowerPoint: open this page on GitHub → copy diagrams, or paste Mermaid into [mermaid.live](https://mermaid.live) → Download PNG/SVG.
