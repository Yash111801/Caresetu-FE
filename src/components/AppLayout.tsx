import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { getAlerts } from '../api/caresetuApi'
import { useI18n } from '../store/i18nStore'
import { useAuthStore } from '../store/authStore'
import { usePrefs } from '../store/prefsStore'

type NavItem = { to: string; label: string; end?: boolean; badge?: number }
type NavGroup = { id: string; title: string; icon: string; items: NavItem[] }

function initials(name?: string) {
  if (!name) return 'CS'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'clipboard':
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4V3h6v1M8 10h8M8 14h8M8 18h5" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16M8 16V9M13 16v-5M18 16V7" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'map':
      return (
        <svg {...common}>
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 7 9-7" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common}>
          <path d="M8 4h8v4H8zM6 8h12v12H6z" />
          <path d="M9 13h6M9 16h4" />
        </svg>
      )
    case 'gear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10c.3.6.9 1 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
        </svg>
      )
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1.5 1-1.5 1.7V14M12 17h.01" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 8h.01" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      )
    case 'field':
      return (
        <svg {...common}>
          <path d="M4 20h16M6 20V9l6-5 6 5v11" />
          <path d="M10 20v-6h4v6" />
        </svg>
      )
    case 'pathway':
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.5" />
          <circle cx="12" cy="6" r="2.5" />
          <circle cx="19" cy="12" r="2.5" />
          <path d="M7.2 11.2 9.8 7.8M14.2 7.8l2.6 3.4" />
        </svg>
      )
    case 'programme':
      return (
        <svg {...common}>
          <path d="M4 19V5h6v14H4ZM14 19V11h6v8h-6Z" />
        </svg>
      )
    case 'account':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

