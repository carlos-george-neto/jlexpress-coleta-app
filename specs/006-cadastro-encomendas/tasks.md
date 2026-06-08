# Tasks: Cadastro de Encomendas

**Input**: Design documents from `/specs/006-cadastro-encomendas/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Nenhum — diretiva absoluta da constituição do projeto.

**Organization**: Tarefas agrupadas por história de usuário para implementação e validação independentes.

## Formato: `[ID] [P?] [Story?] Descrição`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências incompletas)
- **[Story]**: A qual história de usuário a tarefa pertence (US1–US6)
- Caminhos exatos de arquivo incluídos em todas as descrições

---

## Phase 1: Setup (Migração e Infraestrutura de Banco)

**Purpose**: Criar as tabelas `shipments` e `shipment_audit_log` no Supabase antes de qualquer implementação de código.

- [ ] T001 Aplicar migration `supabase/migrations/20260607000001_create_shipments.sql` no Supabase — via CLI (`supabase db push`) ou colando o conteúdo do arquivo no Supabase Dashboard → SQL Editor; cria tabelas `public.shipments` e `public.shipment_audit_log` com índices, trigger `updated_at` e políticas RLS; verificar no Table Editor que ambas as tabelas existem no schema `public`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Tipos TypeScript, schemas Zod e layout protegido que TODAS as histórias dependem.

**⚠️ CRÍTICO**: Nenhuma história de usuário pode começar sem esta fase completa.

- [X] T002 [P] Criar interfaces e tipos TypeScript da feature em `src/lib/types/shipment.ts` — `Shipment`, `ShipmentWithStatus`, `ShipmentAuditLog`, `ShipmentAuditAction`, `ListShipmentsQuery` conforme data-model.md
- [X] T003 [P] Criar schemas Zod de validação em `src/lib/schemas/shipment.ts` — schemas de criação (CreateShipmentSchema), atualização admin (UpdateShipmentSchema) e atualização collector (UpdateShipmentStatusSchema) com todas as regras de validação do spec (datas, campos condicionais, volume_count >= 1)
- [X] T004 Criar layout de rota protegida para admin e collector em `src/app/(protected)/layout.tsx` — verifica autenticação via Supabase, redireciona para `/login` se não autenticado, aceita qualquer role ativa, renderiza `<Header role={profile.role} />`

**Checkpoint**: Fundação pronta — implementação das histórias de usuário pode começar.

---

## Phase 3: User Story 1 — Cadastrar Nova Encomenda (Priority: P1) 🎯 MVP

**Goal**: Administrador consegue registrar uma nova encomenda com todos os campos obrigatórios, validação client-side e persistência via API.

**Independent Test**: Acessar `/encomendas/nova` como admin, preencher todos os campos obrigatórios e confirmar. Verificar que a encomenda aparece na listagem e que a criação foi registrada na tabela `shipment_audit_log` com `action = 'CREATE'`.

- [X] T005 [P] [US1] Implementar funções `createShipment` e `getShipmentById` inicializando o arquivo de serviço em `src/lib/services/shipment.service.ts` — `createShipment` valida unicidade code+carrier (inclusive inativos), campos condicionais (observations, collected_count), status ativo; registra `CREATE` no audit log via supabaseAdmin (fire-and-forget com try/catch)
- [X] T006 [P] [US1] Criar componente `ShipmentForm` em `src/components/shipments/ShipmentForm.tsx` — formulário completo com todos os campos do FR-001 (code, carrier, volume_count, arrival_date, pickup_date, destination, responsible, status_id, observations, collected_count), campos condicionais `observations` e `collected_count` aparecem/somem dinamicamente por status selecionado (requires_observation e is_exception), validação client-side inline, suporta modo criação e modo edição via prop `mode: 'create' | 'edit'`
- [X] T007 [US1] Criar API route POST `/api/shipments` em `src/app/api/shipments/route.ts` — valida token de admin via `getAdminUser()`, chama `createShipment` do serviço, retorna 201 com o shipment criado; respostas de erro conforme contratos da api.md (400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 INSUFFICIENT_PERMISSIONS, 409 DUPLICATE_CODE_CARRIER)
- [X] T008 [US1] Criar página de cadastro de nova encomenda em `src/app/(protected)/encomendas/nova/page.tsx` — redireciona collector para `/encomendas`, renderiza `ShipmentForm` em `mode='create'`, ao submeter chama POST `/api/shipments` e redireciona para `/encomendas` em caso de sucesso
- [X] T009 [P] [US1] Atualizar `src/app/dashboard/page.tsx` para adicionar card/link "Gerenciar Encomendas" → `/encomendas` visível para todos os usuários autenticados
- [X] T010 [P] [US1] Atualizar `src/components/layout/Header.tsx` para adicionar link de navegação "Encomendas" visível quando `role === 'admin' || role === 'collector'`

**Checkpoint**: US1 completa — admin consegue cadastrar encomendas; criação aparece na auditoria.

---

## Phase 4: User Story 2 — Listar, Buscar e Filtrar Encomendas (Priority: P2)

**Goal**: Qualquer usuário autenticado visualiza a listagem paginada de encomendas ativas com busca textual e filtros combinados.

**Independent Test**: Cadastrar ao menos 3 encomendas com características distintas. Verificar busca por código, filtro por status, filtro por intervalo de data e navegação de paginação retornam resultados corretos.

- [X] T011 [US2] Adicionar função `listShipments(query: ListShipmentsQuery)` a `src/lib/services/shipment.service.ts` — busca encomendas ativas com join em `shipment_status`, filtros combinados (search textual em code/carrier/destination/responsible via ilike, status_id, carrier exato, arrival_date_from/to), ordenação configurável, paginação de 20 itens por página
- [X] T012 [US2] Adicionar handler GET à `src/app/api/shipments/route.ts` — valida autenticação via `getAuthenticatedUser()`, parseia e sanitiza query params, chama `listShipments`, retorna 200 com items e pagination conforme contratos da api.md
- [X] T013 [P] [US2] Criar componente `ShipmentFilters` em `src/components/shipments/ShipmentFilters.tsx` — input de busca textual (debounced 300ms), select de status (apenas status ativos), input de transportadora (texto), date range (data chegada de/até); emite mudanças via callback `onFiltersChange`
- [X] T014 [P] [US2] Criar componente `ShipmentList` em `src/components/shipments/ShipmentList.tsx` — tabela responsiva com colunas Código, Transportadora, Destino, Responsável, Status (badge colorido via `indicative_color`), Data Chegada, Data Coleta; cada linha é link para `/encomendas/[id]`; exibe estado vazio com mensagem "Nenhuma encomenda encontrada" quando resultado for zero
- [X] T015 [US2] Criar página de listagem em `src/app/(protected)/encomendas/page.tsx` — botão "+ Nova Encomenda" visível apenas para admin, compõe `ShipmentFilters` e `ShipmentList`, gerencia estado de filtros e paginação via URL search params (Next.js App Router), carrega encomendas via GET `/api/shipments`

**Checkpoint**: US2 completa — admin e collector visualizam e filtram encomendas.

---

## Phase 5: User Story 3 — Editar Encomenda — Dados Completos (Priority: P3)

**Goal**: Administrador consegue alterar quaisquer campos de uma encomenda existente com as mesmas validações do cadastro.

**Independent Test**: Como admin, acessar uma encomenda existente via `/encomendas/[id]`, alterar múltiplos campos (incluindo datas e status) e confirmar. Verificar dados atualizados na listagem e evento `FULL_UPDATE` registrado na auditoria com valores anteriores e novos.

- [X] T016 [US3] Adicionar função `updateShipment(id, params, performedBy, role)` a `src/lib/services/shipment.service.ts` — para admin: valida todos os campos com as mesmas regras do createShipment, atualiza o registro e registra `FULL_UPDATE` no audit log com old_data e new_data snapshots completos
- [X] T017 [US3] Criar API route GET e PATCH para encomenda individual em `src/app/api/shipments/[shipmentId]/route.ts` — GET retorna ShipmentWithStatus para qualquer usuário autenticado; PATCH para admin chama `updateShipment` com role='admin' e registra FULL_UPDATE; retorna erros conforme api.md (400, 401, 403, 404, 409, 422)
- [X] T018 [US3] Criar página de edição em `src/app/(protected)/encomendas/[id]/page.tsx` — para admin: carrega encomenda via GET `/api/shipments/[id]`, renderiza `ShipmentForm` em `mode='edit'` com dados pré-preenchidos, ao submeter chama PATCH `/api/shipments/[id]` e exibe feedback de sucesso/erro

**Checkpoint**: US3 completa — admin consegue editar dados completos de encomendas.

---

## Phase 6: User Story 4 — Registrar Coleta — Atualizar Status (Priority: P4)

**Goal**: Coletor consegue atualizar o status de uma encomenda; campos `observations` e `collected_count` tornam-se obrigatórios para status de exceção.

**Independent Test**: Como collector, acessar uma encomenda via `/encomendas/[id]`, verificar que apenas o campo de status é editável, selecionar um status de exceção e confirmar com observação e quantidade coletada. Verificar evento `STATUS_UPDATE` na auditoria.

- [X] T019 [US4] Estender `updateShipment` em `src/lib/services/shipment.service.ts` para tratar role='collector' — valida e atualiza apenas os campos `status_id`, `observations` e `collected_count`; rejeita campos adicionais com 403; registra `STATUS_UPDATE` (em vez de FULL_UPDATE) no audit log
- [X] T020 [P] [US4] Criar componente `ShipmentStatusUpdate` em `src/components/shipments/ShipmentStatusUpdate.tsx` — exibe dados da encomenda somente para leitura, select de status (apenas ativos), textarea de `observations` (aparece/torna-se obrigatório quando `requires_observation = true`), input de `collected_count` (aparece/torna-se obrigatório quando `is_exception = true`; validação: 0 <= valor <= volume_count)
- [X] T021 [US4] Atualizar PATCH handler em `src/app/api/shipments/[shipmentId]/route.ts` para discriminar role — detecta role do usuário autenticado e passa para `updateShipment`; collector recebe 403 se tentar alterar campos não permitidos; outras roles sem permissão recebem 403
- [X] T022 [US4] Atualizar `src/app/(protected)/encomendas/[id]/page.tsx` para renderização por role — collector: renderiza `ShipmentStatusUpdate` em vez de `ShipmentForm`; admin: mantém `ShipmentForm` com `mode='edit'`

**Checkpoint**: US4 completa — collector consegue registrar coletas; fluxo operacional principal funcionando.

---

## Phase 7: User Story 5 — Remover Encomenda (Soft Delete) (Priority: P5)

**Goal**: Administrador consegue remover uma encomenda (soft delete); a encomenda desaparece da listagem mas permanece no banco.

**Independent Test**: Como admin, remover uma encomenda via botão na página de edição e confirmar o modal. Verificar que a encomenda desaparece da listagem `/encomendas` e que o evento `DELETE` aparece na auditoria. Verificar via Supabase que `is_active = false` no registro.

- [X] T023 [US5] Adicionar função `softDeleteShipment(id, performedBy)` a `src/lib/services/shipment.service.ts` — define `is_active = false` e `updated_by`; registra `DELETE` no audit log com old_data snapshot completo e new_data null
- [X] T024 [US5] Adicionar handler DELETE a `src/app/api/shipments/[shipmentId]/route.ts` — valida admin via `getAdminUser()`, chama `softDeleteShipment`, retorna 200 com mensagem de sucesso; retorna 401/403/404 conforme api.md
- [X] T025 [US5] Adicionar botão de soft delete à `src/app/(protected)/encomendas/[id]/page.tsx` — visível apenas para admin, exibe modal de confirmação antes de executar DELETE `/api/shipments/[id]`, redireciona para `/encomendas` após sucesso

**Checkpoint**: US5 completa — admin consegue remover encomendas sem perda do histórico.

---

## Phase 8: User Story 6 — Auditoria de Encomendas (Priority: P6)

**Goal**: A listagem de auditoria de cada encomenda é visível para todos os usuários autenticados, mostrando todos os eventos com usuário, data/hora e detalhes das alterações.

**Independent Test**: Realizar criação, atualização de status (collector), edição completa (admin) e remoção de uma encomenda. Acessar a página `/encomendas/[id]` e verificar que todos os 4 eventos aparecem no log com usuário (email), tipo de operação, data/hora e campos alterados.

- [X] T026 [US6] Adicionar função `listShipmentAuditLog(id, page, limit)` a `src/lib/services/shipment.service.ts` — busca eventos da `shipment_audit_log` com join na tabela `users` para obter `performed_by_email`, paginado, ordenado por `performed_at DESC`
- [X] T027 [US6] Criar API route GET `/api/shipments/[shipmentId]/audit-log` em `src/app/api/shipments/[shipmentId]/audit-log/route.ts` — valida autenticação via `getAuthenticatedUser()`, chama `listShipmentAuditLog`, retorna 200 com items e pagination conforme api.md
- [X] T028 [P] [US6] Criar componente `ShipmentAuditLog` em `src/components/shipments/ShipmentAuditLog.tsx` — lista eventos de auditoria com badge por tipo de ação (CREATE, FULL_UPDATE, STATUS_UPDATE, DELETE), exibe usuário responsável (email), data/hora formatada, e diff dos campos alterados (old_data → new_data); paginação integrada
- [X] T029 [US6] Atualizar `src/app/(protected)/encomendas/[id]/page.tsx` para renderizar `ShipmentAuditLog` abaixo do formulário principal — carrega dados via GET `/api/shipments/[id]/audit-log` para admin e collector

**Checkpoint**: US6 completa — rastreabilidade total de todas as operações sobre encomendas.

---

## Phase 9: Polish & Validação Final

**Purpose**: Validação end-to-end de todos os cenários do quickstart e edge cases do spec.

- [ ] T030 Validar manualmente todos os cenários do `quickstart.md` — admin: cadastrar, editar, buscar, filtrar, soft delete; collector: atualizar status com e sem exceção; verificar edge cases (status desativado, busca sem resultados, quantidade coletada > volume_count, código+transportadora duplicados)

---

## Dependencies & Execution Order

### Dependências entre Fases

- **Setup (Phase 1)**: Sem dependências — iniciar imediatamente
- **Foundational (Phase 2)**: Depende de Phase 1 — BLOQUEIA todas as histórias
- **US1 (Phase 3)**: Depende de Phase 2 — ponto de entrada do MVP
- **US2 (Phase 4)**: Depende de Phase 2; beneficia-se de US1 (encomendas para listar)
- **US3 (Phase 5)**: Depende de US1 (ShipmentForm reutilizado, service base)
- **US4 (Phase 6)**: Depende de US3 (rota PATCH e página [id] já criados)
- **US5 (Phase 7)**: Depende de US3 (rota [id] já criada)
- **US6 (Phase 8)**: Depende de US1 (audit log iniciado no service); integra na página de US3/US4
- **Polish (Phase 9)**: Depende de todas as histórias completas

### Dependências Dentro das Histórias

```
US1: T005 + T006 → T007 → T008 (T009 e T010 são independentes)
US2: T011 → T012 (T013 e T014 independentes) → T015
US3: T016 → T017 → T018
US4: T019 → T021 (T020 independente) → T022
US5: T023 → T024 → T025
US6: T026 → T027 (T028 independente) → T029
```

### Oportunidades de Paralelismo

- T002 + T003 podem rodar em paralelo (arquivos distintos)
- T005 + T006 podem rodar em paralelo (service vs. componente)
- T009 + T010 podem rodar em paralelo com T007/T008
- T013 + T014 podem rodar em paralelo
- T020 pode rodar em paralelo com T019/T021
- T028 pode rodar em paralelo com T026/T027

---

## Parallel Example: User Story 1

```bash
# Rodar em paralelo (fases independentes):
Task T005: "Implementar createShipment + getShipmentById em src/lib/services/shipment.service.ts"
Task T006: "Criar ShipmentForm em src/components/shipments/ShipmentForm.tsx"
Task T009: "Atualizar src/app/dashboard/page.tsx com link Encomendas"
Task T010: "Atualizar src/components/layout/Header.tsx com nav Encomendas"

