import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, Field } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link to="/">
          <Brand />
        </Link>
        <div>
          <span className="eyebrow">
            <ShieldCheck size={16} /> Acesso protegido
          </span>
          <h1>Sua oficina mais organizada. Seu serviço mais valorizado.</h1>
          <ul>
            <li>
              <CheckCircle2 /> Três OS completas para testar
            </li>
            <li>
              <CheckCircle2 /> Dados técnicos salvos no aparelho
            </li>
            <li>
              <CheckCircle2 /> PDF pronto para compartilhar
            </li>
          </ul>
        </div>
        <small>GeradorCheck Pro • Software profissional para manutenção</small>
      </section>
      <section className="auth-panel">
        <Link className="auth-back" to="/">
          <ArrowLeft size={17} /> Voltar ao início
        </Link>
        <div className="auth-card">
          <Brand compact />
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/app" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      const target =
        (location.state as { from?: string } | null)?.from || "/app";
      navigate(target, { replace: true });
    } catch {
      setError(
        "E-mail ou senha inválidos. Confira os dados e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthFrame
      title="Bem-vindo de volta"
      subtitle="Entre para acessar suas ordens de serviço."
    >
      <form className="auth-form" onSubmit={submit}>
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="form-alert form-alert--danger">{error}</div>}
        <Link className="auth-link" to="/recuperar-senha">
          Esqueci minha senha
        </Link>
        <Button type="submit" loading={loading}>
          Entrar com segurança
        </Button>
      </form>
      <div className="auth-switch">
        Ainda não possui acesso? <Link to="/criar-conta">Teste grátis</Link>
      </div>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    password: "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to="/app" replace />;
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/app", { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthFrame
      title="Comece com 3 OS grátis"
      subtitle="Crie sua conta e registre este aparelho para avaliação."
    >
      <form className="auth-form" onSubmit={submit}>
        <Field
          label="Seu nome"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Field
          label="Empresa ou nome profissional"
          required
          value={form.company}
          onChange={(e) => set("company", e.target.value)}
        />
        <Field
          label="WhatsApp"
          type="tel"
          required
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <Field
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Field
          label="Senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Use pelo menos 8 caracteres."
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <label className="consent">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set("consent", e.target.checked)}
          />
          <span>
            Li e aceito os{" "}
            <Link to="/termos" target="_blank">
              termos de uso
            </Link>{" "}
            e autorizo o registro deste aparelho para controle da licença.
          </span>
        </label>
        {error && <div className="form-alert form-alert--danger">{error}</div>}
        <Button type="submit" loading={loading} disabled={!form.consent}>
          Criar conta e testar
        </Button>
      </form>
      <div className="auth-switch">
        Já possui uma conta? <Link to="/entrar">Entrar</Link>
      </div>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError(
        "Não foi possível enviar o e-mail. Confira o endereço informado.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthFrame
      title="Recuperar acesso"
      subtitle="Enviaremos um link para você cadastrar uma nova senha."
    >
      {sent ? (
        <div className="success-message">
          <Mail size={34} />
          <h3>Confira seu e-mail</h3>
          <p>
            Se houver uma conta para <b>{email}</b>, o link de recuperação
            chegará em instantes.
          </p>
          <Link className="button button--secondary" to="/entrar">
            Voltar para entrar
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <Field
            label="E-mail da conta"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <div className="form-alert form-alert--danger">{error}</div>
          )}
          <Button type="submit" loading={loading}>
            <KeyRound size={18} /> Enviar link de recuperação
          </Button>
        </form>
      )}
    </AuthFrame>
  );
}
