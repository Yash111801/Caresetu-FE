import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import {
  evaluateSchemes,
  getPatient,
  getPool,
  listFacilities,
  saveEligibility,
} from '../api/caresetuApi'
import { ErrorBanner, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import type { Facility, PoolDay } from '../types/domain'

export function FinderPage() {
  const [params] = useSearchParams()
  const patientId = params.get('patientId')
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [type, setType] = useState('oral')
  const [selected, setSelected] = useState<Facility | null>(null)
  const [pool, setPool] = useState<PoolDay[]>([])
  const [evalResult, setEvalResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    age: '' as number | '',
    incomeBand: '',
    rationCard: '',
    hasPmjayCard: false,
    esic: false,
    govtEmployee: false,
    privateInsurance: false,
  })

  useEffect(() => {
    listFacilities().then(setFacilities).catch((e) => setError(getErrorMessage(e)))
    if (patientId) {
      getPatient(patientId)
        .then((p) => {
          setType(p.cancerType)
          setForm((f) => ({
            ...f,
            age: p.age,
            incomeBand: p.incomeBand || '',
            rationCard: p.rationCard || '',
            hasPmjayCard: Boolean(p.hasPmjayCard),
            esic: Boolean(p.esic),
            govtEmployee: Boolean(p.govtEmployee),
            privateInsurance: Boolean(p.privateInsurance),
          }))
        })
        .catch(() => undefined)
    }
  }, [patientId])

  const filtered = facilities.filter(
    (f) => f.services.includes(type) || f.services.includes('oncology'),
  )

  async function open(f: Facility) {
    setSelected(f)
    setPool(await getPool(f.code, 7))
  }

  async function runEval() {
    setError(null)
    if (form.age === '' || !Number.isFinite(form.age) || form.age < 1) {
      setError('Enter age before checking schemes')
      return
    }
    try {
      const res = await evaluateSchemes({ ...form, age: Number(form.age), cancerType: type })
      setEvalResult(res)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  async function persist() {
    if (!patientId) return
    if (form.age === '' || !Number.isFinite(form.age)) {
      setError('Enter age before saving eligibility')
      return
    }
    await saveEligibility(patientId, { ...form, age: Number(form.age) })
    await runEval()
  }

  const eligible = (evalResult?.eligible as Record<string, string>[]) || []
  const possible = (evalResult?.possible as Record<string, string>[]) || []
  const helplines = (evalResult?.helplines as { name: string; number: string }[]) || []

  return (
    <Page>
      <PageHeader
        eyebrow="Care pathway · Finder"
        title="Hospitals & schemes"
        subtitle={
          patientId
            ? 'Eligibility and centres for the selected patient'
            : 'Find the right hospital and free-treatment scheme'
        }
        actions={
          <>
            {helplines.map((h) => (
              <a key={h.number} className="btn ghost sm" href={`tel:${h.number}`}>
                {h.name} {h.number}
              </a>
            ))}
            <select className="lang-select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="oral">Oral</option>
              <option value="breast">Breast</option>
              <option value="cervical">Cervical</option>
            </select>
          </>
        }
      />
      {error && <ErrorBanner message={error} />}
      <div className="split">
        <div className="stack">
          <Section title="1 · Patient & income" subtitle="Scheme eligibility inputs">
            <div className="stack">
            <div className="g2">
              <label className="f">
                Age
                <input
                  type="number"
                  min={1}
                  max={120}
                  placeholder="Years"
                  value={form.age}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      age: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="f">
                Family income / year
                <select value={form.incomeBand}
                  onChange={(e) => setForm({ ...form, incomeBand: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="low">Below ₹2.5 lakh</option>
                  <option value="mid">₹2.5–5 lakh</option>
                  <option value="high">Above ₹5 lakh</option>
                </select>
              </label>
              <label className="f">
                Ration card
                <select value={form.rationCard}
                  onChange={(e) => setForm({ ...form, rationCard: e.target.value })}>
                  <option value="">Select…</option>
                  <option value="bpl">BPL / Antyodaya</option>
                  <option value="apl">APL</option>
                  <option value="none">None</option>
                </select>
              </label>
            </div>
            <div className="role-chips">
              {([
                ['hasPmjayCard', 'Ayushman / PMJAY-MA card'],
                ['esic', 'ESIC worker'],
                ['govtEmployee', 'Govt employee'],
                ['privateInsurance', 'Private insurance'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={form[key] ? 'on' : ''}
                  onClick={() => setForm({ ...form, [key]: !form[key] })}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn primary" onClick={() => void runEval()}>
                Check schemes
              </button>
              {patientId && (
                <button type="button" className="btn ghost" onClick={() => void persist()}>
                  Save to patient
                </button>
              )}
            </div>
            </div>
          </Section>
          <Section title="2 · Schemes" subtitle="What this patient can use">
            {!evalResult && <p className="muted">Fill answers and tap Check schemes</p>}
            {eligible.map((s) => (
              <div key={s.code} className="mini">
                <b>{s.shortName}</b>
                <div className="muted small">{s.cover}</div>
                <div className="small">{s.how}</div>
              </div>
            ))}
            {possible.length > 0 && (
              <>
                <h3>Also possible (confirm at hospital)</h3>
                {possible.slice(0, 4).map((s) => (
                  <div key={s.code} className="mini">
                    <b>{s.shortName}</b>
                    <div className="muted small">{s.cover}</div>
                  </div>
                ))}
              </>
            )}
          </Section>
        </div>
        <div className="stack">
          <Section title="Facilities" subtitle="Green-channel capable centres">
            <div className="list">
            {filtered.map((f) => (
              <button key={f.code} type="button" className="patient-card" onClick={() => void open(f)}>
                <div className="between">
                  <div>
                    <div className="pc-name">{f.shortName}</div>
                    <div className="muted small">{f.facilityType} · {f.hours}</div>
                    <div className="muted small">{f.addressHint}</div>
                  </div>
                  <span className="chip acc">{f.dailyPoolCap}/day</span>
                </div>
              </button>
            ))}
            </div>
          </Section>
          <Section title={selected ? selected.name : 'Pool calendar'} subtitle={selected?.hours || 'Select a facility'}>
            {!selected && <p className="muted">Select a facility to see live green-channel places</p>}
            {selected && (
              <div className="pool big">
                  {pool.map((d) => (
                    <div key={d.date} className={!d.open || d.left === 0 ? 'full' : ''}>
                      <span className="muted small">{d.date}</span>
                      <b>{d.used}/{d.capacity}</b>
                      <span>{d.open ? `${d.left} left` : 'Closed'}</span>
                    </div>
                  ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </Page>
  )
}
