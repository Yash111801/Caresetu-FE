export type WorkAction = {
  act: string
  label: string
  what: string
  flag?: string | null
}

export type PatientSummary = {
  id: string
  uhid: string
  fullName: string
  age: number
  sex: string
  mobile?: string | null
  village?: string | null
  phcCode: string
  cancerType: string
  presentation: string
  stage: string
  riskLevel: string
  assignedFacCode?: string | null
  visitAt?: string | null
  visitWindow?: string | null
  actions: WorkAction[]
}

export type PatientDetail = PatientSummary & {
  taluka?: string | null
  district?: string | null
  stateCode?: string | null
  screenedByName?: string | null
  screenedByRole?: string | null
  screenedAt?: string | null
  findingNotes?: string | null
  testFacCode?: string | null
  reportDue?: string | null
  reportAt?: string | null
  testResult?: string | null
  oncoVisitAt?: string | null
  treatmentPlan?: string | null
  closedReason?: string | null
  moAcked: boolean
  counselled: boolean
  monitorUntil?: string | null
  latitude?: number | null
  longitude?: number | null
  abhaId?: string | null
  smsLang?: string | null
  incomeBand?: string | null
  rationCard?: string | null
  hasPmjayCard?: boolean | null
  esic?: boolean
  govtEmployee?: boolean
  privateInsurance?: boolean
  gpsConsent?: boolean
  dataConsent?: boolean
  whoClass?: string | null
  entrySource?: string | null
  treatmentStarted?: boolean
  exitReason?: string | null
  informedAt?: string | null
  assessedAt?: string | null
  consultAt?: string | null
  timeline: { eventType: string; message: string; actorName?: string; actorRole?: string; at?: string }[]
  bookings: {
    id: string
    facilityCode: string
    bookingDate: string
    windowLabel: string
    placeNo: number
    status: string
    bookingKind: string
    bookedByName?: string
  }[]
  tests: {
    id: number
    testName: string
    status: string
    resultCode?: string | null
    resultNotes?: string | null
    reportedAt?: string | null
  }[]
  eligibility?: {
    eligible?: Record<string, string>[]
    possible?: Record<string, string>[]
  }
  miss?: Record<string, unknown>
  contacts?: {
    channel: string
    status: string
    attemptNo: number
    notes?: string
    at?: string
  }[]
}

export type HomeData = {
  greeting: string
  roleTitle: string
  stats: Record<string, number>
  worklist: PatientSummary[]
  tips: string[]
}

export type Facility = {
  code: string
  name: string
  shortName: string
  facilityType: string
  addressHint?: string
  hours?: string
  latitude?: number
  longitude?: number
  dailyPoolCap: number
  reportDays: number
  services: string[]
}

export type Phc = {
  code: string
  name: string
  taluka?: string
  district: string
  stateCode: string
  latitude?: number
  longitude?: number
  backupTeam: boolean
}

export type PoolDay = {
  date: string
  used: number
  capacity: number
  left: number
  open: boolean
}

export type DashboardData = {
  level: string
  title: string
  counts: Record<string, number>
  kpis: { code: string; label: string; value: string; hint: string }[]
  highlights: Record<string, string>[]
}

export type AlertItem = {
  id: string
  title: string
  body: string
  severity: string
  patientId?: string | null
  read: boolean
  createdAt?: string
}
