import { getMessages } from '../api/caresetuApi'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'

export function MessagesPage() {
  const { data, error, loading } = useAsync(() => getMessages(), [])
  const items = data ?? []

  if (loading) return <LoadingState label="Loading messages…" />

  return (
    <Page>
      <PageHeader
        eyebrow="Programme · Outbox"
        title="Messages"
        subtitle="SMS / IVRS outbox · demo gateway"
      />
      {error && <ErrorBanner message={error} />}
      <Section title="Delivery log" subtitle={`${items.length} recent contacts`}>
        {items.length === 0 ? (
          <EmptyState title="No messages yet" description="Contacts appear when missed-visit ladder runs." />
        ) : (
          <div className="list">
            {items.map((m) => (
              <div key={m.id} className="msg-row">
                <div className="msg-meta">
                  <b>
                    {m.channel} · {m.status}
                  </b>
                  <span className="muted small">{m.createdAt}</span>
                </div>
                <div className="muted small">
                  {m.mobile} · {m.language}
                </div>
                <p style={{ margin: '8px 0 0' }}>{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Page>
  )
}
