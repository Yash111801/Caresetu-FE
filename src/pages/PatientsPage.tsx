import { useMemo, useState } from 'react'
import { listPatients } from '../api/caresetuApi'
import { PatientCard } from '../components/PatientCard'
import { Button } from '../components/ui/Button'
import { EmptyState, ErrorBanner, LoadingState, Page, PageHeader } from '../components/ui/Page'
import { Section } from '../components/ui/Section'
import { useAsync } from '../hooks/useAsync'
import { downloadCsv } from '../lib/exportCsv'

const STAGES = [
  '',
  'MONITOR',
  'CHO',
  'REVIEW',
  'BOOKED',
  'MISSED',
  'TESTED',
  'ONCO_REQ',
  'SPECIALIST',
  'CLOSED',
]

export function PatientsPage() {
  const [stage, setStage] = useState('')
  const [q, setQ] = useState('')
  const [draftQ, setDraftQ] = useState('')

  const params = useMemo(
    () => ({ stage: stage || undefined, q: q || undefined }),
    [stage, q],
  )
  const { data, error, loading, reload } = useAsync(
    () => listPatients(params),
    [params.stage, params.q],
  )
  const items = data ?? []

  return (
    <Page>
      <PageHeader
        eyebrow="Field work · Registry"
        title="Patients"
        subtitle={`${items.length} in your scope`}
        actions={
          <Button
            variant="ghost"
            disabled={items.length === 0}
            onClick={() =>
              downloadCsv(
                'caresetu-patients.csv',
                items.map((p) => ({
                  id: p.id,
                  uhid: p.uhid,
                  name: p.fullName,
                  age: p.age,
                  sex: p.sex,
                  village: p.village,
                  phc: p.phcCode,
                  type: p.cancerType,
                  stage: p.stage,
                  risk: p.riskLevel,
                  facility: p.assignedFacCode,
                  visit: p.visitAt,
                })),
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <Section title="Find patients" subtitle="Filter by name, UHID, mobile or pathway stage">
        <div className="filters">
          <input
            placeholder="Search name, UHID, mobile"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQ(draftQ.trim())
            }}
          />
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {STAGES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'All stages'}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={() => setQ(draftQ.trim())}>
            Search
          </Button>
        </div>
      </Section>

      {loading && <LoadingState label="Loading patients…" />}
      {error && (
        <>
          <ErrorBanner message={error} />
          <Button variant="ghost" onClick={reload}>
            Retry
          </Button>
        </>
      )}
      {!loading && !error && (
        <Section title="Results" subtitle={`${items.length} match${items.length === 1 ? '' : 'es'}`}>
          <div className="list">
            {items.length === 0 ? (
              <EmptyState
                title="No patients match"
                description="Try another stage or clear the search."
              />
            ) : (
              items.map((p) => <PatientCard key={p.id} patient={p} />)
            )}
          </div>
        </Section>
      )}
    </Page>
  )
}
