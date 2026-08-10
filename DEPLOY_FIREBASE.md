# Implantação no Firebase — passo a passo

## 1. Criar o projeto

1. Acesse o Firebase Console e crie um projeto.
2. Adicione um aplicativo Web com o nome `GeradorCheck Pro`.
3. Guarde o objeto de configuração mostrado pelo console.
4. Habilite faturamento em um plano que permita executar Cloud Functions.

## 2. Habilitar produtos

- **Authentication:** habilite o provedor E-mail/senha.
- **Firestore Database:** crie um banco no modo produção, preferencialmente em uma região próxima dos usuários.
- **Hosting:** conclua a ativação; o projeto já contém as regras de publicação.

Não abra as regras do Firestore. O arquivo `firestore.rules` nega todo acesso do cliente; somente o Admin SDK das Functions acessa licenças.

## 3. Informar as variáveis

Crie `.env.local` na raiz a partir de `.env.example`:

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_USE_FIREBASE_EMULATORS=false
```

Crie `functions/.env` a partir de `functions/.env.example`:

```dotenv
SELLER_WHATSAPP_E164=5568999999999
```

Crie `.firebaserc` a partir do exemplo e use o ID real:

```json
{
  "projects": { "default": "ID-REAL-DO-PROJETO" }
}
```

Esses três arquivos são ignorados pelo Git e não devem ser publicados.

## 4. Testar antes de publicar

```bash
npm install
npm run check
npm run test
npm run build:all
```

Para testar com emuladores:

```bash
npm run emulators
```

Em outro terminal, ajuste temporariamente `VITE_USE_FIREBASE_EMULATORS=true` e execute `npm run dev`.

## 5. Primeira implantação

Autentique a CLI e publique:

```bash
npx firebase-tools login
npm run deploy
```

Ao final, a CLI mostrará o domínio `web.app`. Teste cadastro, três conclusões de OS, bloqueio, pedido de ativação, ativação no painel, PDF e reabertura offline.

## 6. Configurar domínio próprio

No Firebase Hosting, use **Adicionar domínio personalizado**. Siga os registros DNS fornecidos pelo console. Mantenha o domínio `web.app` ativo como alternativa técnica.

## 7. Implantar pelo GitHub Actions

No repositório privado, crie os seguintes **Actions secrets**:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT` — JSON completo de uma conta de serviço com permissões mínimas para implantar Hosting, Functions e regras.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `SELLER_WHATSAPP_E164`

O workflow `.github/workflows/firebase-deploy.yml` publica automaticamente quando houver push na branch `main`. Variáveis `VITE_*` não são segredos criptográficos, mas ficam centralizadas no ambiente do repositório.

## 8. Criar o administrador

Crie sua conta pela interface. Copie o UID no Firebase Authentication e execute localmente com credenciais Google autorizadas:

```bash
npm run grant-admin -- UID_DO_SEU_USUARIO
```

Saia e entre novamente. A rota `/admin` ficará disponível.

## Checklist de produção

- [ ] WhatsApp real configurado em `functions/.env` e no secret do GitHub.
- [ ] Conta do vendedor marcada como administradora.
- [ ] Razão social, contato e regras comerciais inseridos nos termos.
- [ ] Cadastro e recuperação de senha testados.
- [ ] Quarta OS realmente bloqueada.
- [ ] Aparelho excedente realmente bloqueado.
- [ ] Ativação e cancelamento testados com uma conta de teste.
- [ ] PDF aberto no Android e no iPhone.
- [ ] Backup exportado e restaurado em outro navegador.
- [ ] Alertas de orçamento/faturamento configurados no Google Cloud.
- [ ] Repositório configurado como privado e protegido por autenticação em dois fatores.
