import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileText,
  Gauge,
  Image,
  PenLine,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

const screens = [
  {
    icon: <ClipboardCheck />,
    name: "Checklist técnico",
    title: "Inspeção guiada de 19 pontos",
    text: "Classifique cada item como conforme, atenção, não aplicável ou não avaliado e inclua observações.",
    mock: "checklist",
  },
  {
    icon: <Gauge />,
    name: "Medições e QTA",
    title: "Registre os dados do ensaio",
    text: "Tensões, correntes, frequência, bateria, temperatura, pressão, rotação e funcionamento do QTA.",
    mock: "measurements",
  },
  {
    icon: <Image />,
    name: "Evidências",
    title: "Fotos diretamente do celular",
    text: "Comprima e armazene até oito fotografias junto à OS, sem enviar as imagens para um servidor.",
    mock: "photos",
  },
  {
    icon: <PenLine />,
    name: "Assinaturas",
    title: "Validação de técnico e cliente",
    text: "Colete as assinaturas na tela e deixe o atendimento formalizado no relatório.",
    mock: "signature",
  },
  {
    icon: <FileText />,
    name: "Relatório PDF",
    title: "Entrega pronta para o cliente",
    text: "PDF paginado com dados da licença, checklist, testes, fotos, conclusão e assinaturas.",
    mock: "pdf",
  },
];

function DemoMock({ type }: { type: string }) {
  if (type === "checklist")
    return (
      <div className="demo-list">
        <span>
          <Check /> Nível e condição do óleo <b>CONFORME</b>
        </span>
        <span>
          <Check /> Sistema de arrefecimento <b>CONFORME</b>
        </span>
        <span className="attention">
          ! Bateria e terminais <b>ATENÇÃO</b>
        </span>
        <span>
          <Check /> Alternador e conexões <b>CONFORME</b>
        </span>
      </div>
    );
  if (type === "measurements")
    return (
      <div className="demo-metrics">
        {[
          ["L1–L2", "380 V"],
          ["L2–L3", "381 V"],
          ["Frequência", "60,1 Hz"],
          ["Bateria", "27,4 V"],
          ["Rotação", "1.801 rpm"],
          ["Carga", "72 %"],
        ].map(([a, b]) => (
          <span key={a}>
            <small>{a}</small>
            <b>{b}</b>
          </span>
        ))}
      </div>
    );
  if (type === "photos")
    return (
      <div className="demo-photos">
        <img src="/hero-gerador.webp" alt="Grupo gerador" />
        <span>
          <Image /> Evidência 02
        </span>
        <span>
          <Image /> Evidência 03
        </span>
      </div>
    );
  if (type === "signature")
    return (
      <div className="demo-signatures">
        <span>
          <i>João Técnico</i>
          <small>Técnico responsável</small>
        </span>
        <span>
          <i>Marcos Cliente</i>
          <small>Responsável do cliente</small>
        </span>
      </div>
    );
  return (
    <div className="demo-pdf">
      <div>
        <Brand compact />
        <b>OS-2026-1048</b>
      </div>
      <h4>RELATÓRIO DE MANUTENÇÃO</h4>
      <p />
      <p />
      <p />
      <span>✓ 19 itens verificados</span>
      <small>Licenciado para: Exemplo Geradores</small>
    </div>
  );
}

export function DemoPage() {
  const [index, setIndex] = useState(0);
  const current = screens[index];
  return (
    <main className="demo-page">
      <header>
        <Link to="/">
          <Brand />
        </Link>
        <Link className="button button--primary" to="/criar-conta">
          Testar gratuitamente
        </Link>
      </header>
      <section className="demo-hero">
        <Link className="auth-back" to="/">
          <ArrowLeft size={17} /> Voltar
        </Link>
        <span className="eyebrow">Demonstração da ferramenta</span>
        <h1>Veja como o GeradorCheck Pro organiza seu atendimento</h1>
        <p>
          Uma visão interativa dos principais recursos. Seus dados reais só são
          criados após o cadastro.
        </p>
      </section>
      <section className="demo-stage">
        <nav>
          {screens.map((screen, position) => (
            <button
              key={screen.name}
              className={position === index ? "active" : ""}
              onClick={() => setIndex(position)}
            >
              {screen.icon}
              <span>
                <small>Etapa {position + 1}</small>
                {screen.name}
              </span>
            </button>
          ))}
        </nav>
        <article>
          <div className="demo-copy">
            <span>{current.icon}</span>
            <h2>{current.title}</h2>
            <p>{current.text}</p>
            <div>
              <button
                className="button button--ghost"
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
              >
                <ArrowLeft /> Anterior
              </button>
              <button
                className="button button--secondary"
                disabled={index === screens.length - 1}
                onClick={() => setIndex(index + 1)}
              >
                Próximo <ArrowRight />
              </button>
            </div>
          </div>
          <div className="phone-frame">
            <div className="phone-frame__bar">
              <i />
              <span>GeradorCheck Pro</span>
            </div>
            <DemoMock type={current.mock} />
          </div>
        </article>
      </section>
      <section className="demo-cta">
        <h2>Agora teste com uma OS de verdade</h2>
        <p>
          Você pode concluir três atendimentos antes de precisar ativar sua
          licença.
        </p>
        <Link
          className="button button--primary button--large"
          to="/criar-conta"
        >
          Criar minha conta <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
