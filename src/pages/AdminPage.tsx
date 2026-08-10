import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";
import { Button, StatusBadge } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { apiGet, apiPost } from "../lib/api";
import { formatDateTime } from "../lib/format";
import type { AdminLicenseRow } from "../types";

interface AdminRequestRow {
  id: string;
  uid: string;
  requestCode: string;
  status: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: string;
}

export function AdminPage() {
  const { logout } = useAuth();
  const [licenses, setLicenses] = useState<AdminLicenseRow[]>([]);
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [tab, setTab] = useState<"licenses" | "requests">("licenses");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [licenseData, requestData] = await Promise.all([
        apiGet<{ items: AdminLicenseRow[] }>("/admin/licenses"),
        apiGet<{ items: AdminRequestRow[] }>("/admin/activation-requests"),
      ]);
      setLicenses(licenseData.items);
      setRequests(requestData.items);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Falha ao carregar o painel.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? licenses.filter((row) =>
          [
            row.name,
            row.company,
            row.email,
            row.phone,
            row.licenseCode || "",
          ].some((value) => value.toLowerCase().includes(q)),
        )
      : licenses;
  }, [licenses, search]);
  async function action(
    uid: string,
    actionName: string,
    payload: Record<string, unknown> = {},
  ) {
    const confirmations: Record<string, string> = {
      activate: "Ativar esta licença?",
      suspend: "Suspender esta licença?",
      revoke: "Cancelar definitivamente esta licença?",
      "reset-device": "Desvincular todos os aparelhos desta licença?",
    };
    if (confirmations[actionName] && !window.confirm(confirmations[actionName]))
      return;
    setBusy(`${uid}:${actionName}`);
    setMessage("");
    try {
      await apiPost(`/admin/licenses/${uid}/action`, {
        action: actionName,
        ...payload,
      });
      setMessage("Alteração aplicada com sucesso.");
      await load();
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Não foi possível aplicar a alteração.",
      );
    } finally {
      setBusy("");
    }
  }
  function changeDeviceLimit(row: AdminLicenseRow) {
    const value = window.prompt(
      "Quantos aparelhos esta licença poderá usar? (1 a 10)",
      String(row.maxDevices),
    );
    if (!value) return;
    const maxDevices = Number(value);
    if (!Number.isInteger(maxDevices) || maxDevices < 1 || maxDevices > 10) {
      setMessage("Informe um número inteiro entre 1 e 10.");
      return;
    }
    void action(row.uid, "set-max-devices", { maxDevices });
  }
  function extendTrial(row: AdminLicenseRow) {
    const value = window.prompt(
      "Quantas conclusões gratuitas adicionais? (1 a 20)",
      "1",
    );
    if (!value) return;
    const amount = Number(value);
    if (!Number.isInteger(amount) || amount < 1 || amount > 20) {
      setMessage("Informe um número inteiro entre 1 e 20.");
      return;
    }
    void action(row.uid, "extend-trial", { amount });
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link to="/">
          <Brand />
        </Link>
        <div>
          <Link className="button button--ghost" to="/app">
            <ArrowLeft /> Voltar ao aplicativo
          </Link>
          <Button variant="ghost" onClick={() => void logout()}>
            <LogOut /> Sair
          </Button>
        </div>
      </header>
      <section className="admin-content">
        <div className="page-header">
          <div>
            <span className="page-kicker">Controle do vendedor</span>
            <h1>Painel de licenças</h1>
            <p>Ative, suspenda e controle os aparelhos de cada comprador.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void load()}
            loading={loading}
          >
            <RefreshCw /> Atualizar
          </Button>
        </div>
        {message && (
          <div
            className={
              message.includes("sucesso")
                ? "form-alert form-alert--success"
                : "form-alert form-alert--danger"
            }
          >
            {message}
          </div>
        )}
        <div className="admin-stats">
          <article>
            <ShieldCheck />
            <span>
              <small>Licenças ativas</small>
              <b>{licenses.filter((x) => x.status === "active").length}</b>
            </span>
          </article>
          <article>
            <KeyRound />
            <span>
              <small>Em teste</small>
              <b>{licenses.filter((x) => x.status === "trial").length}</b>
            </span>
          </article>
          <article>
            <Smartphone />
            <span>
              <small>Solicitações pendentes</small>
              <b>{requests.filter((x) => x.status === "pending").length}</b>
            </span>
          </article>
        </div>
        <div className="admin-tabs">
          <button
            className={tab === "licenses" ? "active" : ""}
            onClick={() => setTab("licenses")}
          >
            Compradores e licenças
          </button>
          <button
            className={tab === "requests" ? "active" : ""}
            onClick={() => setTab("requests")}
          >
            Pedidos de ativação{" "}
            <i>{requests.filter((x) => x.status === "pending").length}</i>
          </button>
        </div>
        {tab === "licenses" ? (
          <section className="content-card admin-table-card">
            <div className="content-card__header">
              <h2>Licenças cadastradas</h2>
              <label className="search-field">
                <Search />
                <input
                  placeholder="Buscar comprador"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Comprador</th>
                    <th>Situação</th>
                    <th>Teste</th>
                    <th>Aparelhos</th>
                    <th>Licença</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.uid}>
                      <td>
                        <b>{row.name}</b>
                        <small>
                          {row.company} • {row.email}
                          <br />
                          {row.phone}
                        </small>
                      </td>
                      <td>
                        <StatusBadge status={row.status} />
                      </td>
                      <td>
                        {row.trialUsed}/{row.trialLimit}
                      </td>
                      <td>
                        {row.deviceCount}/{row.maxDevices}
                      </td>
                      <td>
                        <code>{row.licenseCode || "—"}</code>
                        <small>
                          {row.activatedAt
                            ? formatDateTime(row.activatedAt)
                            : "Não ativada"}
                        </small>
                      </td>
                      <td>
                        <div className="table-actions">
                          {row.status !== "active" && (
                            <Button
                              title="Ativar"
                              variant="success"
                              loading={busy === `${row.uid}:activate`}
                              onClick={() => void action(row.uid, "activate")}
                            >
                              <CheckCircle2 />
                            </Button>
                          )}
                          {row.status === "active" && (
                            <Button
                              title="Suspender"
                              variant="secondary"
                              onClick={() => void action(row.uid, "suspend")}
                            >
                              <Ban />
                            </Button>
                          )}
                          <Button
                            title="Adicionar usos de teste"
                            variant="ghost"
                            onClick={() => extendTrial(row)}
                          >
                            <Clock3 />
                          </Button>
                          <Button
                            title="Alterar limite de aparelhos"
                            variant="ghost"
                            onClick={() => changeDeviceLimit(row)}
                          >
                            <Smartphone />
                          </Button>
                          <Button
                            title="Desvincular aparelhos"
                            variant="ghost"
                            onClick={() => void action(row.uid, "reset-device")}
                          >
                            <RefreshCw />
                          </Button>
                          <Button
                            title="Cancelar licença"
                            variant="danger"
                            onClick={() => void action(row.uid, "revoke")}
                          >
                            <XCircle />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="request-grid">
            {requests.map((request) => (
              <article className="content-card" key={request.id}>
                <div>
                  <StatusBadge status={request.status} />
                  <code>{request.requestCode}</code>
                </div>
                <h3>{request.company || request.name}</h3>
                <p>
                  {request.name}
                  <br />
                  {request.email}
                  <br />
                  {request.phone}
                </p>
                <small>Solicitado em {formatDateTime(request.createdAt)}</small>
                {request.status === "pending" && (
                  <Button
                    variant="success"
                    loading={busy === `${request.uid}:activate`}
                    onClick={() => void action(request.uid, "activate")}
                  >
                    <CheckCircle2 /> Ativar licença
                  </Button>
                )}
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}
