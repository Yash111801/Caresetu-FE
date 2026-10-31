import { Link } from 'react-router-dom'
import { getIntervals } from '../api/caresetuApi'
import { StatGrid } from '../components/StatGrid'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'

export function IntervalsPage() {
  const { data, error, loading, reload } = useAsync(() => getIntervals(), [])

  if (loading) return <LoadingState label="Loading intervals…" />
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

  const rows = (data.rows as Record<string, unknown>[]) || []
  const summary = (data.summary as Record<string, number>) || {}

  return (
    <Page>
      <PageHeader
        eyebrow="Programme · Timeliness"
        title="Time intervals"
        subtitle="Days from screening to booking / report / oncology"
      />
      <StatGrid stats={summary} />
      <Section title="Patient intervals" subtitle="WHO class shown where recorded">
        {rows.length === 0 ? (
          <EmptyState title="No interval rows" />
        ) : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Stage</th>
                  <th>→ Booking</th>
                  <th>→ Report</th>
                  <th>→ Oncology</th>
                  <th>WHO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id)}>
                    <td>
                      <Link to={`/patients/${r.id}`}>
                        <b>{String(r.name)}</b>
                        <div className="muted small">{String(r.uhid)}</div>
                      </Link>
                    </td>
                    <td>{String(r.type)}</td>
                    <td>
                      <span className="chip">{String(r.stage)}</span>
                    </td>
                    <td>{r.daysToBooking == null ? '—' : `${r.daysToBooking}d`}</td>
                    <td>{r.daysToReport == null ? '—' : `${r.daysToReport}d`}</td>
                    <td>{r.daysToOncology == null ? '—' : `${r.daysToOncology}d`}</td>
                    <td className="small">{r.whoClass ? String(r.whoClass) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </Page>
  )
}
