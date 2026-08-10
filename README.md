# GeradorCheck Pro

Aplicação comercial em formato PWA para técnicos de manutenção de grupos geradores. O sistema cria ordens de serviço no smartphone, salva os dados localmente, coleta fotos e assinaturas e gera um relatório profissional em PDF.

O projeto já inclui o produto, a página de vendas, demonstração pública, autenticação, teste limitado a três OS concluídas, licença perpétua da versão adquirida, limite de aparelhos, ativação pelo WhatsApp e painel administrativo.

## O que está pronto

- Cadastro, login, recuperação de senha e consentimento do usuário.
- Três OS gratuitas por conta; rascunhos não consomem o limite.
- Bloqueio após o teste e botão de ativação com mensagem pronta para o WhatsApp.
- Licença individual com código, titular, situação e limite de dispositivos.
- Validação do aparelho no servidor e tolerância offline de 37 dias para licença ativa.
- Painel do vendedor para ativar, suspender, cancelar e desvincular aparelhos.
- Identificação do comprador e código da licença no rodapé do PDF.
- Marca d'água nos relatórios emitidos durante o teste.
- OS com cliente, equipamento, 19 itens técnicos, medições, QTA, fotos, serviços, conclusão, recomendações e assinaturas.
- Salvamento automático em IndexedDB, backup e restauração em JSON.
- PDF paginado que pode ser baixado ou compartilhado pelo smartphone.
- PWA instalável e responsiva para Android, iPhone, tablet e computador.
- Página inicial comercial, página de demonstração, termos e privacidade.
- Regras do Firestore fechadas, API protegida e trilha de auditoria administrativa.
- Integração contínua e implantação pelo GitHub Actions.

## Arquitetura escolhida

```text
Smartphone / navegador
├── React + PWA
├── IndexedDB: OS, fotos, assinaturas e configurações
├── jsPDF: relatório gerado dentro do aparelho
└── Firebase Auth: sessão do comprador
          │
          ▼
Firebase Cloud Functions (API protegida)
├── teste de 3 conclusões
├── licenças e códigos
├── aparelhos autorizados
├── pedidos de ativação
└── painel administrativo
          │
          ▼
Firestore: somente dados de conta e licenciamento
```

As OS não são enviadas ao Firebase nesta versão. Isso reduz custo e exposição de dados técnicos, permite trabalhar offline e deixa o comprador no controle dos seus registros. O backup local é indispensável.

## Requisitos

- Node.js 22 para manter compatibilidade com o ambiente das Cloud Functions.
- Conta Google e um projeto no Firebase.
- Plano do Firebase compatível com Cloud Functions e faturamento configurado.
- Repositório privado no GitHub.

## Instalação local

```bash
npm install
cp .env.example .env.local
cp .firebaserc.example .firebaserc
cp functions/.env.example functions/.env
```

Preencha `.env.local` com a configuração do aplicativo Web exibida em **Firebase Console → Configurações do projeto → Seus apps**. Em `functions/.env`, informe seu WhatsApp apenas com números, incluindo DDI e DDD.

Depois execute:

```bash
npm run dev
```

Para validar o pacote inteiro:

```bash
npm run test
npm run build:all
```

## Configuração do Firebase

1. Crie um projeto Firebase e registre um aplicativo Web.
2. Em **Authentication → Sign-in method**, habilite **E-mail/senha**.
3. Crie o banco **Cloud Firestore**; as regras deste projeto bloqueiam acesso direto pelo navegador.
4. Ative o **Firebase Hosting** e habilite faturamento compatível com Cloud Functions.
5. Copie `.firebaserc.example` para `.firebaserc` e troque `seu-projeto-firebase` pelo ID real.
6. Copie `.env.example` para `.env.local` e informe as sete variáveis do aplicativo Web.
7. Copie `functions/.env.example` para `functions/.env` e altere `SELLER_WHATSAPP_E164`.
8. Faça a primeira implantação com `npm run deploy`.

O guia detalhado está em [DEPLOY_FIREBASE.md](DEPLOY_FIREBASE.md).

## Como criar o primeiro administrador

Primeiro, crie uma conta normal pela tela do aplicativo. No Firebase Console, copie o UID em **Authentication → Users**. Em um terminal autenticado no projeto, execute:

```bash
npm run grant-admin -- UID_COPIADO
```

O comando utiliza as credenciais administrativas do Firebase CLI/Google Cloud no seu ambiente. Saia e entre novamente no aplicativo; o item **Licenças** aparecerá no menu.

## Fluxo comercial

1. O interessado cria uma conta e o primeiro aparelho é registrado.
2. Pode criar quantos rascunhos quiser, mas somente três OS concluídas são contabilizadas.
3. Na quarta conclusão, o aplicativo abre a tela de ativação.
4. O botão gera um código `GC-XXXXXX` e abre seu WhatsApp com os dados da conta e do aparelho.
5. Após confirmar o pagamento, abra `/admin` e clique em **Ativar licença**.
6. O sistema cria um código `GCP-XXXX-XXXX`; o comprador toca em **Já paguei — verificar ativação**.
7. O PDF passa a exibir o titular e o código da licença, sem marca d'água.

## Comandos disponíveis

| Comando                      | Função                                                             |
| ---------------------------- | ------------------------------------------------------------------ |
| `npm run dev`                | inicia a interface em desenvolvimento                              |
| `npm run emulators`          | inicia Auth, Functions, Firestore, Hosting e painel dos emuladores |
| `npm run check`              | valida os tipos TypeScript                                         |
| `npm run test`               | executa testes automatizados                                       |
| `npm run build:all`          | compila interface e funções                                        |
| `npm run deploy`             | valida e implanta tudo no Firebase                                 |
| `npm run deploy:hosting`     | implanta somente a interface                                       |
| `npm run grant-admin -- UID` | concede acesso ao painel do vendedor                               |

## Estrutura principal

```text
src/
├── pages/              telas públicas, OS, ativação e painel administrativo
├── components/         campos, fotos, assinatura, navegação e proteções
├── contexts/           autenticação e estado da licença
├── lib/                IndexedDB, API, Firebase, mídia e PDF
└── constants/          checklist técnico
functions/src/
├── index.ts            API de licenças, teste, aparelhos e administração
└── grant-admin.ts      concessão segura do primeiro administrador
```

## Decisões comerciais importantes

- A licença perpétua cobre a versão principal adquirida, não custos eternos de hospedagem nem futuras versões principais.
- O padrão é um aparelho por licença; o administrador pode alterar o limite pela API.
- Suspensão e cancelamento devem ser usados conforme o contrato, a legislação e os direitos do consumidor.
- Revise os textos jurídicos e inclua sua razão social, CPF/CNPJ e contato antes da venda.
- Mantenha o repositório privado: as regras no servidor protegem licenças, mas o código-fonte continua sendo um ativo comercial.

Consulte também [SECURITY.md](SECURITY.md), [ARCHITECTURE.md](ARCHITECTURE.md) e [LICENCA-COMERCIAL.md](LICENCA-COMERCIAL.md).