export function AppLayout() {
  const { user, logout, hasPermission, hasRole } = useAuthStore()
  const { t, lang, setLang } = useI18n()
  const { offline, queued, applyDom } = usePrefs()
  const [alertCount, setAlertCount] = useState(0)
  const location = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>({
    field: true,
    pathway: true,
    programme: true,
    account: true,
  })

  useEffect(() => {
    applyDom()
  }, [applyDom])

  useEffect(() => {
    if (!hasPermission('ALERT_READ')) return
    getAlerts()
      .then((items) => setAlertCount(items.filter((a) => !a.read).length))
      .catch(() => undefined)
  }, [hasPermission])

  const canAppt =
    hasPermission('APPOINTMENT_READ') ||
    hasRole('HOSP') ||
    hasRole('ONCO') ||
    hasRole('MO') ||
    hasRole('PATH')
  const canAdd = hasRole('HOSP') || hasRole('ONCO') || hasRole('MO')
  const canAudit =
    hasPermission('AUDIT_READ') ||
    hasRole('DIST') ||
    hasRole('SNO') ||
    hasRole('NAT') ||
    hasRole('BLK') ||
    hasRole('ADMIN')

  const groups: NavGroup[] = useMemo(() => {
    const fieldItems: NavItem[] = [
      { to: '/', label: t('home'), end: true },
      ...(hasPermission('PATIENT_READ') ? [{ to: '/patients', label: t('patients') }] : []),
      ...(hasPermission('SCREENING_WRITE') ? [{ to: '/screening', label: t('screening') }] : []),
      ...(canAdd ? [{ to: '/add-patient', label: t('addPatient') }] : []),
    ]
    const pathwayItems: NavItem[] = [
      ...(canAppt ? [{ to: '/appointments', label: t('appointments') }] : []),
      { to: '/finder', label: t('finder') },
    ]
    const programmeItems: NavItem[] = [
      { to: '/dashboard', label: t('dashboard') },
      { to: '/intervals', label: t('intervals') },
      ...(canAudit ? [{ to: '/audit', label: t('audit') }] : []),
      ...(hasPermission('MAP_READ') ? [{ to: '/map', label: t('map') }] : []),
      ...(hasPermission('ALERT_READ')
        ? [{ to: '/alerts', label: t('alerts'), badge: alertCount }]
        : []),
      { to: '/messages', label: t('messages') },
    ]
    const accountItems: NavItem[] = [
      { to: '/settings', label: t('settings') },
      { to: '/help', label: t('help') },
      { to: '/about', label: t('about') },
    ]
    return [
      { id: 'field', title: 'Field work', icon: 'field', items: fieldItems },
      { id: 'pathway', title: 'Care pathway', icon: 'pathway', items: pathwayItems },
      { id: 'programme', title: 'Programme', icon: 'programme', items: programmeItems },
      { id: 'account', title: 'Account', icon: 'account', items: accountItems },
    ].filter((g) => g.items.length > 0)
  }, [t, hasPermission, canAdd, canAppt, canAudit, alertCount])

  useEffect(() => {
    const path = location.pathname
    setOpen((prev) => {
      const next = { ...prev }
      for (const g of groups) {
        if (g.items.some((i) => (i.end ? path === i.to : path === i.to || path.startsWith(`${i.to}/`)))) {
          next[g.id] = true
        }
      }
      return next
    })
  }, [location.pathname, groups])

  const iconFor = (to: string) => {
    if (to === '/') return 'home'
    if (to.startsWith('/patients')) return 'users'
    if (to === '/screening') return 'clipboard'
    if (to === '/add-patient') return 'plus'
    if (to === '/appointments') return 'calendar'
    if (to === '/dashboard') return 'chart'
    if (to === '/intervals') return 'clock'
    if (to === '/map') return 'map'
    if (to === '/alerts') return 'bell'
    if (to === '/messages') return 'mail'
    if (to === '/finder') return 'search'
    if (to === '/audit') return 'audit'
    if (to === '/settings') return 'gear'
    if (to === '/help') return 'help'
    if (to === '/about') return 'info'
    return 'home'
  }

  const bottom = groups
    .flatMap((g) => g.items)
    .filter((i) => ['/', '/patients', '/screening', '/dashboard', '/alerts'].includes(i.to))
    .slice(0, 5)

  return (
    <>
      <div className="demo-banner">Demo environment · synthetic patients · OTP 123456</div>
      <header className="app-header">
        <div className="brand">
          <img
            className="brand-mark"
            src="/assets/logo-full.png"
            alt="CARESETU"
            width={48}
            height={48}
          />
          <div className="brand-title">
            <small>Together against cancer</small>
          </div>
          <span className="sep" aria-hidden="true" />
          <div className="org">
            <span className="org-prog">NP-NCD</span>
            <b>Gandhinagar district</b>
            <span>Health &amp; Family Welfare Dept., Gujarat</span>
          </div>
        </div>
        <div className="header-tools">
          <select
            aria-label="Language"
            className="header-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'en' | 'gu' | 'hi')}
          >
            <option value="en">EN</option>
            <option value="gu">ગુજ</option>
            <option value="hi">हिं</option>
          </select>
          {(offline || queued > 0) && (
            <Link to="/settings" className="chip offline-chip" title="Offline queue">
              {t('offline')} · {queued}
            </Link>
          )}
          <a className="btn sos sm" href="tel:108" title={t('sos')}>
            {t('sos')}
          </a>
          <Link to="/alerts" className="hbtn" aria-label="Alerts">
            <Icon name="bell" />
            {alertCount > 0 && <span className="dotn">{alertCount}</span>}
          </Link>
          <Link to="/settings" className="rolebtn" title={t('settings')}>
            <span className="avatar">{initials(user?.fullName)}</span>
            <span className="t">
              <b>{user?.fullName}</b>
              <span>{user?.roles?.join(', ')}</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="wrap">
        <nav className="side" aria-label="Main">
          <div className="side-brand">
            <span className="side-role">{user?.roles?.[0] || 'User'}</span>
            <small>{user?.phcCode ? `PHC ${user.phcCode}` : user?.facilityCode || 'Gujarat'}</small>
          </div>

          <div className="side-scroll">
            {groups.map((group) => {
              const isOpen = open[group.id] !== false
              return (
                <div key={group.id} className={`nav-group ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="nav-group-btn"
                    onClick={() => setOpen((s) => ({ ...s, [group.id]: !isOpen }))}
                    aria-expanded={isOpen}
                  >
                    <span className="nav-ico">
                      <Icon name={group.icon} />
                    </span>
                    <span className="nav-group-title">{group.title}</span>
                    <span className="nav-chevron" aria-hidden>
                      {isOpen ? '▾' : '▸'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="nav-sub">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) => (isActive ? 'active' : undefined)}
                        >
                          <span className="nav-ico">
                            <Icon name={iconFor(item.to)} />
                          </span>
                          <span className="nav-label">{item.label}</span>
                          {item.badge && item.badge > 0 ? (
                            <span className="nav-badge">{item.badge}</span>
                          ) : null}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <button
            type="button"
            className="nav-logout"
            onClick={() => void logout()}
          >
            <span className="nav-ico">
              <Icon name="logout" />
            </span>
            {t('logout')}
          </button>
        </nav>
        <div className="content-pane">
          <main className="content-main">
            <Outlet />
          </main>
          <footer className="app-footer">
            <span>CARESETU</span>
            <span>NP-NCD Gujarat</span>
            <a href="tel:104">Helpdesk 104</a>
            <a href="tel:108">Ambulance 108</a>
            <a href="tel:14555">PM-JAY 14555</a>
          </footer>
        </div>
      </div>

      <nav className="bottom" aria-label="Main">
        {bottom.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            <Icon name={iconFor(item.to)} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
