# Tasks: Dashboard Operacional de Coletas

**Input**: Documentos de design de `/specs/007-dashboard-coletas/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/dashboard-api.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos distintos, sem dependências entre si)
- **[Story]**: User story correspondente (US1–US4)
- Caminhos de arquivo exatos incluídos em todas as descrições

---

## Phase 1: Setup

**Objetivo**: Remover o arquivo legado que conflita com a rota migrada para o grupo `(protected)`

- [X] T001 Remover o arquivo legado `src/app/dashboard/page.tsx` para eliminar conflito de rota com a versão migrada em `src/app/(protected)/dashboard/page.tsx`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Objetivo**: Tipos e service compartilhados por todas as user stories

**⚠️ CRÍTICO**: Nenhuma user story pode ser iniciada antes desta fase estar completa

- [X] T002 [P] Criar `src/lib/types/dashboard.ts` com as interfaces `ActivityEntry`, `ShipmentSummary` e `ActivityByDate` conforme definido em `specs/007-dashboard-coletas/data-model.md`
- [X] T003 Criar `src/lib/services/dashboard.service.ts` com as funções `getCollectorDashboardShipments(userFullName: string): Promise<ShipmentWithStatus[]>` (query OR com DISTINCT e order por `arrival_date ASC`) e `getAdminDashboardActivities(): Promise<ActivityByDate[]>` (agrupamento server-side por `arrival_date DESC` e `responsible`) conforme `specs/007-dashboard-coletas/data-model.md`

**Checkpoint**: Tipos e service prontos — implementação das user stories pode começar

---

## Phase 3: User Story 1 — Coletor Visualiza Encomendas no Dashboard (Prioridade: P1) 🎯 MVP

**Objetivo**: Coletor autenticado vê encomendas "Pendente de Coleta" e as sob sua responsabilidade, agrupadas por status com destaque cromático, ordenadas por data de chegada

**Teste Independente**: Logar como coletor → acessar `/dashboard` → verificar que encomendas "Pendente de Coleta" e com `responsible` igual ao nome do usuário aparecem agrupadas por status com as cores corretas (`indicative_color`) e ordenadas por `arrival_date ASC`

### Implementação da User Story 1

- [X] T004 [P] [US1] Criar `src/app/api/dashboard/shipments/route.ts` com GET que extrai `full_name` do JWT via `resolveAuthenticatedUser`, filtra `is_active=true` com condição OR (`shipment_status.name ILIKE 'pendente de coleta'` OU `responsible ILIKE :fullName`), aplica deduplicação via DISTINCT, ordena por `arrival_date ASC` e retorna `{ success: true, data: { items, total } }` conforme `specs/007-dashboard-coletas/contracts/dashboard-api.md`
- [X] T005 [US1] Criar `src/components/dashboard/CollectorDashboard.tsx` com props `{ userFullName: string }` que busca dados via `GET /api/dashboard/shipments`, agrupa encomendas client-side por status priorizando "Pendente de Coleta", renderiza cards com destaque cromático via `indicative_color`, exibe mensagem de estado vazio quando `items.length === 0` (FR-016) e mantém estado `selectedShipment: ShipmentWithStatus | null` para integração futura com o modal (US2)
- [X] T006 [US1] Criar `src/app/(protected)/dashboard/page.tsx` com `export const dynamic = 'force-dynamic'`, autenticação via `resolveAuthenticatedUser`, renderização de `CollectorDashboard` para coletores e placeholder `<p>Painel administrativo</p>` para administradores (substituído na US4/T012)

**Checkpoint**: Coletor consegue ver a listagem de encomendas com agrupamento por status, cores corretas e mensagem de estado vazio

---

## Phase 4: User Story 2 — Visualização Rápida de Encomenda via Popup (Prioridade: P2)

**Objetivo**: Coletor abre popup com dados completos da encomenda (FR-007) e acessa link de edição sem sair do dashboard

**Teste Independente**: Clicar em qualquer card no dashboard → popup abre em < 500ms (SC-003) → exibe código, transportadora, responsável, destino, `volume_count`, `arrival_date`, `pickup_date`, status com `indicative_color` e observações → clicar "Editar" → ser redirecionado para `/encomendas/[id]` → fechar popup sem recarregar listagem

### Implementação da User Story 2

- [X] T007 [US2] Criar `src/components/dashboard/ShipmentQuickViewModal.tsx` com props `{ shipment: ShipmentWithStatus; onClose: () => void }`, overlay `fixed inset-0 bg-black/50`, exibição dos campos de FR-007 (código, transportadora, responsável, destino, `volume_count`, `arrival_date`, `pickup_date`, status com badge colorido via `indicative_color`, observações), `role="dialog"` com `aria-modal="true"` e `aria-label="Visualização rápida da encomenda"`, fechamento ao clicar no overlay ou no botão de fechar e `<Link href={'/encomendas/${shipment.id}'} aria-label="Editar encomenda ${shipment.code}">Editar</Link>`
- [X] T008 [US2] Atualizar `src/components/dashboard/CollectorDashboard.tsx` para importar `ShipmentQuickViewModal`, conectar o estado `selectedShipment` ao clique em cada card e renderizar o modal quando `selectedShipment !== null` com `onClose` que chama `setSelectedShipment(null)` sem disparar novo fetch da API (FR-009)

**Checkpoint**: Popup abre ao clicar em qualquer card, exibe todos os dados de FR-007 e fecha sem recarregar o dashboard

---

## Phase 5: User Story 3 — Edição de Coleta pelo Coletor a partir do Dashboard (Prioridade: P3)

**Objetivo**: Coletor acessa a tela de edição existente via link do popup e o dashboard reflete o status atualizado ao retornar

**Nota de Implementação**: Esta user story é implementada pela combinação de:
- US2/T007: link `<Link href="/encomendas/[id]">` no `ShipmentQuickViewModal`
- US1/T006: `export const dynamic = 'force-dynamic'` na página garante dados frescos ao retornar
- Feature 006: tela de edição em `/encomendas/[id]` com restrições de perfil para coletor já implementadas

**Teste Independente**: Logar como coletor → abrir popup de uma encomenda → clicar "Editar" → verificar que apenas Status, Observações e Quantidade coletada são editáveis → confirmar edição com status de exceção → retornar ao dashboard → verificar que a encomenda reflete o novo status (ou desaparece se não satisfaz mais FR-001/FR-002)

### Implementação da User Story 3

- [X] T009 [US3] Adicionar `aria-label="Fechar"` ao botão de fechar e verificar que o `<Link>` de edição em `src/components/dashboard/ShipmentQuickViewModal.tsx` inclui `aria-label="Editar encomenda ${shipment.code}"`, garantindo conformidade WCAG AA e que o fluxo dashboard → popup → edição respeita SC-004 (≤3 interações: clique no card → popup → botão Editar)

**Checkpoint**: Fluxo completo do coletor — dashboard → popup → edição → retorno com status atualizado — funciona de ponta a ponta com acessibilidade correta

---

## Phase 6: User Story 4 — Dashboard Administrativo de Atividades de Coletores (Prioridade: P4)

**Objetivo**: Administrador vê painel de atividades por coletor agrupado por `arrival_date DESC`, com links de edição completa para cada encomenda

**Teste Independente**: Logar como administrador → acessar `/dashboard` → verificar que o painel de atividades é exibido (não a listagem do coletor) → encomendas organizadas por data de chegada com coletores, quantidades por status e observações → clicar em encomenda → ser redirecionado para `/encomendas/[id]`

### Implementação da User Story 4

- [X] T010 [P] [US4] Criar `src/app/api/dashboard/activities/route.ts` com GET restrito a administradores via `resolveAdminUser`, filtra `is_active=true`, faz join com `shipment_status`, ordena por `arrival_date DESC`, agrupa server-side por `arrival_date` e depois por `responsible`, retorna `{ success: true, data: { activities: ActivityByDate[] } }` conforme `specs/007-dashboard-coletas/contracts/dashboard-api.md`
- [X] T011 [US4] Criar `src/components/dashboard/AdminDashboard.tsx` sem props que busca dados via `GET /api/dashboard/activities`, renderiza seções por `arrival_date` com lista de coletores e suas encomendas (status com badge colorido via `indicative_color`), `<Link href={'/encomendas/${shipment.id}'} aria-label="Editar encomenda ${shipment.code}">` para cada encomenda e mensagem de estado vazio quando `activities.length === 0` (FR-016)
- [X] T012 [US4] Atualizar `src/app/(protected)/dashboard/page.tsx` para importar `AdminDashboard` e substituir o placeholder da Phase 3 pela renderização de `<AdminDashboard />` quando o perfil do usuário autenticado for administrador

**Checkpoint**: Administrador consegue ver o painel de atividades com dados agrupados por data, coletores e links de edição

---

## Phase 7: Polish & Preocupações Transversais

**Objetivo**: Revisão de acessibilidade e responsividade em todos os componentes do dashboard

- [X] T013 [P] Revisar acessibilidade WCAG AA em `src/components/dashboard/CollectorDashboard.tsx`, `src/components/dashboard/AdminDashboard.tsx` e `src/components/dashboard/ShipmentQuickViewModal.tsx`: verificar `aria-label` em todos os elementos interativos, `role="dialog"` e `aria-modal="true"` no modal, e contraste cromático adequado para badges com `indicative_color`
- [X] T014 [P] Verificar responsividade mobile-first (320px mínimo) em todos os componentes de `src/components/dashboard/` e em `src/app/(protected)/dashboard/page.tsx` usando classes Tailwind responsivas (`sm:`, `md:`, `lg:`)

---

## Dependências & Ordem de Execução

### Dependências entre Fases

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende do Setup — BLOQUEIA todas as user stories
- **US1 (Phase 3)**: Depende do Foundational (T002, T003)
- **US2 (Phase 4)**: Depende de US1 (T005 precisa existir para T008 atualizá-lo)
- **US3 (Phase 5)**: Depende de US2 (T007 precisa existir para T009 ajustá-lo)
- **US4 (Phase 6)**: Depende do Foundational (T003) e de US1 (T006 precisa existir para T012)
- **Polish (Phase 7)**: Depende de US2 (T008) e US4 (T011) — todos os componentes devem existir

### Dependências entre User Stories

- **US1 (P1)**: Pode começar após Phase 2 — sem dependências de outras stories
- **US2 (P2)**: Depende de US1 (CollectorDashboard do T005 deve existir)
- **US3 (P3)**: Depende de US2 (ShipmentQuickViewModal do T007 deve existir)
- **US4 (P4)**: Pode iniciar em paralelo com US1 após Phase 2 (T010 depende apenas de T003)

### Dentro de Cada User Story

- Tipos antes de services: T002 antes de T003
- Service antes de API route: T003 antes de T004 e T010
- API route antes do componente (para validar integração): T004 antes de T005; T010 antes de T011
- Componente antes da page: T005 antes de T006; T011 antes de T012
- Modal antes da integração: T007 antes de T008; T008 antes de T009

### Oportunidades de Paralelismo

- T002 [P] pode executar em paralelo com outras tarefas de Foundational (somente T002 nesta fase)
- T004 [P] e T005 podem ser iniciados em paralelo dentro da US1 (arquivos distintos)
- T010 [P] pode ser iniciado em paralelo com US1 após T003 estar completo
- T013 [P] e T014 [P] podem executar em paralelo na fase de polish

---

## Exemplo de Paralelismo: User Story 1

```bash
# T004 e T005 podem executar em paralelo (arquivos distintos, dependem só de T003):
Tarefa A: "API route shipments em src/app/api/dashboard/shipments/route.ts"
Tarefa B: "CollectorDashboard em src/components/dashboard/CollectorDashboard.tsx"

