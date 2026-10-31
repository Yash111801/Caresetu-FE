import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, markAlertRead } from '../api/caresetuApi'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { getErrorMessage } from '../lib/errors'
import type { AlertItem } from '../types/domain'

export function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setItems(await getAlerts())
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function onRead(id: string) {
    const updated = await markAlertRead(id)
    setItems((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  if (loading) return <LoadingState label="Loading alerts…" />

  return (
    <Page>
      <PageHeader
        eyebrow="Programme · Inbox"
        title="Alerts"
        subtitle="Role-scoped programme and clinical alerts"
        actions={
          <Button variant="ghost" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      {error && <ErrorBanner message={error} />}
      <Section
        title="Inbox"
        subtitle={
          items.length === 0 && !error
            ? 'Nothing pending'
            : `${items.filter((a) => !a.read).length} unread · ${items.length} total`
        }
      >
        {items.length === 0 && !error ? (
          <EmptyState title="No alerts" description="You are up to date for this role." />
        ) : (
          <div className="list">
            {items.map((a) => (
              <div
                key={a.id}
                className={`alert-row ${a.severity.toLowerCase()} ${a.read ? 'read' : ''}`}
              >
                <div className="between">
                  <div>
                    <b>{a.title}</b>
                    <p>{a.body}</p>
                    <small className="muted">{a.createdAt}</small>
                  </div>
                  <div className="stack" style={{ justifyItems: 'end' }}>
                    <span className={`chip ${a.severity.toLowerCase()}`}>{a.severity}</span>
                    {a.patientId && (
                      <Link className="btn sm" to={`/patients/${a.patientId}`}>
                        Open case
                      </Link>
                    )}
                    {!a.read && (
                      <Button variant="ghost" size="sm" onClick={() => void onRead(a.id)}>
                        Mark read
                      </Button>
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
