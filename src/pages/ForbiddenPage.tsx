import { Link } from 'react-router-dom'
import { Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'

export function ForbiddenPage() {
  return (
    <Page>
      <PageHeader eyebrow="Access control" title="403 · Forbidden" subtitle="Role permission denied" />
      <Section title="What happened" soft>
        <p className="muted" style={{ margin: 0 }}>
          You do not have permission to view this page for your current role. Switch to an authorised
          role from Sign in, or return home.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn primary" to="/">
            Back to home
          </Link>
          <Link className="btn ghost" to="/login">
            Sign in again
          </Link>
        </div>
      </Section>
    </Page>
  )
}
