import { Link } from 'react-router-dom'
import { getHome } from '../api/caresetuApi'
import { PatientCard } from '../components/PatientCard'
import { StatGrid } from '../components/StatGrid'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../store/i18nStore'
import { useAuthStore } from '../store/authStore'

export function HomePage() {
  const { t } = useI18n()
  const hasScreening = useAuthStore((s) => s.hasPermission('SCREENING_WRITE'))
  const { data, error, loading, reload } = useAsync(() => getHome(), [])

  if (loading) return <LoadingState label="Loading home…" />
  if (error) {
    return (
      <Page>
        <ErrorBanner message={error} />
        <Button variant="ghost" onClick={reload}>
          Retry
        </Button>
      </Page>
    )
  }
  if (!data) return null

  return (
    <Page>
      <PageHeader
        eyebrow="Field work · Home"
        title={data.greeting}
        subtitle={`Role · ${data.roleTitle}`}
        actions={
          hasScreening ? (
            <Link className="btn primary" to="/screening">
              + {t('screening')}
            </Link>
          ) : null
        }
      />

      <StatGrid stats={data.stats} />

      <Section title="Quick actions" subtitle="Jump into the most used field workflows">
        <div className="quick-grid">
          {hasScreening && (
            <Link className="quick-link" to="/screening">
              <b>New screening</b>
              <span>Capture oral / breast / cervical finding</span>
            </Link>
          )}
          <Link className="quick-link" to="/patients">
            <b>Patients</b>
            <span>Search and open cases in your scope</span>
          </Link>
          <Link className="quick-link" to="/dashboard">
            <b>Dashboard</b>
            <span>Role indicators and priorities</span>
          </Link>
          <Link className="quick-link" to="/finder">
            <b>Hospital finder</b>
            <span>Green-channel facilities & schemes</span>
          </Link>
        </div>
      </Section>

      <Section
        title={t('worklist')}
        subtitle="Cases needing attention in your catchment"
        actions={
          <Link className="btn ghost sm" to="/patients">
            All patients
          </Link>
        }
      >
        <div className="list">
          {data.worklist.length === 0 ? (
            <EmptyState
              title="You're clear for now"
              description={t('noActions')}
              action={
                hasScreening ? (
                  <Link className="btn primary sm" to="/screening" style={{ marginTop: 8 }}>
                    Start a screening
                  </Link>
                ) : null
              }
            />
          ) : (
            data.worklist.map((p) => <PatientCard key={p.id} patient={p} />)
          )}
        </div>
      </Section>

      <Section title={t('tips')} soft>
        <ul className="tip-list">
          {data.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}
