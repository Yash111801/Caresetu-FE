import { humanLabel } from '../lib/labels'

type Props = { stats: Record<string, number | string> }

const TONE: Record<string, string> = {
  highRisk: 'crit',
  missed: 'crit',
  closed: 'ok',
  booked: 'info',
  tested: 'warn',
  onco: 'warn',
  treatmentStarted: 'ok',
  open: 'info',
}

export function StatGrid({ stats }: Props) {
  return (
    <div className="stat-grid">
      {Object.entries(stats).map(([k, v]) => (
        <div key={k} className={`stat tone-${TONE[k] || 'default'}`}>
          <span className="stat-label">{humanLabel(k)}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  )
}
