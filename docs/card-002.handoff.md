# CARD-002 — contrato de entrada para o CARD-003

Estado: implementação e evidências devem ser conferidas antes do fechamento.

Fonte:
https://drive.google.com/file/d/1mLUEYEgQxPErw9hXpQd-faI6sjX4UU5f/view

## Entrega do CARD-002

- Criação atômica de espaço SHARED, primeiro membro e convite.
- Lista e detalhe autorizados.
- Emissão e substituição explícita pelo criador.
- Controle de versão da raiz Space.
- Recibos idempotentes sem armazenamento do segredo.
- Fluxo Web do criador com cópia e recuperação de resposta perdida.

## Entrada do CARD-003

- URL: /invitations#token={token}.
- O navegador captura explicitamente o fragmento.
- Token base64url de 43 caracteres, originado de 32 bytes aleatórios.
- Persistência somente do SHA-256 em 32 bytes.
- Convite inválido quando now >= expiresAt.
- Convite substituído não pode ser consumido.
- Aceitar ou rejeitar exige o fluxo autenticado do destinatário.
- Preservar o retorno ao convite após autenticação sem registrar o segredo
  em logs, analytics ou armazenamento persistente.
- Exibir somente os dados mínimos autorizados do convite.
- O aceite cria o segundo membro respeitando o teto de dois ativos.
- Alterações de membros e convites seguem a mesma transação e comparação
  de versão da raiz Space.
- Testar a corrida entre aceite e substituição.
- Não implementar o seletor global antes do CARD-004.

## Evidências de fechamento

- [ ] A01–A18 revisados com testes/evidências.
- [ ] Tipos, lint, formatação, testes e build da API aprovados.
- [ ] Tipos, lint, formatação, build e Playwright da Web aprovados.
- [ ] Migration sobre CARD-001 revisada.
- [ ] Contrato OpenAPI e regressão de autenticação conferidos.
- [ ] PR da API integrado com CI aprovada.
- [ ] PR da Web integrado com CI aprovada.
- [ ] SHAs finais e links dos PRs registrados no acompanhamento.
