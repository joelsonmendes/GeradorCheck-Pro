# Arquitetura e regras de negócio

## Separação de dados

| Dado                          | Local                         | Motivo                                         |
| ----------------------------- | ----------------------------- | ---------------------------------------------- |
| OS, fotos e assinaturas       | IndexedDB do aparelho         | privacidade, operação offline e menor custo    |
| Configurações do técnico      | IndexedDB do aparelho         | personalização local do relatório              |
| Conta e senha                 | Firebase Authentication       | autenticação gerenciada                        |
| Teste, licença e dispositivos | Firestore via Cloud Functions | regra comercial não confiada ao navegador      |
| PDF                           | gerado no aparelho            | rapidez e ausência de upload de dados técnicos |

## Estados da licença

```text
trial ──3 OS concluídas──> bloqueio de conclusão
  │
  └──solicitar ativação──> pending ──aprovação──> active
                                                │
                               suspended <──────┤
                               revoked   <──────┘
```

- `trial`: pode concluir enquanto `trialUsed < trialLimit`.
- `pending`: pedido enviado; aguarda decisão do vendedor.
- `active`: uso normal, inclusive offline durante a janela de tolerância.
- `suspended`: bloqueio reversível.
- `revoked`: cancelamento administrativo.

Cada conclusão gratuita recebe um evento idempotente pelo UUID da OS. Reenviar o mesmo evento não aumenta o contador. O servidor valida conta, aparelho, situação e limite em uma transação do Firestore.

## Dispositivos

O navegador cria um UUID de instalação e envia esse valor somente à API autenticada. O servidor armazena o SHA-256 do identificador, nunca o valor original. Um aparelho já cadastrado apenas atualiza `lastSeenAt`. Um novo aparelho só é ativado se houver vaga em `maxDevices`.

Redefinir aparelhos no painel os torna inativos. No próximo acesso, o primeiro aparelho pode se registrar novamente se houver vaga.

## Uso offline

Uma licença ativa validada online é armazenada localmente com data de validação. A aplicação aceita esse cache por até 37 dias. Depois desse período, exige nova conexão. Contas em teste não podem registrar uma conclusão offline, pois o limite precisa ser verificado no servidor.

## Coleções do Firestore

```text
users/{uid}
licenses/{uid}
licenses/{uid}/devices/{sha256}
licenses/{uid}/trialCompletions/{serviceId}
activationRequests/{uid}
auditLogs/{autoId}
```

As regras negam todas as leituras e gravações diretas. As Cloud Functions usam o Admin SDK, verificam o token e aplicam autorização antes de operar.

## Limites conhecidos da versão 1

- OS não sincronizam entre aparelhos; use exportação/importação de backup.
- Fotografias e assinaturas dependem do armazenamento disponível no navegador.
- Limpar dados do site remove registros locais.
- Licença perpétua ainda depende da disponibilidade da hospedagem e dos serviços de autenticação/licenciamento.
- A versão não inclui cobrança automática; a confirmação do pagamento e a ativação são feitas manualmente pelo vendedor.
