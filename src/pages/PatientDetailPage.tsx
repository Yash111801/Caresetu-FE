import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import * as api from '../api/caresetuApi'
import { VoiceCapture } from '../components/VoiceCapture'
import { ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { enqueueOffline, usePrefs } from '../store/prefsStore'
import type { Facility, PatientDetail, PoolDay } from '../types/domain'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function printSlip(patient: PatientDetail) {
  // Do not use noopener — browsers then return null and the click does nothing.
  const w = window.open('', '_blank', 'width=720,height=900')
  if (!w) {
    window.alert('Allow pop-ups for CARESETU to print the referral slip.')
    return
  }
  const logo = `${window.location.origin}/assets/logo-full.png`
  const date = new Date().toLocaleDateString('en-IN')
  const rows: [string, string][] = [
    ['Patient', `<b>${escapeHtml(patient.fullName)}</b> · ${escapeHtml(patient.age)}${escapeHtml(patient.sex)}`],
    ['UHID', escapeHtml(patient.uhid)],
    ['Mobile · ABHA', `${escapeHtml(patient.mobile || '—')} · ${escapeHtml(patient.abhaId || '—')}`],
    ['Address', `${escapeHtml(patient.village || '—')}, ${escapeHtml(patient.taluka || patient.phcCode)}`],
    [
      'Screening',
      `${escapeHtml(patient.cancerType)} · ${escapeHtml(patient.presentation)} · ${escapeHtml(patient.screenedByName || '')}`,
    ],
    ['Finding', escapeHtml(patient.findingNotes || '—')],
    ['Referred to', escapeHtml(patient.assignedFacCode || 'Pending')],
    [
      'Appointment',
      `${escapeHtml(patient.visitAt || patient.oncoVisitAt || '—')} ${escapeHtml(patient.visitWindow || '')}`,
    ],
    ['WHO class', escapeHtml(patient.whoClass || '—')],
  ]
  w.document.open()
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>Referral slip</title>
  <style>
    body{font-family:system-ui,sans-serif;padding:24px;color:#17202e;margin:0}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    td{border:1px solid #dce1e8;padding:8px;vertical-align:top}
    td:first-child{width:30%;color:#5b6575;background:#f6f7f9}
    .head{display:flex;gap:12px;align-items:center}
    .head img{height:64px;width:64px;border-radius:8px;object-fit:cover}
    @media print{body{padding:12px}}
  </style></head><body>
  <div class="head"><img src="${logo}" alt="CARESETU"/><div>
  <h2 style="margin:0">Referral slip</h2>
  <div>CARESETU · Gandhinagar · ${escapeHtml(date)}</div></div></div>
  <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>
  <p style="margin-top:16px;color:#5b6575;font-size:12px">Bring this slip, Aadhaar / ABHA and scheme card if any. Helpline 104. Ambulance 108.</p>
  </body></html>`)
  w.document.close()
  w.focus()
  // Wait a tick so the document (and logo) can paint before print dialog.
  window.setTimeout(() => {
    try {
      w.print()
    } catch {
      /* ignore */
    }
  }, 250)
}

const EXIT_REASONS = ['Refused care', 'Died', 'Moved out of area', 'Wrong identity', 'Other']

export function PatientDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const offline = usePrefs((s) => s.offline)
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [pool, setPool] = useState<PoolDay[]>([])
  const [fac, setFac] = useState('DH')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [exitReason, setExitReason] = useState(EXIT_REASONS[0])
  const [txPlan, setTxPlan] = useState('Surgery')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([api.getPatient(id), api.listFacilities()])
      .then(([p, f]) => {
        setPatient(p)
        setFacilities(f)
      })
      .catch((e) => setError(getErrorMessage(e)))
  }, [id])

  useEffect(() => {
    if (!fac) return
    api.getPool(fac, 8).then((days) => {
      setPool(days)
      const first = days.find((d) => d.open && d.left > 0)
      if (first) setDate(first.date)
    })
  }, [fac])

  async function run(action: () => Promise<PatientDetail>, offlineMeta?: { label: string; path: string; body?: unknown }) {
    setBusy(true)
    setError(null)
    try {
      if (offline && offlineMeta) {
        enqueueOffline({
          label: offlineMeta.label,
          path: offlineMeta.path,
          method: 'POST',
          body: offlineMeta.body,
        })
        setError(null)
        alert(`Queued offline: ${offlineMeta.label}`)
        return
      }
      const p = await action()
      setPatient(p)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!patient) {
    return error ? (
      <Page>
        <ErrorBanner message={error} />
      </Page>
    ) : (
      <LoadingState label="Loading patient…" />
    )
  }

  const acts = new Set(patient.actions.map((a) => a.act))
  const miss = patient.miss || {}
  const hasMiss = Object.keys(miss).length > 0

  return (
    <Page>
      <PageHeader
        eyebrow="Care pathway · Patient record"
        title={patient.fullName}
        subtitle={`${patient.uhid} · ${patient.age}${patient.sex} · ${patient.village || '—'} · PHC ${patient.phcCode}`}
        actions={
          <>
            <button type="button" className="btn ghost" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button type="button" className="btn ghost" onClick={() => printSlip(patient)}>
              Print slip
            </button>
            <Link className="btn ghost" to={`/finder?patientId=${patient.id}`}>
              Hospitals & schemes
            </Link>
            <a className="btn sos" href="tel:108">
              SOS 108
            </a>
            <div className="chips">
              <span className={`chip ${patient.riskLevel.toLowerCase()}`}>{patient.riskLevel}</span>
              <span className="chip">{patient.stage}</span>
              <span className="chip acc">{patient.cancerType}</span>
            </div>
          </>
        }
      />

      <div className="split">
        <Section title="Clinical summary" subtitle="Screening and pathway status">
          <div className="stack">
          <p>{patient.findingNotes}</p>
          <dl className="meta">
            <div>
              <dt>Presentation</dt>
              <dd>{patient.presentation}</dd>
            </div>
            <div>
              <dt>Screened by</dt>
              <dd>
                {patient.screenedByName} ({patient.screenedByRole})
              </dd>
            </div>
            <div>
              <dt>Facility</dt>
              <dd>{patient.assignedFacCode || '—'}</dd>
            </div>
            <div>
              <dt>Visit</dt>
              <dd>
                {patient.visitAt || '—'} {patient.visitWindow || ''}
              </dd>
            </div>
            <div>
              <dt>Test result</dt>
              <dd>{patient.testResult || '—'}</dd>
            </div>
            <div>
              <dt>Treatment</dt>
              <dd>
                {patient.treatmentStarted
                  ? `Started · ${patient.treatmentPlan || '—'}`
                  : patient.treatmentPlan || '—'}
              </dd>
            </div>
            <div>
              <dt>Closed / exit</dt>
              <dd>{patient.exitReason || patient.closedReason || '—'}</dd>
            </div>
            <div>
              <dt>WHO class</dt>
              <dd>{patient.whoClass || '—'}</dd>
            </div>
            <div>
              <dt>Entry</dt>
              <dd>
                {patient.entrySource || 'FIELD'}
                {patient.moAcked ? ' · MO acked' : ''}
              </dd>
            </div>
            <div>
              <dt>ABHA</dt>
              <dd>{patient.abhaId || '—'}</dd>
            </div>
          </dl>
          {patient.eligibility?.eligible && patient.eligibility.eligible.length > 0 && (
            <>
              <h3>Eligible schemes</h3>
              <ul>
                {patient.eligibility.eligible.map((s) => (
                  <li key={s.code}>
                    <b>{s.shortName}</b> — {s.cover}
                  </li>
                ))}
              </ul>
            </>
          )}

          {patient.actions.length > 0 && (
            <>
              <h3>Available actions</h3>
              <ul>
                {patient.actions.map((a) => (
                  <li key={a.act}>
                    <b>{a.label}</b> — {a.what}
                    {a.flag ? ` · ${a.flag}` : ''}
                  </li>
                ))}
              </ul>
            </>
          )}

          <label>
            Notes
            <div className="row" style={{ marginBottom: 6 }}>
              <VoiceCapture onText={(t) => setNotes((n) => (n ? `${n} ${t}` : t))} />
            </div>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="row wrap">
            {acts.has('ack') && (
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  run(() => api.acknowledge(id, notes), {
                    label: 'Acknowledge',
                    path: `/patients/${id}/ack`,
                    body: { notes },
                  })
                }
              >
                Acknowledge hospital entry
              </button>
            )}
            {acts.has('approve') && (
              <>
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy}
                  onClick={() => run(() => api.choReview(id, 'forward', notes))}
                >
                  Forward to MO
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => run(() => api.choReview(id, 'monitor', notes))}
                >
                  Monitor
                </button>
              </>
            )}
            {acts.has('monitor') && (
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => run(() => api.monitorVisit(id, notes))}
              >
                Log monitoring visit
              </button>
            )}
            {acts.has('attend') && (
              <>
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy}
                  onClick={() => run(() => api.attendVisit(id, 'attended', notes))}
                >
                  Record attendance
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => run(() => api.attendVisit(id, 'missed', notes))}
                >
                  Mark missed
                </button>
              </>
            )}
            {acts.has('cantserve') && (
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => run(() => api.attendVisit(id, 'cant_serve', notes))}
              >
                Could not serve
              </button>
            )}
            {acts.has('report') && patient.tests[0] && (
              <>
                <button
                  type="button"
                  className="btn primary"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api.reportTest(id, {
                        testId: patient.tests[0].id,
                        resultCode: 'POSITIVE',
                        resultNotes: notes,
                      }),
                    )
                  }
                >
                  Report positive
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api.reportTest(id, {
                        testId: patient.tests[0].id,
                        resultCode: 'NEGATIVE',
                        resultNotes: notes,
                      }),
                    )
                  }
                >
                  Report negative
                </button>
              </>
            )}
            {acts.has('inconclusive') && (
              <button
                type="button"
                className="btn ghost"
                disabled={busy}
                onClick={() => run(() => api.markInconclusive(id, notes))}
              >
                Mark inconclusive
              </button>
            )}
            {acts.has('consult') && (
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    api.consult(id, {
                      outcome: 'Treatment planned',
                      treatmentPlan: txPlan,
                      notes,
                    }),
                  )
                }
              >
                Complete consultation
              </button>
            )}
            {acts.has('txstart') && (
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => run(() => api.startTreatment(id, txPlan, notes))}
              >
                Start treatment
              </button>
            )}
            {acts.has('fieldvisit') && (
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  run(() => api.fieldVisit(id, notes || 'Field contact completed'), {
                    label: 'Field visit',
                    path: `/patients/${id}/field-visit`,
                    body: { feedback: notes || 'Field contact completed' },
                  })
                }
              >
                Record field contact
              </button>
            )}
            {(acts.has('rebook') || patient.stage === 'MISSED') && (
              <button
                type="button"
                className="btn danger"
                disabled={busy}
                onClick={() => run(() => api.closeCase(id, 'Refused further care', notes))}
              >
                Close case
              </button>
            )}
          </div>

          {acts.has('txstart') || acts.has('consult') ? (
            <label>
              Treatment plan
              <select value={txPlan} onChange={(e) => setTxPlan(e.target.value)}>
                {['Surgery', 'Chemo', 'Radio', 'Palliative', 'Surveillance'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {acts.has('exit') && (
            <div className="card soft stack">
              <h3>Exit pathway</h3>
              <label>
                Reason
                <select value={exitReason} onChange={(e) => setExitReason(e.target.value)}>
                  {EXIT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn danger"
                disabled={busy}
                onClick={() => run(() => api.exitPathway(id, exitReason, notes))}
              >
                Confirm exit
              </button>
            </div>
          )}

          {(acts.has('refer') || acts.has('obook') || acts.has('rebook')) && (
            <div className="card soft stack">
              <h3>{acts.has('obook') ? 'Book oncology' : 'Approve & book'}</h3>
              <label>
                Facility
                <select
                  value={acts.has('obook') ? 'RCC' : fac}
                  disabled={acts.has('obook')}
                  onChange={(e) => setFac(e.target.value)}
                >
                  {facilities
                    .filter((f) =>
                      acts.has('obook')
                        ? f.code === 'RCC'
                        : f.services.includes(patient.cancerType),
                    )
                    .map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.shortName} · {f.hours}
                      </option>
                    ))}
                </select>
              </label>
              <div className="pool">
                {pool.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    className={date === d.date ? 'on' : ''}
                    disabled={!d.open || d.left === 0}
                    onClick={() => setDate(d.date)}
                  >
                    {d.date}
                    <small>
                      {d.open ? `${d.left}/${d.capacity} left` : 'Closed'}
                    </small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={busy || !date}
                onClick={() =>
                  run(() =>
                    acts.has('obook')
                      ? api.oncologyBook(id, {
                          facilityCode: 'RCC',
                          bookingDate: date,
                          windowLabel: '10:00–13:00',
                        })
                      : api.referBook(id, {
                          facilityCode: fac,
                          bookingDate: date,
                          windowLabel: '10:00–12:00',
                        }),
                  )
                }
              >
                Confirm booking
              </button>
            </div>
          )}
          {error && <ErrorBanner message={error} />}
          </div>
        </Section>

        <Section title="Pathway activity" subtitle="Ladder, contacts, timeline and diagnostics">
          {hasMiss && (
            <>
              <h3>Missed-visit ladder</h3>
              <div className="ladder">
                <div className={Number(miss.tried) >= 1 ? 'on' : ''}>
                  Day 0 · SMS + IVRS #1 {miss.answered ? '· answered' : ''}
                </div>
                <div className={Number(miss.tried) >= 2 ? 'on' : ''}>Day 1 · IVRS #2</div>
                <div className={Number(miss.tried) >= 3 ? 'on' : ''}>
                  Day 3 · IVRS #3 {miss.failed ? '· failed → field' : ''}
                </div>
                <div className={miss.escalated ? 'on esc' : ''}>Day 7 · Escalate to MO / block</div>
              </div>
              <p className="hint">
                Day {String(miss.day ?? 0)} · tried {String(miss.tried ?? 0)}
                {miss.fieldFeedback ? ` · field: ${String(miss.fieldFeedback)}` : ''}
              </p>
            </>
          )}
          {patient.contacts && patient.contacts.length > 0 && (
            <>
              <h3>SMS / IVRS contacts</h3>
              <div className="list">
                {patient.contacts.map((c, i) => (
                  <div key={`${c.channel}-${c.attemptNo}-${i}`} className="mini">
                    <b>
                      {c.channel} #{c.attemptNo}
                    </b>
                    <span>
                      {c.status}
                      {c.notes ? ` · ${c.notes}` : ''}
                    </span>
                    <small className="muted">{c.at}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          <h3>Timeline</h3>
          <div className="timeline">
            {patient.timeline.map((e, i) => (
              <div key={`${e.eventType}-${i}`}>
                <b>{e.eventType}</b>
                <p>{e.message}</p>
                <small className="muted">
                  {e.actorName} · {e.at}
                </small>
              </div>
            ))}
          </div>
          <h3>Bookings</h3>
          {patient.bookings.length === 0 && <p className="muted">No bookings</p>}
          {patient.bookings.map((b) => (
            <div key={b.id} className="mini">
              <b>
                {b.facilityCode} · {b.bookingDate}
              </b>
              <span>
                {b.windowLabel} · place {b.placeNo} · {b.status}
              </span>
            </div>
          ))}
          <h3>Tests</h3>
          {patient.tests.length === 0 && <p className="muted">No tests</p>}
          {patient.tests.map((t) => (
            <div key={t.id} className="mini">
              <b>{t.testName}</b>
              <span>
                {t.status} {t.resultCode ? `· ${t.resultCode}` : ''}
              </span>
            </div>
          ))}
        </Section>
      </div>
    </Page>
  )
}
