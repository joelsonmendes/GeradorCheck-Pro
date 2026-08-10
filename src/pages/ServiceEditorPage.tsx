import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudOff,
  Download,
  FileText,
  Gauge,
  Images,
  PenLine,
  Save,
  Share2,
  UserRound,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PhotoEvidenceField } from "../components/PhotoEvidenceField";
import { SignaturePad } from "../components/SignaturePad";
import {
  Button,
  Field,
  Select,
  StatusBadge,
  Textarea,
  Toggle,
} from "../components/ui";
import { useLicense } from "../contexts/LicenseContext";
import { createEmptyService } from "../lib/defaults";
import { formatDateTime } from "../lib/format";
import { getService, getSettings, saveService } from "../lib/local-db";
import { downloadBlob } from "../lib/media";
import { createServicePdf } from "../lib/pdf";
import type { ChecklistStatus, ServiceRecord } from "../types";

const steps = [
  { label: "Cliente", icon: <UserRound /> },
  { label: "Gerador", icon: <Gauge /> },
  { label: "Checklist", icon: <ClipboardCheck /> },
  { label: "Medições", icon: <FileText /> },
  { label: "QTA e fotos", icon: <Images /> },
  { label: "Serviço", icon: <Wrench /> },
  { label: "Assinaturas", icon: <PenLine /> },
];

const checklistOptions: { value: ChecklistStatus; label: string }[] = [
  { value: "pending", label: "Não avaliado" },
  { value: "ok", label: "Conforme" },
  { value: "attention", label: "Atenção" },
  { value: "na", label: "Não se aplica" },
];

