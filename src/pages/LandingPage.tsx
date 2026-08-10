import {
  ArrowRight,
  Camera,
  Check,
  ClipboardCheck,
  CloudOff,
  FileDown,
  Gauge,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

const benefits = [
  {
    icon: <ClipboardCheck />,
    title: "OS técnica completa",
    text: "Cliente, equipamento, checklist de 19 pontos, medições, QTA, serviços e conclusão.",
  },
  {
    icon: <Camera />,
    title: "Fotos e assinaturas",
    text: "Registre evidências e colha assinaturas diretamente na tela do smartphone.",
  },
  {
    icon: <FileDown />,
    title: "PDF profissional",
    text: "Gere, baixe e compartilhe um relatório pronto para entregar ao cliente.",
  },
  {
    icon: <CloudOff />,
    title: "Trabalho offline",
    text: "Licenciados continuam registrando OS sem sinal. Os dados permanecem no aparelho.",
  },
  {
    icon: <ShieldCheck />,
    title: "Licença controlada",
    text: "Código individual, identificação do comprador e limite de aparelhos por licença.",
  },
  {
    icon: <Smartphone />,
    title: "Instalável no celular",
    text: "Funciona como aplicativo pelo navegador, sem depender de loja de apps.",
  },
];

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" aria-label="GeradorCheck Pro">
          <Brand />
        </Link>
        <nav className={menu ? "landing-nav landing-nav--open" : "landing-nav"}>
          <a href="#recursos" onClick={() => setMenu(false)}>
            Recursos
          </a>
          <a href="#como-funciona" onClick={() => setMenu(false)}>
            Como funciona
          </a>
          <Link to="/demonstracao" onClick={() => setMenu(false)}>
            Demonstração
          </Link>
          <Link className="button button--ghost" to="/entrar">
            Entrar
          </Link>
          <Link className="button button--primary" to="/criar-conta">
            Testar grátis
          </Link>
        </nav>
        <button
          className="menu-button"
          onClick={() => setMenu(!menu)}
          aria-label="Abrir menu"
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero__content">
            <span className="eyebrow">
              <Gauge size={16} /> Feito para técnicos de grupos geradores
            </span>
            <h1>
              Transforme cada manutenção em uma <em>entrega profissional.</em>
            </h1>
            <p>
              Crie ordens de serviço completas no celular, registre fotos e
              assinaturas e entregue um PDF com a sua identificação — mesmo
              trabalhando em campo.
            </p>
            <div className="hero__actions">
              <Link
                className="button button--primary button--large"
                to="/criar-conta"
              >
                Criar 3 OS grátis <ArrowRight size={19} />
              </Link>
              <Link
                className="button button--secondary button--large"
                to="/demonstracao"
              >
                Ver demonstração
              </Link>
            </div>
            <ul className="hero__proof">
              <li>
                <Check /> Sem cartão
              </li>
              <li>
                <Check /> Instalação simples
              </li>
              <li>
                <Check /> Dados no aparelho
              </li>
            </ul>
          </div>
          <div className="hero__visual">
            <div className="hero__glow" />
            <img
              src="/hero-gerador.webp"
              alt="Técnico inspecionando um grupo gerador"
            />
            <div className="floating-card floating-card--top">
              <ShieldCheck />
              <span>
                <b>Licença verificada</b>
                <small>Acesso protegido</small>
              </span>
            </div>
            <div className="floating-card floating-card--bottom">
              <FileDown />
              <span>
                <b>Relatório pronto</b>
                <small>PDF com fotos e assinatura</small>
              </span>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Resumo de recursos">
          <span>
            <b>19</b> pontos de inspeção
          </span>
          <span>
            <b>8</b> evidências fotográficas
          </span>
          <span>
            <b>2</b> assinaturas digitais
          </span>
          <span>
            <b>1</b> PDF profissional
          </span>
        </section>

        <section className="section" id="recursos">
          <div className="section-heading">
            <span className="eyebrow">Operação sem papel</span>
            <h2>Tudo que uma boa manutenção precisa documentar</h2>
            <p>
              Um fluxo objetivo para você ganhar tempo em campo e aumentar o
              valor percebido pelo cliente.
            </p>
          </div>
          <div className="feature-grid">
            {benefits.map((benefit) => (
              <article className="feature-card" key={benefit.title}>
                <i>{benefit.icon}</i>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section workflow" id="como-funciona">
          <div className="section-heading section-heading--left">
            <span className="eyebrow">Do campo ao cliente</span>
            <h2>Preencha, valide e compartilhe</h2>
          </div>
          <div className="workflow__steps">
            {[
              [
                "01",
                "Cadastre o atendimento",
                "Informe cliente, equipamento e tipo de manutenção.",
              ],
              [
                "02",
                "Execute a inspeção",
                "Marque o checklist, medições, teste do QTA e fotografe.",
              ],
              [
                "03",
                "Assine e entregue",
                "Finalize a OS e envie o relatório em PDF pelo WhatsApp.",
              ],
            ].map(([number, title, text]) => (
              <article key={number}>
                <b>{number}</b>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section commercial-cta">
          <div>
            <LockKeyhole size={32} />
            <h2>Teste antes de ativar</h2>
            <p>
              Crie até três ordens de serviço completas. Depois, ative sua
              licença diretamente com o vendedor pelo WhatsApp.
            </p>
          </div>
          <Link
            className="button button--primary button--large"
            to="/criar-conta"
          >
            Começar agora <ArrowRight size={19} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Brand compact />
        <p>
          Organização técnica, credibilidade e agilidade em cada atendimento.
        </p>
        <div>
          <Link to="/termos">Termos de uso</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/entrar">Acessar</Link>
        </div>
        <small>
          © {new Date().getFullYear()} GeradorCheck Pro. Todos os direitos
          reservados.
        </small>
      </footer>
    </div>
  );
}
