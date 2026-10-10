# CARD-004 — contrato de entrada para o CARD-005

Implementação iniciada em 09/10/2026 e retomada em 10/10/2026. Integração e evidências finais são registradas no acompanhamento oficial.

- [Refinamento](https://drive.google.com/file/d/1A3Zw_7DMq2LJALJQAUfS1tRdLCnsYMQ1/view).
- [Acompanhamento em cinco etapas](https://drive.google.com/file/d/1uJzWWokZbgviBiNmFEXCNJlKFjCTk69E/view).
- [Fases e matriz A01–A20](https://drive.google.com/file/d/1niKTawXcoeLdKVLgONHmYvGeZGNyoYmR/view).
- [Roteiro de teste pela interface](https://drive.google.com/file/d/11-axhW7J1f8Uv4j2-I-EJcsustMLPtT9/view).

## Porta pública de Spaces

`src/modules/spaces/application/ports/public/space-access.port.ts` expõe o token `SPACE_ACCESS_PORT` e a interface SpaceAccessPort:

- `assertCanRead(actorId: PersonId, spaceId: SpaceId)`.
- `assertCanWrite(actorId: PersonId, spaceId: SpaceId)`.

Ambas retornam somente `{ spaceId, type, status, actorMemberId }`, com identidades e valores escalares. `actorMemberId` é null no pessoal. SpacesModule exporta o token público; adapter, query privada, repositories, agregado e entidades permanecem internos.

O dono acessa seu pessoal; membro ACTIVE acessa seu compartilhado, inclusive com apenas o criador. Terceiro e espaço inexistente recebem o mesmo SPACE_NOT_FOUND. A leitura de CLOSING/CLOSED é preservada para participação válida; a escrita normal exige ACTIVE e retorna SPACE_NOT_ACTIVE após verificar acesso. Não há cache positivo de autorização entre operações.

GetSpaceDetailsQuery consome a porta e mantém filtro ator/espaço na leitura final. Emitir/substituir convite verifica escrita dentro da UnitOfWork existente somente para novo efeito, depois do recibo e CAS. Replay continua revalidando suas próprias condições, sem ser bloqueado como nova escrita. Papel de emissor, versão e invariantes do agregado permanecem obrigatórios. Preview e resposta ao convite conservam autorização própria e não exigem participação prévia.

O adapter usa EntityManagerProvider de Spaces, observando o mesmo contexto transacional e rollback. Módulos futuros importam a porta pública e passam o ator da sessão e o destino explícito; não leem tabelas/repositories de Spaces. A porta não substitui as regras próprias de um comando financeiro ou sua restrição a SHARED.

## Contexto cliente e captura

SpaceContextProvider fica dentro de AuthGate e QueryProvider. Identidade do contexto combina pessoa e época da sessão; cada transição tem geração monotônica. Estados: initializing, switching, ready, error e session. `activeSpaceId` e `currentSpace` só representam contexto pronto após validação autorizada.

`useSpaceContext()` expõe seleção, retry, limpeza, resumo atual e captura. `capture()` fornece `{ personId, spaceId, generation }` somente quando pronto. Novas intenções dependentes do espaço capturam esse destino na abertura e conservam ator, entrada e chave até resolver a tentativa. Não consultam um ID global mutável no envio ou retry. Nenhum formulário financeiro fictício foi criado.

Preferência da aba: `sessionStorage['prospera-mais:space-context:v1:<personId>']`, contendo apenas UUID. Restauração valida sessão, lista e detalhe antes de publicar o destino; fallback pessoal é validado e anunciado. Storage indisponível permite uso em memória. Logout confirmado, 401 e mudança de pessoa limpam preferência/contexto/cache; falha temporária de sessão não é prova de logout. Não há preferência no servidor ou sincronização entre dispositivos/abas.

## Cache e tentativas

- Lista global: `['spaces', personId, 'list']`.
- Detalhe: `['spaces', personId, 'detail', spaceId]`; leituras futuras acrescentam seus parâmetros.
- Troca cancela consultas anteriores, oculta composição anterior e revalida o destino inclusive ao retornar a uma key já aquecida. Sem placeholder de outro espaço.
- Pessoa, época e geração impedem publicação, navegação ou gravação de preferência por respostas tardias, inclusive A → B → A.
- Perda comprovada de acesso limpa a key afetada, atualiza a lista e valida o pessoal. CSRF e papel do emissor não são perda geral de participação. Rede/5xx/429 oferecem retry explícito sem presumir revogação.
- Escritas conservam destino/entrada/chave e invalidam apenas lista da pessoa e detalhe do destino original. Seletor bloqueia envio e tentativa incerta. Resultado tardio não muda seleção nem mostra sucesso em outra composição.
- Token/link de convite permanece volátil no fluxo do CARD-003 e nos componentes de criação/emissão; sair/trocar limpa o link transitório. Não vai para storage, keys ou cache persistido. Recuperação do convite para a mesma pessoa após 401 continua prevista no CARD-003.

## Navegação e interface

SpaceSwitcher fica no topo autenticado, com controle semântico rotulado Espaço atual, pessoal primeiro, todos os compartilhados acessíveis, tipo/status e entrada de criação. Nomes iguais usam identidade UUID. Loading, erro/retry e bloqueio da troca são anunciados; contexto permanece identificável em desktop/mobile.

Home e lista preservam rota na troca. Detalhe troca sua URL somente depois da validação do destino; URL direta autorizada sincroniza contexto, e alvo alheio mostra indisponibilidade sem selecioná-lo. Mudança de rota durante uma resposta pendente impede navegação atrasada. Criação/aceite chegam ao detalhe autorizado; preview/login/recusa não selecionam o espaço convidado. `/invitations` mantém seu fluxo público especial. `/spaces/new` conserva nome não enviado na troca livre; criação não ganha um espaço pai.

Resumo/status do contexto acompanha o detalhe confirmado do destino atual. Novas escritas normais em CLOSING/CLOSED continuam negadas no servidor. Operações de encerramento e participantes históricos permanecem para seus próprios cards.

## Contrato, ambiente e evidências

Nenhum endpoint, header de preferência, campo Auth, evento de domínio ou migration novo. HTTP/OpenAPI Auth/Spaces/Invitations permanece compatível com CARD-003. Antes do teste manual, aplicar as migrations existentes no banco de desenvolvimento conforme fluxo do projeto; nenhum banco de desenvolvimento foi alterado nesta execução.

API: commit `d934cb8`, 235 unitários e 160 HTTP/PostgreSQL aprovados; lint/formatação/tipos/build/diff e revisão aprovados. Testes provam dono/membership/terceiro, estado, replay/CAS, revogação controlada, intervalo entre autorização/leitura, consumidor externo da porta e rollback na mesma transação.

Web: etapa 3 `9d0232e`; interface final validada com 56 testes Playwright aprovados em execuções complementares (45 regressões/contexto + 11 jornadas novas), com geração/época/storage/cache/captura/fallback, desktop/mobile/teclado e regressões 001–003. Lint/formatação/tipos/build/diff e revisão final aprovados. A matriz oficial registra commits e resultados da integração; CI dos PRs deve estar aprovada no HEAD final antes do merge.

PostgreSQL descartável da porta 55432. CI API executa lint/formatação/unitários/build/HTTP/PostgreSQL/tipos; CI Web executa lint/formatação/tipos/build. Playwright permanece checkpoint local, sem traces/screenshots/vídeos das jornadas com segredos.

## Próximo card

CARD-005, ConfigureDefaultSettlementRule / UC-FIN-040: configurar regra padrão de acerto de SHARED, como sugestão para novos compromissos/pendências, sem mover retroativamente pendências existentes. Refinar seu domínio/contrato antes de implementar. Reutilizar a porta de acesso e a captura do destino; não guardar a preferência UI no agregado nem antecipar regras financeiras neste card.
