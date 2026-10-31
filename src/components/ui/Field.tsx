import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type Base = {
  label: string
  hint?: string
  error?: string | null
  className?: string
  children?: ReactNode
}

export function Field({
  label,
  hint,
  error,
  className = '',
  children,
}: Base) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field-label">{label}</span>
      {children}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error" role="alert">{error}</span> : null}
    </label>
  )
}

type InputProps = Base & InputHTMLAttributes<HTMLInputElement>

export function TextInput({ label, hint, error, className, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <input aria-invalid={Boolean(error)} {...rest} />
    </Field>
  )
}

type SelectProps = Base & SelectHTMLAttributes<HTMLSelectElement>

export function TextSelect({ label, hint, error, className, children, ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <select aria-invalid={Boolean(error)} {...rest}>
        {children}
      </select>
    </Field>
  )
}

type AreaProps = Base & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextTextarea({ label, hint, error, className, ...rest }: AreaProps) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <textarea aria-invalid={Boolean(error)} {...rest} />
    </Field>
  )
}
