# CARD-003 — contrato de entrada para o CARD-004

Implementação e validação local concluídas em 09/10/2026. A integração remota e os SHAs finais devem ser conferidos nos PRs e no acompanhamento do workspace.

- [Refinamento oficial](https://drive.google.com/file/d/19MQr4RF0JcIbWH9m3JP-PY4n6K_3E9tu/view).
- [PR API #4](https://github.com/limaelton-dev/prospera_mais_api/pull/4).
- [PR Web #3](https://github.com/limaelton-dev/prospera-mais-web/pull/3).
- `ACOMPANHAMENTO-CARD-003.md` e `CARD-003-FASES-7-8-9-10.md` na raiz do workspace: fases, commits, matriz A01–A20 e resultados remotos.

## Entrega

- Preview autenticado mínimo: nome do espaço e displayName do convidante, sem leitura geral do agregado.
- Aceite atômico de Invitation, segundo Member ACTIVE, versão da raiz e recibo.
- Recusa resolve Invitation sem criar Member nem conceder acesso; criador pode emitir novo convite.
- Token exato por SHA-256, validade `now < expiresAt`, convite exato inclusive terminal, histórico preservado e teto de dois membros ativos.
- Replay próprio por ator/operação/chave/entrada; aceite revalida membership e recusa não exige membership.
- CAS e rollback protegendo decisões concorrentes e substituição do convite.
- Fluxo Web com retorno após login/cadastro, decisão explícita, retry de resultado incerto e isolamento por pessoa.

## HTTP e Web

Prefixo `/v2`:

| Operação                    | Entrada                                                      | Resultado                                                                                             |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| POST `/invitations/preview` | `{ token }`                                                  | 200: invitation PENDING, space id/label/version, invitedBy displayName e canRespond. Somente leitura. |
| POST `/invitations/respond` | `{ token, decision: "ACCEPT" ou "REJECT", expectedVersion }` | 200: decisão, convite resolvido, spaceId, actorMembership ou null, replayed.                          |

Ambos exigem sessão e CSRF e respondem no-store. Resposta exige `Idempotency-Key` UUID. Ator vem exclusivamente da sessão. DTOs rejeitam extras e não normalizam o token. Limites por IP/rota: preview 30/min, resposta 10/min. `Retry-After` está exposto por CORS.

OpenAPI servido: versão informativa 0.3.0, 11 caminhos e 12 operações; contrato Auth preservado. Erros estáveis: VALIDATION_ERROR, UNAUTHENTICATED, INVALID_CSRF_TOKEN, INVITATION_RESPONSE_NOT_ALLOWED, INVITATION_UNAVAILABLE, SPACE_NOT_ACTIVE, SPACE_MEMBER_LIMIT_REACHED, CONCURRENT_MODIFICATION, IDEMPOTENCY_KEY_REUSED, TOO_MANY_REQUESTS e INTERNAL_ERROR.

URL de entrada: `/invitations#token={token}`. Token base64url de 43 caracteres, removido do fragmento com replaceState antes da autenticação. Provider no layout raiz mantém segredo e tentativa somente em memória entre navegações cliente. Nenhum token em armazenamento, cookies, URL de retorno, query keys, mutation variables, título ou logs.

Logout explícito, troca de pessoa, conclusão e abandono limpam o fluxo; requisições canceladas/tardias não restauram dados. Sessão expirada suspende a tentativa e somente a mesma pessoa pode recuperá-la. Não há reenvio automático após login. Refresh/aba fechada perde o contexto e orienta reabrir o link original. Autenticação sem convite continua em `/`; retorno com convite usa somente a rota fixa `/invitations`.

Falha de rede/5xx/CSRF/429 preserva entrada/chave para retry explícito. 409 descarta tentativa e exige nova prévia/decisão/chave. Aceite invalida consultas Spaces e navega ao detalhe autorizado; recusa oferece retorno à lista sem membership. Headers/metadados/fetch usam no-referrer. Testes que manipulam convites não retêm traces/screenshots/vídeos.

## Persistência e ambientes

Migration aditiva: `1791585518092-Card003InvitationResponses.ts`, gerada e revisada na fase 4. Amplia somente `CHK_space_command_receipts_operation` com RESPOND_INVITATION. Nenhuma migration anterior foi alterada. Tokens em claro não são persistidos.

Upgrade sobre CARD-002, down/up com recibos antigos e recusa atômica de down quando há recibos RESPOND_INVITATION foram testados. O down não apaga histórico: a constraint anterior rejeita esses registros e a transação reverte.

Migration aplicada e validada somente no PostgreSQL descartável da porta 55432 nesta rodada. Antes de usar a resposta de convites no desenvolvimento, aplicar as migrations pelo fluxo existente. Nenhum banco de desenvolvimento foi alterado pelo assistente.

## Evidências locais

- API: 223 testes unitários e 152 HTTP/PostgreSQL aprovados; lint, formatação, tipos e build aprovados.
- Web: 33 testes Playwright locais aprovados: 11 jornadas e nove testes de cliente/estado do CARD-003, mais 13 regressões CARD-001/002. Lint, formatação, tipos e build aprovados.
- A01–A20 rastreados no guia do workspace: preview sem escrita, expiração controlada, ator/estado/vaga, replay, CAS, rollback, migration, autenticação e proteção do segredo.
- Testes Web reais recuperam resposta perdida de ACCEPT/REJECT com mesma entrada/chave e `replayed: true`, sem falsa confirmação.
- Mobile/teclado, conflito, CSRF/429, reautenticação, refresh e resposta tardia após revogação/troca de pessoa cobertos.
- Revisão de migration, composição OpenAPI e `git diff --check` concluída.

A CI API executa lint, formatação, testes unitários, build/testes PostgreSQL/HTTP e tipos. A CI Web executa lint, formatação, tipos e build. Playwright permanece checkpoint local, conforme arquitetura 45 §31.4; não atribuir seus resultados à CI Web.

## Entrada e limites do CARD-004

- Segundo participante possui membership real; lista/detalhe seguem autorização por membership.
- Recusa e posse do link não autorizam consultas normais do espaço.
- Convites operacionais permanecem visíveis somente ao criador; o segundo participante não recebe convite/link do criador no detalhe.
- Espaço pessoal permanece independente e utilizável. Não existe limite artificial de um compartilhado por pessoa.
- Seleção global de espaço não concede permissão. Cada comando/query continua revalidando o acesso no servidor.
- CARD-004 implementa SpaceSwitcher/contexto global e isolamento de consultas. CARD-003 não seleciona silenciosamente um contexto global.
- Regras financeiras, encerramento/expulsão/troca de membros, envio por e-mail e novos provedores de autenticação permanecem fora desta entrega.
