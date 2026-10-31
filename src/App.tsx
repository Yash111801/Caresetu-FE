import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingState } from './components/ui/Page'
import { AddPatientPage } from './pages/AddPatientPage'
import { AlertsPage } from './pages/AlertsPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { AuditPage } from './pages/AuditPage'
import { DashboardPage } from './pages/DashboardPage'
import { FinderPage } from './pages/FinderPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { AboutPage, HelpPage, SettingsPage } from './pages/InfoPages'
import { HomePage } from './pages/HomePage'
import { IntervalsPage } from './pages/IntervalsPage'
import { LoginPage } from './pages/LoginPage'
import { MapPage } from './pages/MapPage'
import { MessagesPage } from './pages/MessagesPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { PatientsPage } from './pages/PatientsPage'
import { ScreeningPage } from './pages/ScreeningPage'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { useAuthStore } from './store/authStore'

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap)
  const bootstrapped = useAuthStore((s) => s.bootstrapped)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  if (!bootstrapped) {
    return (
      <div className="center">
        <LoadingState label="Starting CARESETU…" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/screening" element={<ScreeningPage />} />
              <Route path="/add-patient" element={<AddPatientPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/intervals" element={<IntervalsPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/finder" element={<FinderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
