import {
  AlertTriangle,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  Gauge,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, EmptyState, StatusBadge } from "../components/ui";
import { useLicense } from "../contexts/LicenseContext";
import { deleteService, listServices } from "../lib/local-db";
import { formatDateTime } from "../lib/format";
import type { ServiceRecord } from "../types";

export function DashboardPage() {
  const { license } = useLicense();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void listServices()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((item) =>
      [
        item.orderNumber,
        item.customer.name,
        item.equipment.model,
        item.equipment.serialNumber,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, services]);
  const completed = services.filter(
    (item) => item.status === "completed",
  ).length;
  const attention = services.filter((item) =>
    item.checklist.some((check) => check.status === "attention"),
  ).length;

  async function remove(item: ServiceRecord) {
    if (
      !window.confirm(
        `Excluir ${item.orderNumber}? Esta ação remove a OS apenas deste aparelho.`,
      )
    )
      return;
    await deleteService(item.id);
    setServices((current) =>
      current.filter((service) => service.id !== item.id),
    );
  }

  return (
    <div className="app-page dashboard-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Visão geral</span>
          <h1>Ordens de serviço</h1>
          <p>Acompanhe os atendimentos armazenados neste aparelho.</p>
        </div>
        <Link className="button button--primary" to="/app/nova-os">
          <FilePlus2 size={19} /> Nova OS
        </Link>
      </header>

      {license?.status === "trial" && (
        <section className="trial-banner">
          <div>
            <Gauge />
            <span>
              <b>Período de avaliação</b>
              <small>
                Você ainda pode concluir {license.trialRemaining} de{" "}
                {license.trialLimit} OS gratuitas.
              </small>
            </span>
          </div>
          <div className="trial-dots">
            {Array.from({ length: license.trialLimit }, (_, index) => (
              <i
                key={index}
                className={index < license.trialUsed ? "used" : ""}
              />
            ))}
          </div>
          {license.trialRemaining === 0 && (
            <Link className="button button--primary" to="/ativar">
              Ativar licença
            </Link>
          )}
        </section>
      )}

      <section className="stats-grid">
        <article>
          <span>
            <ClipboardList />
          </span>
          <div>
            <small>Total neste aparelho</small>
            <b>{services.length}</b>
          </div>
        </article>
        <article>
          <span>
            <FileCheck2 />
          </span>
          <div>
            <small>Concluídas</small>
            <b>{completed}</b>
          </div>
        </article>
        <article>
          <span>
            <AlertTriangle />
          </span>
          <div>
            <small>Com pontos de atenção</small>
            <b>{attention}</b>
          </div>
        </article>
      </section>

      <section className="content-card service-list-card">
        <div className="content-card__header">
          <div>
            <h2>Atendimentos</h2>
            <p>Os registros são salvos automaticamente no navegador.</p>
          </div>
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Pesquisar ordens de serviço"
              placeholder="Buscar cliente, OS ou equipamento"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {loading ? (
          <div className="inline-loader">
            <span className="loader" /> Carregando OS…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardList />}
            title={search ? "Nenhuma OS encontrada" : "Seu painel está pronto"}
            description={
              search
                ? "Tente buscar por outro termo."
                : "Crie a primeira ordem de serviço e comece a registrar sua manutenção."
            }
            action={
              !search && (
                <Link className="button button--primary" to="/app/nova-os">
                  Criar primeira OS
                </Link>
              )
            }
          />
        ) : (
          <div className="service-list">
            {filtered.map((service) => (
              <article
                key={service.id}
                onClick={() => navigate(`/app/os/${service.id}`)}
              >
                <div className="service-list__status">
                  <StatusBadge status={service.status} />
                  {service.checklist.some(
                    (item) => item.status === "attention",
                  ) && (
                    <span
                      className="attention-dot"
                      title="Possui ponto de atenção"
                    />
                  )}
                </div>
                <div className="service-list__main">
                  <b>{service.customer.name || "Cliente não informado"}</b>
                  <span>
                    {service.orderNumber} •{" "}
                    {service.equipment.manufacturer || "Gerador"}{" "}
                    {service.equipment.model}
                  </span>
                </div>
                <div className="service-list__date">
                  <small>Última alteração</small>
                  <span>{formatDateTime(service.updatedAt)}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Excluir OS"
                  onClick={(event) => {
                    event.stopPropagation();
                    void remove(service);
                  }}
                >
                  <Trash2 size={17} />
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
