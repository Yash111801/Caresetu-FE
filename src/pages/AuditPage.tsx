import { Link } from 'react-router-dom'
import { getMonthlyAudit } from '../api/caresetuApi'
import { StatGrid } from '../components/StatGrid'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'

export function AuditPage() {
  const { data, error, loading, reload } = useAsync(() => getMonthlyAudit(), [])

  if (loading) return <LoadingState label="Loading monthly audit…" />
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

  const counts = (data.counts as Record<string, number>) || {}
  const rows = (data.rows as Record<string, string>[]) || []

  return (
    <Page>
      <PageHeader
        eyebrow="Programme · Compliance"
        title="Monthly audit"
        subtitle={`Auto-generated exception list · month ${String(data.monthKey)}`}
        actions={
          <Button
            variant="ghost"
            onClick={() => {
              const csv = [
                'area,issue,status,due',
                ...rows.map((r) =>
                  [r.areaName, r.issueText, r.status, r.dueDate || '']
                    .map((x) => `"${String(x).replace(/"/g, '""')}"`)
                    .join(','),
                ),
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'caresetu-monthly-audit.csv'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download CSV
          </Button>
        }
      />
      <StatGrid stats={counts} />
      <Section title="Exceptions" subtitle="Open items for district / block review">
        {rows.length === 0 ? (
          <EmptyState title="No exceptions this month" />
        ) : (
          <div className="list">
            {rows.map((r) => (
              <div key={r.id} className="patient-card">
                <div className="between">
                  <div>
                    <div className="pc-name">{r.areaName}</div>
                    <div className="muted small">{r.issueCode}</div>
                    <p style={{ margin: '6px 0 0' }}>{r.issueText}</p>
                  </div>
                  <div className="chips">
                    <span
                      className={`chip ${r.status === 'Open' ? 'crit' : r.status === 'Corrected' ? 'ok' : 'warn'}`}
                    >
                      {r.status}
                    </span>
                    {r.patientId && (
                      <Link className="btn sm" to={`/patients/${r.patientId}`}>
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Page>
  )
}
