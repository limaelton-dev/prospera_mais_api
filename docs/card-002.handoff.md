# CARD-002 — contrato de entrada para o CARD-003

Estado: CARD-002 concluído e integrado em main na API e na Web em 09/10/2026.

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

- [x] A01–A18 revisados com testes/evidências.
- [x] Tipos, lint, formatação, testes e build da API aprovados.
- [x] Tipos, lint, formatação, build e Playwright da Web aprovados.
- [x] Migration sobre CARD-001 revisada.
- [x] Contrato OpenAPI e regressão de autenticação conferidos.
- [x] PR da API integrado com CI aprovada.
- [x] PR da Web integrado com CI aprovada.
- [x] SHAs finais e links dos PRs registrados no acompanhamento.

## Registro final — 09/10/2026

- API: 158 testes unitários e 49 testes PostgreSQL/HTTP aprovados.
- Web: 13 testes Playwright locais aprovados. A CI remota executa lint,
  formatação, tipos e build; Playwright permanece checkpoint local,
  conforme arquitetura 45 §31.4.
- Migration aditiva revisada, preservando InitialCard001. Elton confirmou
  sua aplicação no banco local e o funcionamento do login.
- OpenAPI composto conferido: 9 caminhos, 10 operações e contrato Auth
  preservado. Evidências A01–A18 registradas em ACOMPANHAMENTO-CARD-002.md
  na raiz do workspace.

| Repositório | PR integrado                                                       | SHA de merge em main                     | CI aprovada no HEAD do PR                                                              |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------- |
| API         | [PR #2](https://github.com/limaelton-dev/prospera_mais_api/pull/2) | 66c3e63c24d558cb5bc1d6ccbd8e632917ae2e2b | [22efedb](https://github.com/limaelton-dev/prospera_mais_api/actions/runs/37992562279) |
| Web         | [PR #2](https://github.com/limaelton-dev/prospera-mais-web/pull/2) | 9ab07f050ccd22626ae6a985b30d4cdef6a43c7a | [f9cf2df](https://github.com/limaelton-dev/prospera-mais-web/actions/runs/37991387805) |
