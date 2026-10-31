import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/caresetuApi'
import { StatGrid } from '../components/StatGrid'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'
import { downloadCsv } from '../lib/exportCsv'
import { humanLabel } from '../lib/labels'
import { useAuthStore } from '../store/authStore'

function BarChart({ items }: { items: { label: string; value: number; max: number }[] }) {
  return (
    <div className="barchart">
      {items.map((it) => (
        <div key={it.label} className="bar-row">
          <span>{humanLabel(it.label)}</span>
          <div className="bar-track">
            <i style={{ width: `${Math.max(4, (it.value / (it.max || 1)) * 100)}%` }} />
          </div>
          <b>{it.value}</b>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const roles = useAuthStore((s) => s.user?.roles || [])
  const { data, error, loading, reload } = useAsync(() => getDashboard(), [])

  const stageBars = useMemo(() => {
    if (!data) return []
    const keys = ['monitor', 'inReview', 'booked', 'tested', 'onco', 'missed', 'closed']
    const vals = keys.map((k) => Number(data.counts[k] || 0))
    const max = Math.max(1, ...vals)
    return keys.map((k, i) => ({ label: k, value: vals[i], max }))
  }, [data])

  if (loading) return <LoadingState label="Loading dashboard…" />
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
        eyebrow={`Programme · ${data.level}`}
        title={data.title}
        subtitle={`Signed in as ${roles.join(', ') || 'user'}`}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                downloadCsv(`caresetu-dashboard-${data.level}.csv`, [
                  { metric: 'level', value: data.level },
                  ...Object.entries(data.counts).map(([k, v]) => ({ metric: k, value: v })),
                  ...data.kpis.map((k) => ({ metric: k.code, value: k.value, label: k.label })),
                ])
              }
            >
              Export CSV
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />

      <div className="hero-note">
        Live scope counters refresh with every pathway action. Use indicators for programme review.
      </div>

      <StatGrid stats={data.counts} />

      <div className="split">
        <Section
          title={`Indicators ${data.kpis[0]?.code?.startsWith('F') ? 'F1–F4' : 'K1–K8'}`}
          subtitle="Outcome metrics for the current catchment"
        >
          <div className="kpi-grid">
            {data.kpis.map((k) => (
              <div key={k.code} className="kpi">
                <span className="eyebrow">{k.code}</span>
                <b>{k.value}</b>
                <div>{k.label}</div>
                <small className="muted">{k.hint}</small>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Stage mix" subtitle="Distribution of open and closed pathways">
          <BarChart items={stageBars} />
        </Section>
      </div>

      <Section title="Priority highlights" subtitle="Cases needing attention in your role">
        {data.highlights.length === 0 ? (
          <EmptyState title="No high-priority items" description="Nothing escalated in this scope." />
        ) : (
          <div className="list">
            {data.highlights.map((h) => (
              <Link key={String(h.id)} to={`/patients/${h.id}`} className="patient-card">
                <div className="pc-top">
                  <div className="pc-avatar" aria-hidden>
                    {String(h.name || '?')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="pc-main">
                    <div className="pc-name">{h.name}</div>
                    <div className="muted small">
                      {h.uhid} · {h.type}
                    </div>
                  </div>
                  <div className="chips">
                    <span className={`chip ${String(h.risk).toLowerCase()}`}>{h.risk}</span>
                    <span className="chip">{h.stage}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </Page>
  )
}
