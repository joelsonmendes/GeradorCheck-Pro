import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { LoaderCircle } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  loading?: boolean;
}) {
  return (
    <button
      className={`button button--${variant} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle className="spin" size={18} />}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {props.required && <b> *</b>}
      </span>
      <input
        className={
          error ? "field__control field__control--error" : "field__control"
        }
        {...props}
      />
      {error ? (
        <small className="field__error">{error}</small>
      ) : (
        hint && <small className="field__hint">{hint}</small>
      )}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {props.required && <b> *</b>}
      </span>
      <textarea className="field__control field__textarea" {...props} />
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {props.required && <b> *</b>}
      </span>
      <select className="field__control field__select" {...props}>
        {children}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}) {
  return (
    <label className="toggle-row">
      <span>
        <b>{label}</b>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    trial: "Teste",
    pending: "Aguardando ativação",
    active: "Licença ativa",
    suspended: "Suspensa",
    revoked: "Cancelada",
    draft: "Rascunho",
    completed: "Concluída",
    approved: "Aprovado",
    attention: "Atenção",
    "not-tested": "Não testado",
  };
  return (
    <span className={`status status--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
