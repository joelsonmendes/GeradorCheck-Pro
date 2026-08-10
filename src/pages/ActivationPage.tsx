import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  MessageCircle,
  RefreshCw,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, StatusBadge } from "../components/ui";
import { useLicense } from "../contexts/LicenseContext";
import type { ActivationRequest } from "../types";

export function ActivationPage() {
  const { license, loading, refresh, requestActivation } = useLicense();
  const [params] = useSearchParams();
  const [request, setRequest] = useState<ActivationRequest | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const reason = params.get("motivo");
  useEffect(() => {
    if (license?.status === "pending") void makeRequest();
  }, [license?.status]); // Recupera a solicitação pendente.

  async function makeRequest() {
    setRequesting(true);
    setMessage("");
    try {
      const result = await requestActivation();
      setRequest(result);
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Não foi possível preparar a ativação.",
      );
    } finally {
      setRequesting(false);
    }
  }
  async function verify() {
    setMessage("");
    const next = await refresh();
    setMessage(
      next?.status === "active"
        ? "Licença ativada com sucesso neste aparelho."
        : "A ativação ainda não foi identificada. Tente novamente após a confirmação do vendedor.",
    );
  }
  async function copyCode() {
    if (!request) return;
    await navigator.clipboard.writeText(request.requestCode);
    setMessage("Código copiado.");
  }

  if (loading)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Validando licença…</p>
      </div>
    );
  if (license?.status === "active" && license.currentDeviceAllowed)
    return (
      <main className="activation-page">
        <div className="activation-card activation-card--success">
          <Brand />
          <CheckCircle2 size={58} />
          <StatusBadge status="active" />
          <h1>Licença ativa</h1>
          <p>
            Este aparelho está autorizado para{" "}
            <b>{license.ownerCompany || license.ownerName}</b>.
          </p>
          <div className="license-code">{license.licenseCode}</div>
          <Link className="button button--primary" to="/app">
            Abrir GeradorCheck Pro
          </Link>
        </div>
      </main>
    );

  const deviceBlocked =
    reason === "dispositivo" || license?.currentDeviceAllowed === false;
  const licenseBlocked =
    reason === "licenca" ||
    license?.status === "suspended" ||
    license?.status === "revoked";
  return (
    <main className="activation-page">
      <header>
        <Link to="/">
          <Brand />
        </Link>
        {!deviceBlocked && !licenseBlocked && (
          <Link className="auth-back" to="/app">
            <ArrowLeft size={17} /> Voltar ao painel
          </Link>
        )}
      </header>
      <div className="activation-card">
        <span className="activation-icon">
          {deviceBlocked ? (
            <Smartphone />
          ) : licenseBlocked ? (
            <ShieldAlert />
          ) : (
            <KeyRound />
          )}
        </span>
        <StatusBadge status={license?.status || "trial"} />
        <h1>
          {deviceBlocked
            ? "Limite de aparelhos atingido"
            : licenseBlocked
              ? "Licença indisponível"
              : "Ative o acesso completo"}
        </h1>
        <p>
          {deviceBlocked
            ? `Esta licença permite ${license?.maxDevices ?? 1} aparelho(s). Fale com o vendedor para liberar ou substituir um dispositivo.`
            : licenseBlocked
              ? "Entre em contato para verificar a situação da sua licença e solicitar a regularização."
              : "Seu teste de três ordens de serviço foi concluído. Solicite agora sua licença perpétua da versão adquirida."}
        </p>
        <div className="activation-summary">
          <span>
            <small>Titular</small>
            <b>
              {license?.ownerCompany ||
                license?.ownerName ||
                "Conta autenticada"}
            </b>
          </span>
          <span>
            <small>OS gratuitas utilizadas</small>
            <b>
              {license?.trialUsed ?? 0} de {license?.trialLimit ?? 3}
            </b>
          </span>
          <span>
            <small>Aparelhos permitidos</small>
            <b>{license?.maxDevices ?? 1}</b>
          </span>
        </div>
        {!request ? (
          <Button
            className="activation-main-button"
            loading={requesting}
            onClick={() => void makeRequest()}
          >
            <MessageCircle size={20} /> Solicitar ativação pelo WhatsApp
          </Button>
        ) : (
          <div className="activation-request">
            <small>Informe este código ao vendedor</small>
            <button onClick={() => void copyCode()}>
              <b>{request.requestCode}</b>
              <Copy size={18} />
            </button>
            <a
              className="button button--success button--large"
              href={request.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle /> Abrir conversa no WhatsApp{" "}
              <ExternalLink size={16} />
            </a>
          </div>
        )}
        {message && (
          <div
            className={
              message.includes("sucesso") || message.includes("copiado")
                ? "form-alert form-alert--success"
                : "form-alert"
            }
          >
            {message}
          </div>
        )}
        <Button variant="ghost" onClick={() => void verify()}>
          <RefreshCw size={17} /> Já paguei — verificar ativação
        </Button>
        <small className="activation-help">
          A ativação é vinculada à sua conta e a este aparelho. Nenhum dado das
          suas OS é enviado ao vendedor.
        </small>
      </div>
    </main>
  );
}