export function ServiceEditorPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { license, offline, registerCompletion } = useLicense();
  const [recordState, setRecord] = useState<ServiceRecord | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const creating = useRef<Promise<ServiceRecord> | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (serviceId) {
        const found = await getService(serviceId);
        if (!active) return;
        if (!found) {
          navigate("/app", { replace: true });
          return;
        }
        setRecord(found);
        return;
      }
      if (!creating.current) {
        creating.current = (async () => {
          const settings = await getSettings();
          const fresh = createEmptyService(settings.technicianName);
          await saveService(fresh);
          return fresh;
        })();
      }
      const fresh = await creating.current;
      if (!active) return;
      setRecord(fresh);
      navigate(`/app/os/${fresh.id}`, { replace: true });
    }
    void load();
    return () => {
      active = false;
    };
  }, [navigate, serviceId]);

  useEffect(() => {
    if (!recordState) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        await saveService(recordState);
        setSavedAt(new Date().toISOString());
      } finally {
        setSaving(false);
      }
    }, 750);
    return () => window.clearTimeout(timer);
  }, [recordState]);

  if (!recordState)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Preparando a ordem de serviço…</p>
      </div>
    );
  const record = recordState;
  const setCustomer = (key: keyof ServiceRecord["customer"], value: string) =>
    setRecord({ ...record, customer: { ...record.customer, [key]: value } });
  const setEquipment = (key: keyof ServiceRecord["equipment"], value: string) =>
    setRecord({ ...record, equipment: { ...record.equipment, [key]: value } });
  const setService = (key: keyof ServiceRecord["service"], value: string) =>
    setRecord({ ...record, service: { ...record.service, [key]: value } });
  const setMeasurement = (
    key: keyof ServiceRecord["measurements"],
    value: string,
  ) =>
    setRecord({
      ...record,
      measurements: { ...record.measurements, [key]: value },
    });
  const setQta = <K extends keyof ServiceRecord["qta"]>(
    key: K,
    value: ServiceRecord["qta"][K],
  ) => setRecord({ ...record, qta: { ...record.qta, [key]: value } });
  const setNarrative = (
    key:
      | "servicesPerformed"
      | "partsReplaced"
      | "conclusion"
      | "recommendations"
      | "customerSignerName"
      | "technicianSignature"
      | "customerSignature",
    value: string,
  ) => setRecord({ ...record, [key]: value });

  async function saveNow() {
    setSaving(true);
    setMessage("");
    try {
      const saved = await saveService(record);
      setRecord(saved);
      setSavedAt(saved.updatedAt);
      setMessage("OS salva neste aparelho.");
    } finally {
      setSaving(false);
    }
  }

  function validate() {
    if (!record.customer.name.trim()) {
      setStep(0);
      return "Informe o nome do cliente.";
    }
    if (
      !record.equipment.manufacturer.trim() ||
      !record.equipment.model.trim()
    ) {
      setStep(1);
      return "Informe fabricante e modelo do gerador.";
    }
    if (!record.service.technician.trim()) {
      setStep(0);
      return "Informe o técnico responsável.";
    }
    if (!record.servicesPerformed.trim()) {
      setStep(5);
      return "Descreva os serviços executados.";
    }
    if (!record.conclusion.trim()) {
      setStep(5);
      return "Preencha a conclusão técnica.";
    }
    if (!record.technicianSignature) {
      setStep(6);
      return "Colete a assinatura do técnico.";
    }
    return "";
  }

  async function complete() {
    setError("");
    setMessage("");
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    if (
      record.status === "draft" &&
      license?.status !== "trial" &&
      license?.status !== "active"
    ) {
      navigate("/ativar");
      return;
    }
    if (record.status === "draft" && license?.status === "trial") {
      if (license.trialRemaining <= 0) {
        navigate("/ativar");
        return;
      }
      if (offline || !navigator.onLine) {
        setError(
          "Conecte este aparelho à internet para validar a conclusão da OS gratuita.",
        );
        return;
      }
    }
    setSaving(true);
    try {
      let registered = record.trialCompletionRegistered;
      if (
        record.status === "draft" &&
        license?.status === "trial" &&
        !registered
      ) {
        await registerCompletion(record.id);
        registered = true;
      }
      const next: ServiceRecord = {
        ...record,
        status: "completed",
        completedAt: record.completedAt || new Date().toISOString(),
        trialCompletionRegistered: registered,
      };
      const saved = await saveService(next);
      setRecord(saved);
      setMessage(
        "OS concluída. O relatório profissional está pronto para gerar.",
      );
      setSavedAt(saved.updatedAt);
    } catch (cause) {
      const text =
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a OS.";
      if (
        text.toLowerCase().includes("teste") ||
        text.toLowerCase().includes("trial")
      )
        navigate("/ativar");
      else setError(text);
    } finally {
      setSaving(false);
    }
  }

  async function makePdf(share = false) {
    setError("");
    try {
      const settings = await getSettings();
      const { blob, filename } = createServicePdf(record, settings, license);
      if (share && navigator.share) {
        const file = new File([blob], filename, { type: "application/pdf" });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Relatório ${record.orderNumber}`,
            text: `Relatório de manutenção ${record.orderNumber}`,
            files: [file],
          });
          return;
        }
      }
      downloadBlob(blob, filename);
      setMessage("Relatório PDF gerado e salvo.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível gerar o relatório PDF.",
      );
    }
  }

  const checklistDone = record.checklist.filter(
    (item) => item.status !== "pending",
  ).length;
  return (
    <div className="app-page editor-page">
      <header className="editor-header">
        <div>
          <Link className="auth-back" to="/app">
            <ArrowLeft /> Voltar às OS
          </Link>
          <div className="editor-title">
            <span>
              <b>{record.orderNumber}</b>
              <StatusBadge status={record.status} />
            </span>
            <h1>{record.customer.name || "Nova ordem de serviço"}</h1>
            <small>
              {saving
                ? "Salvando automaticamente…"
                : savedAt
                  ? `Salvo ${formatDateTime(savedAt)}`
                  : "Salvamento automático ativo"}
            </small>
          </div>
        </div>
        <div className="editor-actions">
          <Button
            variant="ghost"
            onClick={() => void saveNow()}
            loading={saving}
          >
            <Save /> Salvar
          </Button>
          {record.status === "completed" && (
            <>
              <Button variant="secondary" onClick={() => void makePdf(false)}>
                <Download /> PDF
              </Button>
              <Button onClick={() => void makePdf(true)}>
                <Share2 /> Compartilhar
              </Button>
            </>
          )}
        </div>
      </header>

      {offline && (
        <div className="form-alert">
          <CloudOff size={18} /> Modo offline: esta OS continua sendo salva no
          aparelho.
        </div>
      )}
      {error && <div className="form-alert form-alert--danger">{error}</div>}
      {message && (
        <div className="form-alert form-alert--success">{message}</div>
      )}

      <div className="editor-layout">
        <aside className="step-nav">
          {steps.map((item, index) => (
            <button
              key={item.label}
              className={index === step ? "active" : index < step ? "done" : ""}
              onClick={() => setStep(index)}
            >
              <i>{index < step ? <Check /> : item.icon}</i>
              <span>
                <small>Etapa {index + 1}</small>
                {item.label}
              </span>
            </button>
          ))}
        </aside>
        <section className="editor-card">
          {step === 0 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <UserRound />
                </span>
                <div>
                  <small>Etapa 1 de 7</small>
                  <h2>Cliente e atendimento</h2>
                  <p>Identifique o contratante e o serviço realizado.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field
                  label="Cliente / Razão social"
                  required
                  value={record.customer.name}
                  onChange={(e) => setCustomer("name", e.target.value)}
                />
                <Field
                  label="CPF/CNPJ"
                  value={record.customer.document}
                  onChange={(e) => setCustomer("document", e.target.value)}
                />
                <Field
                  label="Responsável no local"
                  value={record.customer.responsible}
                  onChange={(e) => setCustomer("responsible", e.target.value)}
                />
                <Field
                  label="Telefone"
                  type="tel"
                  value={record.customer.phone}
                  onChange={(e) => setCustomer("phone", e.target.value)}
                />
                <Field
                  label="E-mail"
                  type="email"
                  value={record.customer.email}
                  onChange={(e) => setCustomer("email", e.target.value)}
                />
                <div className="form-grid__wide">
                  <Field
                    label="Endereço do atendimento"
                    value={record.customer.address}
                    onChange={(e) => setCustomer("address", e.target.value)}
                  />
                </div>
                <Select
                  label="Tipo de serviço"
                  value={record.service.type}
                  onChange={(e) => setService("type", e.target.value)}
                >
                  <option>Manutenção preventiva</option>
                  <option>Manutenção corretiva</option>
                  <option>Instalação / comissionamento</option>
                  <option>Inspeção técnica</option>
                  <option>Atendimento emergencial</option>
                  <option>Teste operacional</option>
                </Select>
                <Field
                  label="Técnico responsável"
                  required
                  value={record.service.technician}
                  onChange={(e) => setService("technician", e.target.value)}
                />
                <Field
                  label="Data"
                  type="date"
                  value={record.service.startDate}
                  onChange={(e) => setService("startDate", e.target.value)}
                />
                <div className="form-grid form-grid--nested">
                  <Field
                    label="Início"
                    type="time"
                    value={record.service.startTime}
                    onChange={(e) => setService("startTime", e.target.value)}
                  />
                  <Field
                    label="Término"
                    type="time"
                    value={record.service.endTime}
                    onChange={(e) => setService("endTime", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <Gauge />
                </span>
                <div>
                  <small>Etapa 2 de 7</small>
                  <h2>Identificação do grupo gerador</h2>
                  <p>Registre os dados da máquina atendida.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field
                  label="Fabricante"
                  required
                  value={record.equipment.manufacturer}
                  onChange={(e) => setEquipment("manufacturer", e.target.value)}
                />
                <Field
                  label="Modelo"
                  required
                  value={record.equipment.model}
                  onChange={(e) => setEquipment("model", e.target.value)}
                />
                <Field
                  label="Número de série"
                  value={record.equipment.serialNumber}
                  onChange={(e) => setEquipment("serialNumber", e.target.value)}
                />
                <Field
                  label="Potência (kVA)"
                  inputMode="decimal"
                  value={record.equipment.powerKva}
                  onChange={(e) => setEquipment("powerKva", e.target.value)}
                />
                <Select
                  label="Combustível"
                  value={record.equipment.fuel}
                  onChange={(e) => setEquipment("fuel", e.target.value)}
                >
                  <option>Diesel</option>
                  <option>Gás natural</option>
                  <option>Gasolina</option>
                  <option>Biogás</option>
                  <option>Outro</option>
                </Select>
                <Field
                  label="Horímetro (h)"
                  inputMode="decimal"
                  value={record.equipment.hourmeter}
                  onChange={(e) => setEquipment("hourmeter", e.target.value)}
                />
                <Field
                  label="Controlador"
                  value={record.equipment.controller}
                  onChange={(e) => setEquipment("controller", e.target.value)}
                />
                <Field
                  label="Localização do equipamento"
                  value={record.equipment.location}
                  onChange={(e) => setEquipment("location", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <ClipboardCheck />
                </span>
                <div>
                  <small>Etapa 3 de 7</small>
                  <h2>Checklist técnico</h2>
                  <p>
                    {checklistDone} de {record.checklist.length} pontos
                    avaliados.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    setRecord({
                      ...record,
                      checklist: record.checklist.map((item) => ({
                        ...item,
                        status: "ok",
                      })),
                    })
                  }
                >
                  <CheckCircle2 /> Marcar todos conforme
                </Button>
              </div>
              <div className="checklist">
                <div className="checklist__progress">
                  <i
                    style={{
                      width: `${(checklistDone / record.checklist.length) * 100}%`,
                    }}
                  />
                </div>
                {record.checklist.map((item, index) => (
                  <article
                    key={item.id}
                    className={`check-item check-item--${item.status}`}
                  >
                    <span className="check-item__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="check-item__label">
                      <small>{item.category}</small>
                      <b>{item.label}</b>
                    </div>
                    <select
                      aria-label={`Resultado: ${item.label}`}
                      value={item.status}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          checklist: record.checklist.map((check) =>
                            check.id === item.id
                              ? {
                                  ...check,
                                  status: e.target.value as ChecklistStatus,
                                }
                              : check,
                          ),
                        })
                      }
                    >
                      {checklistOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label={`Observação: ${item.label}`}
                      placeholder="Observação opcional"
                      value={item.observation}
                      onChange={(e) =>
                        setRecord({
                          ...record,
                          checklist: record.checklist.map((check) =>
                            check.id === item.id
                              ? { ...check, observation: e.target.value }
                              : check,
                          ),
                        })
                      }
                    />
                  </article>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <FileText />
                </span>
                <div>
                  <small>Etapa 4 de 7</small>
                  <h2>Medições operacionais</h2>
                  <p>Use os valores e unidades exibidos no instrumento.</p>
                </div>
              </div>
              <div className="measurement-section">
                <h3>Grandezas elétricas</h3>
                <div className="form-grid form-grid--three">
                  <Field
                    label="Tensão L1–L2 (V)"
                    inputMode="decimal"
                    value={record.measurements.voltageL1L2}
                    onChange={(e) =>
                      setMeasurement("voltageL1L2", e.target.value)
                    }
                  />
                  <Field
                    label="Tensão L2–L3 (V)"
                    inputMode="decimal"
                    value={record.measurements.voltageL2L3}
                    onChange={(e) =>
                      setMeasurement("voltageL2L3", e.target.value)
                    }
                  />
                  <Field
                    label="Tensão L3–L1 (V)"
                    inputMode="decimal"
                    value={record.measurements.voltageL3L1}
                    onChange={(e) =>
                      setMeasurement("voltageL3L1", e.target.value)
                    }
                  />
                  <Field
                    label="Corrente L1 (A)"
                    inputMode="decimal"
                    value={record.measurements.currentL1}
                    onChange={(e) =>
                      setMeasurement("currentL1", e.target.value)
                    }
                  />
                  <Field
                    label="Corrente L2 (A)"
                    inputMode="decimal"
                    value={record.measurements.currentL2}
                    onChange={(e) =>
                      setMeasurement("currentL2", e.target.value)
                    }
                  />
                  <Field
                    label="Corrente L3 (A)"
                    inputMode="decimal"
                    value={record.measurements.currentL3}
                    onChange={(e) =>
                      setMeasurement("currentL3", e.target.value)
                    }
                  />
                  <Field
                    label="Frequência (Hz)"
                    inputMode="decimal"
                    value={record.measurements.frequency}
                    onChange={(e) =>
                      setMeasurement("frequency", e.target.value)
                    }
                  />
                  <Field
                    label="Tensão da bateria (V)"
                    inputMode="decimal"
                    value={record.measurements.batteryVoltage}
                    onChange={(e) =>
                      setMeasurement("batteryVoltage", e.target.value)
                    }
                  />
                  <Field
                    label="Carga (%)"
                    inputMode="decimal"
                    value={record.measurements.loadPercent}
                    onChange={(e) =>
                      setMeasurement("loadPercent", e.target.value)
                    }
                  />
                </div>
                <h3>Grandezas mecânicas</h3>
                <div className="form-grid form-grid--three">
                  <Field
                    label="Temperatura (°C)"
                    inputMode="decimal"
                    value={record.measurements.coolantTemperature}
                    onChange={(e) =>
                      setMeasurement("coolantTemperature", e.target.value)
                    }
                  />
                  <Field
                    label="Pressão do óleo"
                    inputMode="decimal"
                    value={record.measurements.oilPressure}
                    onChange={(e) =>
                      setMeasurement("oilPressure", e.target.value)
                    }
                  />
                  <Field
                    label="Rotação (rpm)"
                    inputMode="decimal"
                    value={record.measurements.rpm}
                    onChange={(e) => setMeasurement("rpm", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <Images />
                </span>
                <div>
                  <small>Etapa 5 de 7</small>
                  <h2>Teste do QTA e evidências</h2>
                  <p>
                    Valide a transferência automática e registre fotografias.
                  </p>
                </div>
              </div>
              <div className="qta-grid">
                <Toggle
                  label="Rede disponível"
                  checked={record.qta.utilityAvailable}
                  onChange={(value) => setQta("utilityAvailable", value)}
                />
                <Toggle
                  label="Controlador em automático"
                  checked={record.qta.automaticMode}
                  onChange={(value) => setQta("automaticMode", value)}
                />
                <Toggle
                  label="Partida automática"
                  checked={record.qta.automaticStart}
                  onChange={(value) => setQta("automaticStart", value)}
                />
                <Toggle
                  label="Transferência para gerador"
                  checked={record.qta.transferToGenerator}
                  onChange={(value) => setQta("transferToGenerator", value)}
                />
                <Toggle
                  label="Retorno para rede"
                  checked={record.qta.returnToUtility}
                  onChange={(value) => setQta("returnToUtility", value)}
                />
                <Toggle
                  label="Ciclo de resfriamento"
                  checked={record.qta.cooldownPerformed}
                  onChange={(value) => setQta("cooldownPerformed", value)}
                />
              </div>
              <div className="form-grid form-grid--three">
                <Field
                  label="Atraso de partida (s)"
                  inputMode="decimal"
                  value={record.qta.startDelaySeconds}
                  onChange={(e) => setQta("startDelaySeconds", e.target.value)}
                />
                <Field
                  label="Transferência (s)"
                  inputMode="decimal"
                  value={record.qta.transferSeconds}
                  onChange={(e) => setQta("transferSeconds", e.target.value)}
                />
                <Field
                  label="Retorno (s)"
                  inputMode="decimal"
                  value={record.qta.returnSeconds}
                  onChange={(e) => setQta("returnSeconds", e.target.value)}
                />
              </div>
              <div className="form-grid">
                <Select
                  label="Resultado do teste"
                  value={record.qta.result}
                  onChange={(e) =>
                    setQta(
                      "result",
                      e.target.value as ServiceRecord["qta"]["result"],
                    )
                  }
                >
                  <option value="not-tested">Não testado</option>
                  <option value="approved">Aprovado</option>
                  <option value="attention">Requer atenção</option>
                </Select>
                <Textarea
                  label="Observações do QTA"
                  rows={3}
                  value={record.qta.notes}
                  onChange={(e) => setQta("notes", e.target.value)}
                />
              </div>
              <PhotoEvidenceField
                photos={record.photos}
                onChange={(photos) => setRecord({ ...record, photos })}
              />
            </>
          )}

          {step === 5 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <Wrench />
                </span>
                <div>
                  <small>Etapa 6 de 7</small>
                  <h2>Descrição técnica</h2>
                  <p>Documente o que foi executado e a condição final.</p>
                </div>
              </div>
              <div className="narrative-grid">
                <Textarea
                  label="Serviços executados"
                  required
                  rows={5}
                  placeholder="Descreva as inspeções, ajustes, testes e intervenções realizados…"
                  value={record.servicesPerformed}
                  onChange={(e) =>
                    setNarrative("servicesPerformed", e.target.value)
                  }
                />
                <Textarea
                  label="Peças e materiais substituídos"
                  rows={4}
                  placeholder="Informe quantidades, especificações e códigos quando houver…"
                  value={record.partsReplaced}
                  onChange={(e) =>
                    setNarrative("partsReplaced", e.target.value)
                  }
                />
                <Textarea
                  label="Conclusão técnica"
                  required
                  rows={5}
                  placeholder="Registre a condição do equipamento após o serviço…"
                  value={record.conclusion}
                  onChange={(e) => setNarrative("conclusion", e.target.value)}
                />
                <Textarea
                  label="Recomendações ao cliente"
                  rows={4}
                  placeholder="Próximas manutenções, correções pendentes ou cuidados operacionais…"
                  value={record.recommendations}
                  onChange={(e) =>
                    setNarrative("recommendations", e.target.value)
                  }
                />
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <div className="editor-card__heading">
                <span>
                  <PenLine />
                </span>
                <div>
                  <small>Etapa 7 de 7</small>
                  <h2>Validação do atendimento</h2>
                  <p>As assinaturas serão incluídas no relatório final.</p>
                </div>
              </div>
              <div className="signature-grid">
                <SignaturePad
                  label="Assinatura do técnico *"
                  value={record.technicianSignature}
                  onChange={(value) =>
                    setNarrative("technicianSignature", value)
                  }
                />
                <div>
                  <SignaturePad
                    label="Assinatura do cliente"
                    value={record.customerSignature}
                    onChange={(value) =>
                      setNarrative("customerSignature", value)
                    }
                  />
                  <Field
                    label="Nome de quem assinou pelo cliente"
                    value={record.customerSignerName}
                    onChange={(e) =>
                      setNarrative("customerSignerName", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="completion-summary">
                <h3>Resumo antes de concluir</h3>
                <div>
                  <span>
                    <Check className={record.customer.name ? "ok" : ""} />{" "}
                    Cliente identificado
                  </span>
                  <span>
                    <Check className={record.equipment.model ? "ok" : ""} />{" "}
                    Gerador identificado
                  </span>
                  <span>
                    <Check
                      className={
                        checklistDone === record.checklist.length ? "ok" : ""
                      }
                    />{" "}
                    Checklist: {checklistDone}/{record.checklist.length}
                  </span>
                  <span>
                    <Check
                      className={
                        record.servicesPerformed && record.conclusion
                          ? "ok"
                          : ""
                      }
                    />{" "}
                    Descrição técnica
                  </span>
                  <span>
                    <Check className={record.technicianSignature ? "ok" : ""} />{" "}
                    Assinatura do técnico
                  </span>
                </div>
                {record.status === "draft" && license?.status === "trial" && (
                  <p>
                    Ao concluir, esta será a OS gratuita{" "}
                    <b>
                      {license.trialUsed + 1} de {license.trialLimit}
                    </b>
                    . Rascunhos não consomem o limite.
                  </p>
                )}
                <Button
                  className="completion-button"
                  loading={saving}
                  onClick={() => void complete()}
                >
                  <CheckCircle2 />{" "}
                  {record.status === "completed"
                    ? "Salvar alterações da OS"
                    : "Concluir ordem de serviço"}
                </Button>
                {record.status === "completed" && (
                  <div className="completion-pdf-actions">
                    <Button
                      variant="secondary"
                      onClick={() => void makePdf(false)}
                    >
                      <Download /> Baixar PDF
                    </Button>
                    <Button onClick={() => void makePdf(true)}>
                      <Share2 /> Compartilhar PDF
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          <footer className="editor-footer">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft /> Anterior
            </Button>
            <span>
              Etapa {step + 1} de {steps.length}
            </span>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)}>
                Próxima etapa <ArrowRight />
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => void saveNow()}>
                <Save /> Salvar rascunho
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}
