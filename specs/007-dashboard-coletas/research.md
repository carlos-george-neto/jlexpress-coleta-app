# Research: Dashboard Operacional de Coletas

**Branch**: `007-dashboard-coletas` | **Data**: 2026-06-07

## Decisão 1 — Localização da Rota `/dashboard`

**Decisão**: Migrar `src/app/dashboard/page.tsx` para `src/app/(protected)/dashboard/page.tsx`

**Racional**: O arquivo atual em `src/app/dashboard/page.tsx` gerencia autenticação
e importa o componente `Header` de forma independente. Todas as demais páginas
protegidas do projeto vivem em `src/app/(protected)/`, onde o `layout.tsx` cuida
de autenticação e renderiza o Header automaticamente. Manter o dashboard fora do
grupo `(protected)` criaria inconsistência arquitetural e duplicação de código.
O Next.js route groups (entre parênteses) não alteram a URL pública, então a rota
continua sendo `/dashboard`.

**Alternativas consideradas**:
- Manter em `src/app/dashboard/` com lógica própria — rejeitado por inconsistência com o padrão estabelecido

---

## Decisão 2 — Endpoints de API Dedicados

**Decisão**: Criar `/api/dashboard/shipments` (coletor) e `/api/dashboard/activities` (admin)
ao invés de reutilizar `/api/shipments`

**Racional**: O dashboard do coletor exige uma query UNION server-side —
`status.name ILIKE 'Pendente de Coleta' OR responsible ILIKE :userFullName` — com
deduplicação via `DISTINCT`. O endpoint `/api/shipments` aceita filtros conjuntivos
(AND), não disjuntivos (OR), e não expõe o mecanismo de correspondência case-insensitive
por nome de usuário. O painel administrativo exige dados agregados por `arrival_date`
e `responsible`, que não são suportados pelo endpoint existente. Criar endpoints
dedicados isola a lógica do dashboard e mantém o endpoint de lista inalterado.

**Alternativas consideradas**:
- Múltiplas chamadas ao `/api/shipments` + deduplicação no cliente — rejeitado por performance
  e por expor lógica de negócio no frontend
- Adicionar parâmetros de dashboard ao `/api/shipments` — rejeitado por poluir a interface
  da API de uso geral

---

## Decisão 3 — Identificação do Status "Pendente de Coleta"

**Decisão**: Buscar o `status_id` cujo `name ILIKE 'pendente de coleta'` via join no
`dashboard.service.ts`, em tempo de execução

**Racional**: O ID do status "Pendente de Coleta" é gerado pelo banco de dados e varia
entre ambientes. O nome é o identificador semântico estável. A query usa `ILIKE` para
tolerância a maiúsculas/minúsculas. Caso o status não exista, a query retorna apenas
encomendas do responsável logado, sem falhar.

**Alternativas consideradas**:
- Hardcode do `status_id` — rejeitado por fragilidade entre ambientes
- Novo campo `is_pending_collection` em `shipment_status` — rejeitado por YAGNI

---

## Decisão 4 — Padrão de Popup de Visualização Rápida

**Decisão**: Modal com overlay `fixed inset-0 bg-black/50` — mesmo padrão do modal
de exclusão em `src/app/(protected)/encomendas/[id]/page.tsx`

**Racional**: O projeto já tem um padrão de modal implementado e aprovado. Reutilizá-lo
garante consistência visual e zero dependências novas. O modal fecha ao clicar no overlay
ou no botão de fechar, sem recarregar o dashboard (FR-009).

**Alternativas consideradas**:
- Biblioteca de modal (Radix UI, Headless UI) — rejeitado por violar a regra de zero dependências novas

---

## Decisão 5 — Acesso à Tela de Edição a partir do Dashboard

**Decisão**: O link "Editar" no popup navega para `/encomendas/[id]` existente, sem
modificações naquela página

**Racional**: O spec confirma explicitamente: "A tela de edição acessada via dashboard
é a mesma tela de edição da feature 006, respeitando as permissões do perfil." O service
`updateShipment` já aplica restrições por role (coletor só edita status, observações e
quantidade coletada). Criar uma tela de edição separada violaria YAGNI.

**Alternativas consideradas**:
- Tela de edição dedicada para o dashboard — rejeitado por YAGNI e por conflito com o spec

---

## Decisão 6 — Ordenação e Agrupamento no Dashboard do Coletor

**Decisão**: Ordenar server-side por `arrival_date ASC`. Agrupar client-side por status,
com "Pendente de Coleta" exibido em primeiro lugar.

**Racional**: O spec (FR-004, FR-006) exige ordenação por data de chegada E separação
visual por status com "Pendente de Coleta" com prioridade superior. A ordenação primária
é por data (server-side para performance). O agrupamento visual por status é feito no
frontend, onde o `CollectorDashboard` agrupa os resultados por `shipment_status.name`
e renderiza o grupo "Pendente de Coleta" antes dos demais.

**Alternativas consideradas**:
- Ordenação por status_id + arrival_date no banco — rejeitado porque a ordem dos status_ids
  não corresponde à prioridade semântica desejada

---

## Decisão 7 — Deduplicação de Encomendas no Dashboard do Coletor

**Decisão**: Deduplicação via `DISTINCT` na query SQL server-side

**Racional**: Uma encomenda pode satisfazer ambos os critérios (status = "Pendente de Coleta"
AND responsible = usuário logado). O `DISTINCT` no nível de SQL é mais eficiente do que
deduplicação por ID no JavaScript. Atende FR-003 e SC-005.

**Alternativas consideradas**:
- Deduplicação por `id` no JavaScript após duas queries separadas — rejeitado por complexidade
  desnecessária e pior performance

---

## Decisão 8 — Painel Administrativo: Sem Filtro de Período

**Decisão**: O painel administrativo exibe todas as encomendas ativas, sem filtro de período,
ordenadas por `arrival_date DESC` e agrupadas por data no frontend

**Racional**: O spec confirma explicitamente: "O painel administrativo não precisa de filtros
por período na versão inicial — exibe todas as atividades disponíveis ordenadas por data de
chegada." O agrupamento por data ocorre no service, retornando `ActivityByDate[]`.

**Alternativas consideradas**:
- Filtro de período (últimos 30 dias) — rejeitado por conflito com o spec

---

## Decisão 9 — Verificação pós-design da Constituição

**Resultado**: APROVADO. O design final não introduz violações adicionais. Todos os
componentes novos seguem TypeScript strict, mobile-first, zero dependências novas
e sem lógica de negócio em componentes de UI.
