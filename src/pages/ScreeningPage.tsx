import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createScreening, listPhcs } from '../api/caresetuApi'
import { VoiceCapture } from '../components/VoiceCapture'
import { Button } from '../components/ui/Button'
import { TextInput, TextSelect, TextTextarea } from '../components/ui/Field'
import { ErrorBanner, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { getErrorMessage } from '../lib/errors'
import {
  firstError,
  hasErrors,
  optionalMobile,
  requireAge,
  requireText,
  type FieldErrors,
} from '../lib/validation'
import type { Phc } from '../types/domain'
import { useAuthStore } from '../store/authStore'

export function ScreeningPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [phcs, setPhcs] = useState<Phc[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    age: '' as number | '',
    sex: '',
    mobile: '',
    village: '',
    phcCode: user?.phcCode || '',
    cancerType: 'oral',
    presentation: 'symptomatic',
    findingNotes: '',
    counselled: false,
  })

  useEffect(() => {
    listPhcs()
      .then((list) => {
        setPhcs(list)
        if (!form.phcCode && user?.phcCode && list.some((p) => p.code === user.phcCode)) {
          setForm((f) => ({ ...f, phcCode: user.phcCode || '' }))
        }
      })
      .catch(() => undefined)
    // Only on mount / user PHC available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phcCode])

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const nameErr = requireText(form.fullName, 'Full name')
    if (nameErr) next.fullName = nameErr
    const ageErr = requireAge(form.age)
    if (ageErr) next.age = ageErr
    if (!form.sex) next.sex = 'Select sex'
    const mobileErr = optionalMobile(form.mobile)
    if (mobileErr) next.mobile = mobileErr
    const villageErr = requireText(form.village, 'Village')
    if (villageErr) next.village = villageErr
    if (!form.phcCode) next.phcCode = 'Select PHC'
    const notesErr = requireText(form.findingNotes, 'Findings', 8)
    if (notesErr) next.findingNotes = notesErr
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next = validate()
    setFieldErrors(next)
    if (hasErrors(next)) {
      setError(firstError(next))
      return
    }
    setSaving(true)
    setError(null)
    try {
      const patient = await createScreening({
        ...form,
        age: Number(form.age),
        mobile: form.mobile || '',
      })
      navigate(`/patients/${patient.id}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Field work · Screening"
        title="New screening"
        subtitle="Capture NCD cancer screening in the field or at PHC"
        actions={
          <Link className="btn ghost" to="/patients">
            View patients
          </Link>
        }
      />

      <form className="form-shell" onSubmit={onSubmit} noValidate>
        <Section title="1 · Person" subtitle="Identity and contact for this visit">
          <div className="form-grid">
            <TextInput
              className="span-2"
              label="Full name"
              required
              placeholder="As on Aadhaar / ABHA"
              value={form.fullName}
              error={fieldErrors.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <TextInput
              label="Age"
              type="number"
              min={1}
              max={120}
              required
              placeholder="Years"
              value={form.age}
              error={fieldErrors.age}
              onChange={(e) =>
                setForm({
                  ...form,
                  age: e.target.value === '' ? '' : Number(e.target.value),
                })
              }
            />
            <TextSelect
              label="Sex"
              required
              value={form.sex}
              error={fieldErrors.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option value="">Select</option>
              <option value="F">Female</option>
              <option value="M">Male</option>
              <option value="O">Other</option>
            </TextSelect>
            <TextInput
              label="Mobile"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit mobile"
              value={form.mobile}
              error={fieldErrors.mobile}
              hint="Leave blank if no phone — field contact will be needed"
              onChange={(e) =>
                setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })
              }
            />
            <TextInput
              label="Village"
              required
              value={form.village}
              error={fieldErrors.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
            <TextSelect
              className="span-2"
              label="PHC"
              required
              value={form.phcCode}
              error={fieldErrors.phcCode}
              onChange={(e) => setForm({ ...form, phcCode: e.target.value })}
            >
              <option value="">Select PHC</option>
              {phcs.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} · {p.taluka || p.district}
                </option>
              ))}
            </TextSelect>
          </div>
        </Section>

        <Section title="2 · Clinical finding" subtitle="Cancer type, presentation and notes">
          <div className="form-grid">
            <div className="field span-2">
              <span className="field-label">Cancer type</span>
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
              <span className="field-label">Presentation</span>
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
            <div className="span-2">
              <div className="row" style={{ marginBottom: 6 }}>
                <VoiceCapture
                  onText={(text) =>
                    setForm((f) => ({
                      ...f,
                      findingNotes: f.findingNotes ? `${f.findingNotes} ${text}` : text,
                    }))
                  }
                />
              </div>
              <TextTextarea
                label="Findings"
                required
                rows={4}
                placeholder="Site, size, duration, red flags…"
                value={form.findingNotes}
                error={fieldErrors.findingNotes}
                onChange={(e) => setForm({ ...form, findingNotes: e.target.value })}
              />
            </div>
            <label className="check span-2">
              <input
                type="checkbox"
                checked={form.counselled}
                onChange={(e) => setForm({ ...form, counselled: e.target.checked })}
              />
              <span>Counselled during this visit (risks, next steps, helpline 104)</span>
            </label>
          </div>
        </Section>

        {error && <ErrorBanner message={error} />}

        <div className="form-actions">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save screening
          </Button>
        </div>
      </form>
    </Page>
  )
}
