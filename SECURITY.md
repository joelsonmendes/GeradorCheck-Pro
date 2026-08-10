# Segurança

## Controles implementados

- Firebase Authentication com validação e revogação do token em toda chamada privada.
- Autorização administrativa por custom claim assinada pelo Firebase.
- Firestore fechado para acesso direto do cliente.
- Contagem do teste e controle de dispositivos executados no servidor, em transações.
- Eventos de conclusão idempotentes para impedir contagem duplicada.
- Identificador de instalação transformado em SHA-256 antes do armazenamento.
- Rate limiting, cabeçalhos de segurança, CORS e limite de corpo na API.
- Auditoria das ações administrativas.
- Dados técnicos das OS permanecem no aparelho e não transitam pela API.
- Segredos e configurações locais ignorados pelo Git.

## Operação segura

- Use um repositório privado e autenticação em dois fatores no GitHub e Google.
- Conceda `admin` somente à sua própria conta ou a operadores autorizados.
- Dê à conta de serviço do GitHub apenas as permissões necessárias para implantação.
- Nunca publique `functions/.env`, `.env.local`, credenciais JSON ou chaves administrativas.
- Revise periodicamente usuários, contas de serviço, logs de auditoria e custos.
- Configure alertas de orçamento no Google Cloud.
- Mantenha Node, Firebase, React e dependências atualizados após testar uma cópia do projeto.

## Escopo de confiança

Nenhum aplicativo executado no navegador consegue impedir totalmente alteração local do código ou do IndexedDB. Por isso, direitos comerciais importantes — ativação, teste e limite de aparelhos — são validados pelas Cloud Functions. O PDF reflete a licença retornada pelo servidor; a ferramenta não pretende ser um mecanismo de DRM inviolável.

## Relato de vulnerabilidade

Antes de vender, substitua esta seção por um e-mail de segurança do fornecedor. Não divulgue publicamente detalhes exploráveis antes de uma correção estar disponível.
