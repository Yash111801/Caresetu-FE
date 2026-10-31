import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/authStore'

const ROLES = [
  { code: 'ADMIN', title: 'Super Admin', mobile: '9999999999' },
  { code: 'ASHA', title: 'ASHA worker', mobile: '9876543210' },
  { code: 'CHO', title: 'Community Health Officer', mobile: '9876543211' },
  { code: 'MO', title: 'PHC medical officer', mobile: '9876543212' },
  { code: 'HOSP', title: 'Hospital doctor', mobile: '9876543213' },
  { code: 'PATH', title: 'Diagnostic', mobile: '9876543214' },
  { code: 'ONCO', title: 'Cancer specialist', mobile: '9876543215' },
  { code: 'BLK', title: 'Taluka Health Officer', mobile: '9876543216' },
  { code: 'DIST', title: 'District Programme Officer', mobile: '9876543217' },
  { code: 'SNO', title: 'State Nodal Officer', mobile: '9876543218' },
  { code: 'NAT', title: 'National Officer', mobile: '9876543219' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading, sendOtp, verifyOtp } = useAuthStore()
  const [role, setRole] = useState(ROLES[0])
  const [mobile, setMobile] = useState(ROLES[0].mobile)
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<0 | 1>(0)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  function pickRole(next: (typeof ROLES)[number]) {
    setRole(next)
    setMobile(next.mobile)
    setStep(0)
    setOtp('')
    setError(null)
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await sendOtp(mobile)
      setStep(1)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await verifyOtp(mobile, otp)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="login2">
      <section className="lbrand">
        <div className="lplate">
          <img src="/assets/logo-full.png" alt="CARESETU · Together against cancer" />
        </div>
        <div className="lfull">Cancer Referral and Service Tracking Utility</div>
        <h2>Every suspected cancer, tracked from screening to treatment.</h2>
        <p>
          One shared record that connects community screening, PHC referral, hospital diagnosis and
          the Cancer Centre, so every patient reaches the right place on time.
        </p>
        <div className="lorg">NP-NCD · Health &amp; Family Welfare Department, Gujarat</div>
      </section>

      <section className="lform">
        <div className="lbox">
          <div className="ltop">
            <span className="hint">EN · ગુજ · हिं</span>
            <span className="chip acc">v2.3</span>
          </div>
          <div className="lmini">
            <img src="/assets/logo-full.png" alt="CARESETU" />
          </div>
          <p className="lform-kicker">Cancer Referral and Service Tracking Utility</p>
          <h1>{step === 0 ? 'Sign in' : 'Enter OTP'}</h1>
          <p className="sub">
            {step === 0
              ? 'Use the mobile number registered with your facility'
              : 'Verify the code sent to your registered mobile'}
          </p>

          {step === 0 ? (
            <form className="login-form" onSubmit={onSend}>
              <label className="field">
                Role
                <select
                  value={role.code}
                  onChange={(e) => {
                    const next = ROLES.find((r) => r.code === e.target.value)
                    if (next) pickRole(next)
                  }}
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="role-chips">
                {ROLES.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    className={role.code === r.code ? 'on' : ''}
                    onClick={() => pickRole(r)}
                  >
                    {r.code}
                  </button>
                ))}
              </div>
              <label className="field">
                Mobile number
                <input
                  inputMode="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  pattern="[6-9][0-9]{9}"
                />
              </label>
              {error && <p className="error">{error}</p>}
              <button className="btn primary big" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={onVerify}>
              <p className="otp-sent">
                Sent to <b>{mobile}</b>
                <span className="otp-role">{role.title}</span>
              </p>
              <label className="field">
                Enter 6-digit OTP
                <input
                  className="otpin"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                  pattern="[0-9]{6}"
                />
              </label>
              <p className="hint">
                Demo OTP: <b>123456</b>
              </p>
              {error && <p className="error">{error}</p>}
              <div className="formnav">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setStep(0)
                    setOtp('')
                    setError(null)
                  }}
                >
                  Back
                </button>
                <button
                  className="btn primary"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>
          )}
          <p className="login-foot">Helpdesk 104 · CARESETU production build</p>
        </div>
      </section>
    </div>
  )
}
