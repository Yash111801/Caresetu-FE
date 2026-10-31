import type { ReactNode } from 'react'

export function Section({
  title,
  subtitle,
  actions,
  children,
  soft,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  soft?: boolean
}) {
  return (
    <section className={`panel ${soft ? 'soft' : ''}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="panel-sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="row">{actions}</div> : null}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}
