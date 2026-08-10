import {
  Download,
  HardDriveDownload,
  Save,
  Smartphone,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Field, Textarea } from "../components/ui";
import { downloadBlob } from "../lib/media";
import {
  exportLocalData,
  getSettings,
  importLocalData,
  requestPersistentStorage,
  saveSettings,
} from "../lib/local-db";
import type { AppSettings } from "../types";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getSettings().then(setSettings);
    void requestPersistentStorage();
  }, []);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (!settings)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Carregando configurações…</p>
      </div>
    );
  const set = (key: keyof AppSettings, value: string) =>
    setSettings((current) =>
      current ? { ...current, [key]: value } : current,
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    const current = settings;
    if (!current) return;
    setSaving(true);
    await saveSettings(current);
    setMessage("Configurações salvas neste aparelho.");
    setSaving(false);
    setTimeout(() => setMessage(""), 3500);
  }
  async function backup() {
    const text = await exportLocalData();
    downloadBlob(
      new Blob([text], { type: "application/json" }),
      `backup-geradorcheck-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      const count = await importLocalData(await file.text());
      setMessage(
        `${count} OS importadas com sucesso. Atualize o painel para visualizá-las.`,
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Falha ao importar o backup.",
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="app-page settings-page">
      <header className="page-header">
        <div>
          <span className="page-kicker">Personalização local</span>
          <h1>Configurações</h1>
          <p>Estas informações aparecem nos seus relatórios em PDF.</p>
        </div>
      </header>
      {message && (
        <div className="form-alert form-alert--success">{message}</div>
      )}
      <form className="content-card settings-form" onSubmit={submit}>
        <div className="content-card__header">
          <div>
            <h2>Empresa e técnico</h2>
            <p>Dados profissionais usados no cabeçalho e nas assinaturas.</p>
          </div>
        </div>
        <div className="form-grid">
          <Field
            label="Empresa ou nome profissional"
            value={settings.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
          <Field
            label="CPF/CNPJ"
            value={settings.businessDocument}
            onChange={(e) => set("businessDocument", e.target.value)}
          />
          <Field
            label="Telefone"
            type="tel"
            value={settings.businessPhone}
            onChange={(e) => set("businessPhone", e.target.value)}
          />
          <Field
            label="E-mail"
            type="email"
            value={settings.businessEmail}
            onChange={(e) => set("businessEmail", e.target.value)}
          />
          <Field
            label="Técnico padrão"
            value={settings.technicianName}
            onChange={(e) => set("technicianName", e.target.value)}
          />
          <Field
            label="Registro profissional"
            value={settings.technicianRegistration}
            onChange={(e) => set("technicianRegistration", e.target.value)}
          />
          <div className="form-grid__wide">
            <Textarea
              label="Rodapé do relatório"
              rows={3}
              value={settings.reportFooter}
              onChange={(e) => set("reportFooter", e.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <Button type="submit" loading={saving}>
            <Save size={18} /> Salvar configurações
          </Button>
        </div>
      </form>

      <section className="settings-tools">
        <article className="content-card">
          <span className="tool-icon">
            <HardDriveDownload />
          </span>
          <div>
            <h2>Backup das OS</h2>
            <p>
              Exporte periodicamente os registros, fotos e assinaturas deste
              aparelho para um arquivo JSON.
            </p>
          </div>
          <div className="tool-actions">
            <Button variant="secondary" onClick={() => void backup()}>
              <Download size={18} /> Baixar backup
            </Button>
            <Button variant="ghost" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> Restaurar backup
            </Button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => void restore(e.target.files?.[0])}
            />
          </div>
        </article>
        <article className="content-card">
          <span className="tool-icon">
            <Smartphone />
          </span>
          <div>
            <h2>Instalar no smartphone</h2>
            <p>
              Adicione o GeradorCheck Pro à tela inicial para abrir como um
              aplicativo.
            </p>
          </div>
          {installPrompt ? (
            <Button
              variant="secondary"
              onClick={() => void installPrompt.prompt()}
            >
              Instalar aplicativo
            </Button>
          ) : (
            <small>
              No iPhone, use Compartilhar → Adicionar à Tela de Início. No
              Android, abra o menu do navegador → Instalar app.
            </small>
          )}
        </article>
      </section>
      <div className="data-note">
        <b>Importante:</b> as OS, fotografias e assinaturas ficam neste
        navegador. Limpar os dados do site ou perder o aparelho sem backup pode
        apagar esses registros.
      </div>
    </div>
  );
}
