import { Link } from 'react-router-dom'
import { stageTone } from '../lib/labels'
import type { PatientSummary } from '../types/domain'

export function PatientCard({ patient }: { patient: PatientSummary }) {
  return (
    <Link to={`/patients/${patient.id}`} className="patient-card">
      <div className="pc-top">
        <div className="pc-avatar" aria-hidden>
          {patient.fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((p) => p[0])
            .join('')
            .toUpperCase()}
        </div>
        <div className="pc-main">
          <div className="pc-name">{patient.fullName}</div>
          <div className="muted small">
            {patient.uhid} · {patient.age}
            {patient.sex} · {patient.village || patient.phcCode}
          </div>
        </div>
        <div className="chips">
          <span className={`chip ${patient.riskLevel.toLowerCase()}`}>{patient.riskLevel}</span>
          <span className={`chip ${stageTone(patient.stage)}`}>{patient.stage}</span>
          <span className="chip acc">{patient.cancerType}</span>
        </div>
      </div>
      {patient.actions?.length > 0 && (
        <div className="actions-preview">
          <span className="actions-label">Next</span>
          {patient.actions.map((a) => (
            <span key={a.act} className="chip warn">
              {a.label}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
