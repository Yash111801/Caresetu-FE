import { useEffect, useState } from 'react'
import { getMeta } from '../api/caresetuApi'
import { Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useI18n } from '../store/i18nStore'
import {
  clearOfflineQueue,
  listOfflineQueue,
  usePrefs,
  type TextSize,
  type Theme,
} from '../store/prefsStore'

export function SettingsPage() {
  const { lang, setLang, t } = useI18n()
  const { theme, textSize, offline, queued, setTheme, setTextSize, setOffline, refreshQueue } =
    usePrefs()
  const [queue, setQueue] = useState(listOfflineQueue())

  useEffect(() => {
    refreshQueue()
    setQueue(listOfflineQueue())
  }, [queued, refreshQueue])

  return (
    <Page>
      <PageHeader
        eyebrow="Account"
        title={t('settings')}
        subtitle="Language, theme, offline demo queue"
      />
      <Section title="Display" subtitle="Language, theme and readability">
        <div className="form-grid">
          <label className="field">
            {t('language')}
            <select value={lang} onChange={(e) => setLang(e.target.value as 'en' | 'gu' | 'hi')}>
              <option value="en">English</option>
              <option value="gu">ગુજરાતી</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <label className="field">
            Theme
            <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="field">
            Text size
            <select value={textSize} onChange={(e) => setTextSize(e.target.value as TextSize)}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Offline & session" subtitle="Field queue and local credentials">
        <label className="check">
          <input
            type="checkbox"
            checked={offline}
            onChange={(e) => setOffline(e.target.checked)}
          />
          <span>Offline mode (queue field actions locally)</span>
        </label>
        <p className="hint">
          When offline is on, acknowledge / field-visit actions are queued on this device. Sync is
          demo-only — flush clears the queue after reconnect.
        </p>
        <div className="row">
          <span className="chip">{queued} queued</span>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              clearOfflineQueue()
              setQueue([])
            }}
            disabled={queued === 0}
          >
            Flush / clear queue
          </button>
        </div>
        {queue.length > 0 && (
          <div className="list">
            {queue.map((q) => (
              <div key={q.id} className="mini">
                <b>{q.label}</b>
                <span className="muted small">
                  {q.method} {q.path} · {new Date(q.at).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            localStorage.removeItem('caresetu.access')
            localStorage.removeItem('caresetu.refresh')
            window.location.href = '/login'
          }}
        >
          Clear local session
        </button>
      </Section>
    </Page>
  )
}

export function HelpPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Account · Guide"
        title="How to use CARESETU"
        subtitle="Field → PHC → Hospital → Cancer Centre"
      />
      <Section title="Pathway in six steps">
        <ol>
          <li>
            <b>ASHA / CHO</b> capture screening (optional voice note). Symptomatic cases go for
            review.
          </li>
          <li>
            <b>PHC MO</b> approves and books a green-channel place (10/day shared pool). Acknowledge
            hospital OPD entries from your area.
          </li>
          <li>
            <b>Hospital doctor</b> records attendance or could-not-serve; diagnostics update
            reports (incl. inconclusive).
          </li>
          <li>
            <b>Missed visits</b> trigger SMS → IVRS ladder → field task. Escalate after day 7.
          </li>
          <li>
            <b>Positive cases</b> are booked to the Regional Cancer Centre; mark treatment start /
            exit as needed.
          </li>
          <li>
            <b>Programme officers</b> watch role dashboards (K1–K8), intervals, monthly audit and map
            heat.
          </li>
        </ol>
        <p className="hint">
          Helplines: Ambulance{' '}
          <a href="tel:108">
            <b>108</b>
          </a>{' '}
          · Health{' '}
          <a href="tel:104">
            <b>104</b>
          </a>{' '}
          · PM-JAY{' '}
          <a href="tel:14555">
            <b>14555</b>
          </a>
        </p>
      </Section>
    </Page>
  )
}

export function AboutPage() {
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null)
  useEffect(() => {
    getMeta().then(setMeta).catch(() => undefined)
  }, [])
  return (
    <Page>
      <PageHeader
        eyebrow="Account"
        title="About CARESETU"
        subtitle="Cancer Referral and Service Tracking Utility"
      />
      <Section title="Product">
        <img src="/assets/logo-full.png" alt="CARESETU" className="about-logo" />
        <p>
          CARESETU connects community screening, PHC referral, hospital diagnosis and the Cancer
          Centre so every suspected cancer reaches the right place on time.
        </p>
        <dl className="meta">
          <div>
            <dt>Version</dt>
            <dd>{String(meta?.version || '2.3-prod')}</dd>
          </div>
          <div>
            <dt>Organisation</dt>
            <dd>{String(meta?.org || 'NP-NCD Gujarat')}</dd>
          </div>
          <div>
            <dt>Pool capacity</dt>
            <dd>{String(meta?.poolCap || 10)} places / day</dd>
          </div>
        </dl>
        <p className="hint">
          Not for clinical use with synthetic demo data until production gateways are connected.
        </p>
      </Section>
    </Page>
  )
}
