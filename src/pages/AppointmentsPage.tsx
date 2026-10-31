import { useEffect, useState } from 'react'
import { getAppointments, getPool, listFacilities } from '../api/caresetuApi'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { getErrorMessage } from '../lib/errors'
import type { Facility, PoolDay } from '../types/domain'
import { useAuthStore } from '../store/authStore'

export function AppointmentsPage() {
  const user = useAuthStore((s) => s.user)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [code, setCode] = useState(user?.facilityCode || 'DH')
  const [pool, setPool] = useState<PoolDay[]>([])
  const [appts, setAppts] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFacilities()
      .then(setFacilities)
      .catch((e) => setError(getErrorMessage(e)))
  }, [])

  useEffect(() => {
    if (!code) return
    setLoading(true)
    Promise.all([getPool(code, 7), getAppointments(code)])
      .then(([p, a]) => {
        setPool(p)
        setAppts(a as Record<string, unknown>[])
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
  }, [code])

  return (
    <Page>
      <PageHeader
        eyebrow="Care pathway · Booking"
        title="Appointments"
        subtitle="Green-channel places · 10 a day shared by referring PHCs"
        actions={
          <select className="lang-select" value={code} onChange={(e) => setCode(e.target.value)}>
            {facilities.map((f) => (
              <option key={f.code} value={f.code}>
                {f.shortName} · {f.facilityType}
              </option>
            ))}
          </select>
        }
      />
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <LoadingState label="Loading pool…" />
      ) : (
        <>
          <Section title="7-day pool" subtitle={`Facility ${code}`}>
            <div className="pool big">
              {pool.map((d) => (
                <div key={d.date} className={!d.open || d.left === 0 ? 'full' : ''}>
                  <span className="muted small">{d.date}</span>
                  <b>
                    {d.used}
                    <small>/{d.capacity}</small>
                  </b>
                  <span>{d.open ? `${d.left} left` : 'Closed'}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Active bookings" subtitle="Current green-channel appointments">
            {appts.length === 0 ? (
              <EmptyState title="No active bookings" description="Book from a patient record when MO approves." />
            ) : (
              <div className="list">
                {appts.map((a) => (
                  <div key={String(a.id)} className="patient-card">
                    <div className="between">
                      <div>
                        <div className="pc-name">
                          {String(a.facilityCode)} · {String(a.bookingDate)}
                        </div>
                        <div className="muted small">
                          {String(a.windowLabel)} · place {String(a.placeNo)} · {String(a.bookingKind)}
                        </div>
                      </div>
                      <span className="chip info">{String(a.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </Page>
  )
}