# T006 aguarda T004 e T005 estarem completos:
Tarefa: "Page dashboard em src/app/(protected)/dashboard/page.tsx"
```

## Exemplo de Paralelismo: US4 em paralelo com US1

```bash
# Após T003 estar completo, T004 (US1) e T010 (US4) podem executar em paralelo:
Dev A: "src/app/api/dashboard/shipments/route.ts" → T005 → T006 → T007 → T008 → T009
Dev B: "src/app/api/dashboard/activities/route.ts" → T011 → T012
```

---

## Estratégia de Implementação

### MVP — Apenas User Story 1

1. Completar Phase 1: Setup (T001)
2. Completar Phase 2: Foundational (T002, T003)
3. Completar Phase 3: US1 (T004, T005, T006)
4. **PARAR E VALIDAR**: Logar como coletor, verificar listagem de encomendas no dashboard
5. Deploy/demo se aprovado

### Entrega Incremental

1. Setup + Foundational → Base pronta (T001–T003)
2. US1 → Dashboard do coletor funcional → Validar → Demo (MVP!)
3. US2 → Popup de visualização rápida → Validar → Demo
4. US3 → Acessibilidade do fluxo de edição → Validar → Demo
5. US4 → Dashboard administrativo → Validar → Demo
6. Polish → Acessibilidade e responsividade final → Deploy

### Estratégia com Paralelismo de Equipe

Com múltiplos desenvolvedores após Phase 2:
- Dev A: T004 → T005 → T006 → T007 → T008 → T009
- Dev B: T010 → T011 → T012 (pode começar junto com Dev A após T003)
- Dev A e Dev B: T013 e T014 em paralelo

---

## Notas

- [P] = arquivos distintos, sem dependências entre si na fase — podem ser executados em paralelo
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Zero testes — diretiva constitucional absoluta do projeto
- Cada user story deve ser completável e testável manualmente de forma independente
- Commitar após cada tarefa ou grupo lógico de tarefas
- Parar em cada checkpoint para validar a story manualmente antes de avançar
- O arquivo `src/app/dashboard/page.tsx` legado DEVE ser removido em T001 antes de criar o novo em `src/app/(protected)/dashboard/page.tsx` (T006)