# Após T005 concluído:
Task T007: "Criar POST /api/shipments em src/app/api/shipments/route.ts"

# Após T006 + T007 concluídos:
Task T008: "Criar src/app/(protected)/encomendas/nova/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Apenas)

1. Completar Phase 1: Setup (T001)
2. Completar Phase 2: Foundational (T002–T004)
3. Completar Phase 3: User Story 1 (T005–T010)
4. **PARAR E VALIDAR**: Admin consegue cadastrar encomendas e vê na listagem
5. Demonstrar/deployar se pronto

### Entrega Incremental

1. Setup + Foundational → base pronta (T001–T004)
2. US1 → admin cadastra encomendas (T005–T010) → **MVP!**
3. US2 → listagem com filtros (T011–T015)
4. US3 → edição admin completa (T016–T018)
5. US4 → fluxo operacional do collector (T019–T022)
6. US5 → soft delete (T023–T025)
7. US6 → auditoria visível (T026–T029)
8. Polish → validação final (T030)

---

## Notes

- `[P]` = arquivos diferentes, sem dependências incompletas
- `[USn]` = rastreabilidade à história de usuário correspondente
- Cada história é completável e testável independentemente após Phase 2
- Nenhum arquivo de teste deve ser criado (diretiva absoluta)
- Commits após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a história independentemente
- Service layer (`shipment.service.ts`) é construído incrementalmente — cada fase adiciona apenas as funções necessárias para aquela história
