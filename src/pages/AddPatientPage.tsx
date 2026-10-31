import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { addHospitalPatient, listPhcs } from '../api/caresetuApi'
import { getErrorMessage } from '../api/client'
import { Button } from '../components/ui/Button'
import { ErrorBanner, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import type { Phc } from '../types/domain'

export function AddPatientPage() {
  const navigate = useNavigate()
  const [phcs, setPhcs] = useState<Phc[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    age: '' as number | '',
    sex: '',
    mobile: '',
    abhaId: '',
    village: '',
    phcCode: '',
    cancerType: 'oral',
    presentation: 'symptomatic',
    findingNotes: '',
    smsLang: 'gu',
    gpsConsent: false,
    dataConsent: true,
  })

  useEffect(() => {
    listPhcs().then(setPhcs).catch(() => undefined)
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const p = await addHospitalPatient({
        ...form,
        age: Number(form.age),
      })
      navigate(`/patients/${p.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Field work · Hospital entry"
        title="Add patient"
        subtitle="Direct registration from hospital OPD · skips ASHA / CHO review"
      />

      <form className="form-shell" onSubmit={onSubmit}>
        <Section title="1 · Identity" subtitle="OPD registration details">
          <div className="form-grid">
            <label className="field span-2">
              Full name *
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="field">
              Age *
              <input
                type="number"
                min={1}
                max={120}
                required
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
            <label className="field">
              Sex *
              <select required value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                <option value="">Select</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="O">Other</option>
              </select>
            </label>
            <label className="field">
              Mobile
              <input
                inputMode="tel"
                maxLength={10}
                value={form.mobile}
                onChange={(e) =>
                  setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
              />
            </label>
            <label className="field">
              ABHA ID
              <input
                value={form.abhaId}
                onChange={(e) => setForm({ ...form, abhaId: e.target.value })}
                placeholder="91-1234-5678-9012"
              />
            </label>
            <label className="field">
              Village *
              <input
                required
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
              />
            </label>
            <label className="field">
              Residential PHC *
              <select
                required
                value={form.phcCode}
                onChange={(e) => setForm({ ...form, phcCode: e.target.value })}
              >
                <option value="">Select PHC</option>
                {phcs.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              SMS language *
              <select
                value={form.smsLang}
                onChange={(e) => setForm({ ...form, smsLang: e.target.value })}
              >
                <option value="gu">ગુજરાતી</option>
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </Section>

        <Section title="2 · Clinical" subtitle="Suspected cancer and OPD notes">
          <div className="form-grid">
            <div className="field span-2">
              <span>Cancer type *</span>
              <div className="seg">
                {(
                  [
                    ['oral', 'Oral'],
                    ['breast', 'Breast'],
                    ['cervical', 'Cervical'],
                  ] as const
                ).map(([code, label]) => (
                  <button
                    key={code}
                    type="button"
                    className={form.cancerType === code ? 'on' : ''}
                    onClick={() => setForm({ ...form, cancerType: code })}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field span-2">
              <span>Presentation *</span>
              <div className="seg" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button
                  type="button"
                  className={form.presentation === 'symptomatic' ? 'on' : ''}
                  onClick={() => setForm({ ...form, presentation: 'symptomatic' })}
                >
                  Symptomatic
                </button>
                <button
                  type="button"
                  className={form.presentation === 'asymptomatic' ? 'on' : ''}
                  onClick={() => setForm({ ...form, presentation: 'asymptomatic' })}
                >
                  Asymptomatic
                </button>
              </div>
            </div>
            <label className="field span-2">
              Clinical notes *
              <textarea
                required
                rows={4}
                value={form.findingNotes}
                onChange={(e) => setForm({ ...form, findingNotes: e.target.value })}
              />
            </label>
          </div>
        </Section>

        <Section title="3 · Consent" subtitle="DPDP and location preferences">
          <div className="stack">
            <label className="check">
              <input
                type="checkbox"
                checked={form.dataConsent}
                onChange={(e) => setForm({ ...form, dataConsent: e.target.checked })}
              />
              <span>Patient consents to data processing (DPDP)</span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.gpsConsent}
                onChange={(e) => setForm({ ...form, gpsConsent: e.target.checked })}
              />
              <span>GPS consent for map / SOS</span>
            </label>
          </div>
        </Section>

        {error && <ErrorBanner message={error} />}

        <div className="form-actions">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} disabled={!form.dataConsent}>
            Register patient
          </Button>
        </div>
      </form>
    </Page>
  )
}
