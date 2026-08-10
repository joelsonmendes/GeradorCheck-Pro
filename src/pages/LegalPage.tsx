import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/Brand";

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const terms = kind === "terms";
  return (
    <main className="legal-page">
      <header>
        <Link to="/">
          <Brand />
        </Link>
      </header>
      <article>
        <Link className="auth-back" to="/">
          <ArrowLeft size={17} /> Voltar
        </Link>
        <span className="eyebrow">GeradorCheck Pro</span>
        <h1>{terms ? "Termos de uso e licença" : "Política de privacidade"}</h1>
        <p className="legal-updated">
          Versão 1.0 • Atualizado em 9 de agosto de 2026
        </p>
        {terms ? (
          <>
            <h2>1. Objeto</h2>
            <p>
              O GeradorCheck Pro é uma ferramenta de apoio ao registro de
              manutenção em grupos geradores. Ele não substitui treinamento,
              normas técnicas, análise profissional nem procedimentos de
              segurança.
            </p>
            <h2>2. Período de teste</h2>
            <p>
              Cada conta pode concluir até três ordens de serviço em caráter
              demonstrativo. Após esse limite, a criação e conclusão de novos
              relatórios depende da ativação comercial.
            </p>
            <h2>3. Licença perpétua da versão adquirida</h2>
            <p>
              A ativação concede ao comprador identificado o direito de uso por
              prazo indeterminado da versão principal adquirida, respeitado o
              número de aparelhos autorizado. Não inclui hospedagem eterna,
              serviços de terceiros, novas versões principais ou suporte
              ilimitado.
            </p>
            <h2>4. Limites e proibições</h2>
            <p>
              A licença é pessoal ou empresarial, intransferível e não pode ser
              revendida, compartilhada, copiada, submetida a engenharia reversa
              ou usada para oferecer o próprio software como serviço a
              terceiros.
            </p>
            <h2>5. Dados e responsabilidade</h2>
            <p>
              O usuário é responsável pela veracidade, guarda, backup e
              compartilhamento dos dados técnicos registrados. Ordens de
              serviço, fotografias e assinaturas são armazenadas localmente no
              aparelho.
            </p>
            <h2>6. Suspensão</h2>
            <p>
              A licença pode ser suspensa ou cancelada em caso de fraude,
              chargeback, compartilhamento indevido, violação destes termos ou
              uso ilícito, resguardados os direitos previstos em lei.
            </p>
          </>
        ) : (
          <>
            <h2>1. Dados da conta</h2>
            <p>
              Para autenticação e licenciamento, são processados nome, empresa,
              telefone, e-mail, identificador técnico do aparelho, situação da
              licença e histórico essencial de ativações.
            </p>
            <h2>2. Dados das ordens de serviço</h2>
            <p>
              Os dados técnicos das OS, fotos e assinaturas ficam no banco local
              do navegador do próprio aparelho e não são enviados ao Firebase
              por esta versão. Faça backups periódicos pela tela de
              configurações.
            </p>
            <h2>3. Finalidades</h2>
            <p>
              Os dados de conta são usados para autenticar o acesso, impedir
              abuso do teste, controlar o limite de aparelhos, emitir a
              identificação no PDF e prestar suporte.
            </p>
            <h2>4. Compartilhamento</h2>
            <p>
              Dados de autenticação e licença são processados pela
              infraestrutura Firebase do Google. O relatório só é compartilhado
              quando o próprio usuário baixa ou envia o arquivo.
            </p>
            <h2>5. Segurança e retenção</h2>
            <p>
              São aplicadas autenticação, regras de acesso restritivas e funções
              administrativas protegidas. Dados de licença são retidos enquanto
              necessários ao cumprimento do contrato e obrigações legais.
            </p>
            <h2>6. Direitos</h2>
            <p>
              O titular pode solicitar correção ou exclusão dos seus dados
              pessoais, ressalvadas as informações que precisem ser mantidas por
              obrigação legal ou defesa de direitos.
            </p>
          </>
        )}
        <p className="legal-note">
          Antes da publicação comercial, preencha no projeto a identificação e o
          canal de contato do fornecedor e revise estes textos com assessoria
          jurídica adequada ao seu negócio.
        </p>
      </article>
    </main>
  );
}
