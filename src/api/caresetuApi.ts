import { api } from './client'
import type { ApiResponse } from '../types/auth'
import type {
  AlertItem,
  DashboardData,
  Facility,
  HomeData,
  PatientDetail,
  PatientSummary,
  Phc,
  PoolDay,
} from '../types/domain'

export async function getHome() {
  const { data } = await api.get<ApiResponse<HomeData>>('/home')
  return data.data
}

export async function listPatients(params?: { stage?: string; q?: string }) {
  const { data } = await api.get<ApiResponse<PatientSummary[]>>('/patients', { params })
  return data.data
}

export async function getPatient(id: string) {
  const { data } = await api.get<ApiResponse<PatientDetail>>(`/patients/${id}`)
  return data.data
}

export async function createScreening(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<PatientDetail>>('/screenings', payload)
  return data.data
}

export async function choReview(id: string, outcome: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/cho-review`, {
    outcome,
    notes,
  })
  return data.data
}

export async function referBook(
  id: string,
  payload: { facilityCode: string; bookingDate: string; windowLabel: string },
) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/refer`, payload)
  return data.data
}

export async function attendVisit(id: string, outcome: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/attend`, {
    outcome,
    notes,
  })
  return data.data
}

export async function reportTest(
  id: string,
  payload: { testId: number; resultCode: string; resultNotes?: string },
) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/report`, payload)
  return data.data
}

export async function oncologyBook(
  id: string,
  payload: { facilityCode: string; bookingDate: string; windowLabel: string },
) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(
    `/patients/${id}/oncology-book`,
    payload,
  )
  return data.data
}

export async function consult(
  id: string,
  payload: { outcome: string; treatmentPlan?: string; notes?: string },
) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/consult`, payload)
  return data.data
}

export async function closeCase(id: string, reason: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/close`, {
    reason,
    notes,
  })
  return data.data
}

export async function monitorVisit(id: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/monitor`, { notes })
  return data.data
}

export async function listFacilities() {
  const { data } = await api.get<ApiResponse<Facility[]>>('/facilities')
  return data.data
}

export async function listPhcs() {
  const { data } = await api.get<ApiResponse<Phc[]>>('/phcs')
  return data.data
}

export async function getPool(code: string, days = 7) {
  const { data } = await api.get<ApiResponse<PoolDay[]>>(`/facilities/${code}/pool`, {
    params: { days },
  })
  return data.data
}

export async function getAppointments(code: string) {
  const { data } = await api.get<ApiResponse<unknown[]>>(`/facilities/${code}/appointments`)
  return data.data
}

export async function getDashboard() {
  const { data } = await api.get<ApiResponse<DashboardData>>('/dashboard')
  return data.data
}

export async function getAlerts() {
  const { data } = await api.get<ApiResponse<AlertItem[]>>('/alerts')
  return data.data
}

export async function markAlertRead(id: string) {
  const { data } = await api.post<ApiResponse<AlertItem>>(`/alerts/${id}/read`)
  return data.data
}

export async function getMessages() {
  const { data } = await api.get<ApiResponse<Record<string, string>[]>>('/messages')
  return data.data
}

export async function getMapData() {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/map')
  return data.data
}

export async function getMeta() {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/meta')
  return data.data
}

export async function listSchemes() {
  const { data } = await api.get<ApiResponse<Record<string, unknown>[]>>('/schemes')
  return data.data
}

export async function evaluateSchemes(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<Record<string, unknown>>>('/schemes/evaluate', payload)
  return data.data
}

export async function saveEligibility(id: string, payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/eligibility`, payload)
  return data.data
}

export async function addHospitalPatient(payload: Record<string, unknown>) {
  const { data } = await api.post<ApiResponse<PatientDetail>>('/patients/hospital', payload)
  return data.data
}

export async function getMonthlyAudit(monthKey?: number) {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/audit/monthly', {
    params: monthKey ? { monthKey } : undefined,
  })
  return data.data
}

export async function getIntervals() {
  const { data } = await api.get<ApiResponse<Record<string, unknown>>>('/intervals')
  return data.data
}

export async function acknowledge(id: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/ack`, { notes })
  return data.data
}

export async function markInconclusive(id: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/inconclusive`, {
    notes,
  })
  return data.data
}

export async function startTreatment(id: string, plan?: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/treatment-start`, {
    plan,
    notes,
  })
  return data.data
}

export async function exitPathway(id: string, reason: string, notes?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/exit`, {
    reason,
    notes,
  })
  return data.data
}

export async function fieldVisit(id: string, feedback?: string) {
  const { data } = await api.post<ApiResponse<PatientDetail>>(`/patients/${id}/field-visit`, {
    feedback,
  })
  return data.data
}
