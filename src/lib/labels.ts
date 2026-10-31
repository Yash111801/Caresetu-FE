const STAT_LABELS: Record<string, string> = {
  total: 'Total cases',
  monitor: 'Monitoring',
  inReview: 'In review',
  booked: 'Booked',
  tested: 'Tested',
  onco: 'Oncology',
  missed: 'Missed',
  closed: 'Closed',
  highRisk: 'High risk',
  treatmentStarted: 'Treatment started',
  open: 'Open actions',
  avgDaysToBooking: 'Avg → booking',
  avgDaysToReport: 'Avg → report',
  avgDaysToOncology: 'Avg → oncology',
}

export function humanLabel(key: string): string {
  if (STAT_LABELS[key]) return STAT_LABELS[key]
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

export function stageTone(stage: string): string {
  const s = stage.toUpperCase()
  if (s.includes('MISS')) return 'crit'
  if (s === 'CLOSED') return 'ok'
  if (s === 'BOOKED' || s === 'SPECIALIST') return 'info'
  if (s === 'TESTED' || s === 'ONCO_REQ') return 'warn'
  return 'acc'
}
