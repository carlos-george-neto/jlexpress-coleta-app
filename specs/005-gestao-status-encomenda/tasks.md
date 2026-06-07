# Tasks: Gestão de Status da Encomenda

**Input**: Design documents from `/specs/005-gestao-status-encomenda/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, quickstart.md ✓

**Tests**: Nenhum — proibido pela constituição do projeto.

**Organization**: Tasks agrupadas por user story para permitir implementação e validação independente de cada história.

## Format: `[ID] [P?] [Story] Descrição`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: User story a que a task pertence (US1–US5)
- Caminhos de arquivo exatos incluídos nas descrições

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Criar os tipos TypeScript e a estrutura do serviço que todas as user stories utilizam.

- [X] T001 Criar tipos TypeScript (ShipmentStatus, ShipmentStatusAuditLog, StatusAuditAction, ListStatusQuery, PaginationMeta) em src/lib/types/status.ts
- [X] T002 Criar estrutura base do serviço com cliente Supabase e helper logStatusAudit em src/lib/services/status.service.ts

---

## Phase 2: Fundacional — User Story 1 (Priority: P1)

**Goal**: Banco de dados configurado com as tabelas, políticas RLS e 7 status operacionais iniciais prontos para uso.

**Independent Test**: Após executar as migrations, verificar via `SELECT * FROM shipment_statuses ORDER BY flow_order` que 7 linhas estão presentes com os atributos corretos (is_exception, requires_observation, is_finalizer conforme spec).

**⚠️ CRÍTICO**: Nenhuma user story pode ser testada via UI antes das migrations serem executadas (`supabase db push`).

- [X] T003 [US1] Criar migration com tabelas shipment_statuses e shipment_status_audit_log, políticas RLS (admin gerencia tudo; autenticados leem status ativos) e trigger updated_at em supabase/migrations/20260606000001_create_shipment_statuses.sql
- [X] T004 [US1] Criar migration de seed idempotente com os 7 status operacionais iniciais (ON CONFLICT (name) DO NOTHING) em supabase/migrations/20260606000002_seed_shipment_statuses.sql

**Checkpoint**: US1 validada — `SELECT count(*) FROM shipment_statuses` retorna 7; Coleta Parcial, Não Coletado e Cancelado têm `is_exception = true` e `requires_observation = true`.

---

## Phase 3: User Story 2 — Cadastro de Status (Priority: P2)

**Goal**: Administrador pode criar novos status operacionais via formulário com validação de campos obrigatórios e unicidade de nome; a criação é registrada na auditoria.

**Independent Test**: Acessar `/admin/statuses/new`, preencher nome e ordem do fluxo, submeter e verificar que o status aparece na listagem com os atributos corretos e `shipment_status_audit_log` contém uma entrada com `action = 'CREATE'`.

### Implementação

- [X] T005 [US2] Adicionar função createStatus com verificação de unicidade de nome e registro de auditoria (action CREATE) em src/lib/services/status.service.ts
- [X] T006 [P] [US2] Implementar rota POST /api/statuses com autenticação admin, validação dos campos obrigatórios (name, flow_order) e resposta 201/400/401/403 em src/app/api/statuses/route.ts
- [X] T007 [P] [US2] Criar componente StatusForm.tsx com campos name, description, flow_order, requires_observation, is_exception, is_finalizer, indicative_color (input type="color" + texto hex) e validação client-side em src/components/admin/statuses/StatusForm.tsx
- [X] T008 [US2] Criar página de cadastro de status integrada ao StatusForm com submit para POST /api/statuses e redirecionamento pós-criação em src/app/(admin)/statuses/new/page.tsx

**Checkpoint**: Criar um status via UI, confirmar que aparece na listagem, verificar no banco: `SELECT * FROM shipment_status_audit_log ORDER BY performed_at DESC LIMIT 1` retorna ação CREATE.

---

## Phase 4: User Story 3 — Listagem e Busca de Status (Priority: P3)

**Goal**: Administrador pode visualizar todos os status paginados e ordenados por flow_order, filtrar por tipo (ativos, inativos, exceção, finalizadores) de forma combinável e buscar por nome ou descrição.

**Independent Test**: Com ao menos 5 status de características distintas, aplicar filtro "exceção" e verificar que apenas status com `is_exception = true` são exibidos; combinar filtro "ativos" + busca "coleta" e confirmar resultados corretos sem falsos positivos.

### Implementação

- [X] T009 [US3] Adicionar função listStatuses com paginação server-side, filtros (is_active, is_exception, is_finalizer) e busca textual ilike por nome/descrição em src/lib/services/status.service.ts
- [X] T010 [P] [US3] Implementar rota GET /api/statuses com query params (page, limit, search, is_active, is_exception, is_finalizer, sort_by, sort_order) e resposta paginada em src/app/api/statuses/route.ts
- [X] T011 [P] [US3] Criar componente StatusBadge.tsx com variantes visuais distintas para ativo, inativo e exceção usando cor indicativa do status em src/components/admin/statuses/StatusBadge.tsx
- [X] T012 [P] [US3] Criar componente StatusFilters.tsx com filtros combináveis (ativos/inativos/exceção/finalizadores) e campo de busca textual controlados por query params em src/components/admin/statuses/StatusFilters.tsx
- [X] T013 [US3] Criar componente StatusList.tsx com tabela paginada integrando StatusBadge e StatusFilters, linhas com link para edição em src/components/admin/statuses/StatusList.tsx
- [X] T014 [US3] Criar página de listagem de status com StatusList, botão "Novo Status" e layout admin em src/app/(admin)/statuses/page.tsx

**Checkpoint**: Acessar `/admin/statuses`, aplicar filtro "exceção" e confirmar que apenas Coleta Parcial, Não Coletado e Cancelado aparecem; buscar "pendente" e verificar resultado único.

---

## Phase 5: User Story 4 — Edição de Status (Priority: P4)

**Goal**: Administrador pode editar todos os atributos de um status existente; as alterações são registradas na auditoria com os valores anteriores e novos.

**Independent Test**: Editar nome e flag `requires_observation` de um status; verificar na listagem os valores atualizados e confirmar `shipment_status_audit_log` com `action = 'UPDATE'`, `old_data` e `new_data` refletindo as mudanças.

### Implementação

- [X] T015 [US4] Adicionar funções getStatusById e updateStatus (edição de atributos com verificação de unicidade de nome e auditoria UPDATE/DEACTIVATE/REACTIVATE) em src/lib/services/status.service.ts
- [X] T016 [P] [US4] Implementar rota GET /api/statuses/[statusId] retornando status individual ou 404 em src/app/api/statuses/[statusId]/route.ts
- [X] T017 [US4] Implementar rota PATCH /api/statuses/[statusId] com validação de nome único, autenticação admin e suporte a todos os campos editáveis (incluindo is_active) em src/app/api/statuses/[statusId]/route.ts
- [X] T018 [US4] Criar página de edição de status reutilizando StatusForm com dados pré-preenchidos via GET /api/statuses/[statusId] em src/app/(admin)/statuses/[statusId]/page.tsx

**Checkpoint**: Editar um status via `/admin/statuses/[id]`, salvar, confirmar valores atualizados na listagem e verificar auditoria com old_data e new_data corretos.

---

## Phase 6: User Story 5 — Desativação de Status (Priority: P5)

**Goal**: Administrador pode desativar um status ativo (ou reativar um inativo) diretamente na página de edição; o status desativado exibe badge "Inativo" na listagem; o histórico de auditoria é consultável via API.

**Independent Test**: Desativar um status ativo, confirmar badge "Inativo" na listagem (não mais "Ativo"), verificar via GET /api/statuses/[id]/audit-log que existe entrada com `action = 'DEACTIVATE'`; reativar e verificar `action = 'REACTIVATE'`.

### Implementação

- [X] T019 [US5] Adicionar botão "Desativar" / "Reativar" com confirmação modal na página de edição, disparando PATCH com `{ is_active: false/true }` em src/app/(admin)/statuses/[statusId]/page.tsx
- [X] T020 [US5] Implementar rota GET /api/statuses/[statusId]/audit-log com paginação e join para performed_by_email em src/app/api/statuses/[statusId]/audit-log/route.ts

**Checkpoint**: Desativar um status, confirmar badge "Inativo" na listagem e `action = 'DEACTIVATE'` no endpoint `/api/statuses/[id]/audit-log`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Propósito**: Integração no dashboard e validações finais de acessibilidade e responsividade.

- [X] T021 [P] Adicionar card/link "Gerenciar Status" na seção admin do dashboard seguindo o padrão do link "Gerenciar Usuários" em src/app/dashboard/page.tsx
- [X] T022 [P] Verificar e adicionar aria-label em todos os botões e links dos componentes de status em src/components/admin/statuses/
- [ ] T023 Executar validações manuais do quickstart.md: seed (7 linhas), filtro "exceção", auditoria de criação e acesso negado para perfil não-admin em /admin/statuses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Fundacional (Phase 2)**: Depende de T001 e T002 completos — **BLOQUEIA** todas as user stories
- **US2 (Phase 3)**: Depende de Phase 2 concluída e migrations executadas; independente de US3
- **US3 (Phase 4)**: Depende de Phase 2 concluída; independente de US2
- **US4 (Phase 5)**: Depende de Phase 2 concluída; reutiliza StatusForm (T007) de US2
- **US5 (Phase 6)**: Depende de US4 concluída (página de edição T018 + serviço T015)
- **Polish (Phase 7)**: Depende de todas as US concluídas

### User Story Dependencies

| User Story | Pode iniciar após | Depende de tarefa específica |
|------------|-------------------|------------------------------|
| US1 (P1)   | Phase 1 completa  | —                            |
| US2 (P2)   | US1 executada     | —                            |
| US3 (P3)   | US1 executada     | —                            |
| US4 (P4)   | US1 executada     | T007 (StatusForm de US2)     |
| US5 (P5)   | US4 completa      | T015 (service) + T018 (página edição) |

### Within Each User Story

- Serviço (service.ts) antes das rotas API
- Rotas API antes das páginas (pages)
- Componentes [P] podem ser desenvolvidos em paralelo com rotas API (arquivos distintos)
- Cada user story deve ser testável de forma independente ao atingir seu checkpoint

### Parallel Opportunities

- T001 e T002 podem ser escritos em paralelo (arquivos distintos)
- T006, T007 (US2) podem ser desenvolvidos em paralelo (route.ts vs StatusForm.tsx)
- T010, T011, T012 (US3) podem ser desenvolvidos em paralelo
- T016 (GET individual) pode ser desenvolvido em paralelo com T011/T012 de US3
- US2 e US3 podem ser desenvolvidas em paralelo por dois desenvolvedores

---

## Parallel Example: User Story 3

```bash
# Após T009 (listStatuses no serviço), desenvolver em paralelo:
T010: GET /api/statuses em src/app/api/statuses/route.ts
T011: StatusBadge.tsx em src/components/admin/statuses/StatusBadge.tsx
T012: StatusFilters.tsx em src/components/admin/statuses/StatusFilters.tsx

# Aguarda T010 + T011 + T012 completos:
T013: StatusList.tsx (integra Badge + Filters)

# Aguarda T013:
T014: Página de listagem em src/app/(admin)/statuses/page.tsx
```

---

## Implementation Strategy

### MVP (User Stories 1 e 2 — criação básica)

1. Concluir Phase 1: Setup (T001, T002)
2. Concluir Phase 2: Fundacional (T003, T004 — executar `supabase db push`)
3. Concluir Phase 3: US2 — Cadastro (T005–T008)
4. **PARAR E VALIDAR**: Criar status via UI, confirmar auditoria no banco
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Fundacional → banco configurado, seed carregado
2. + US2 → criação de status funcional *(MVP mínimo demonstrável)*
3. + US3 → listagem com filtros e busca
4. + US4 → edição completa de atributos
5. + US5 → desativação e audit-log API
6. + Polish → integração no dashboard

### Parallel Team Strategy (2 desenvolvedores)

Após Phase 2 concluída:
- **Dev A**: US2 (T005–T008) → US4 (T015–T018)
- **Dev B**: US3 (T009–T014) — StatusBadge e StatusFilters em paralelo

---

## Notes

- `[P]` = arquivos distintos, sem dependências pendentes — podem ser executados em paralelo
- `[Story]` mapeia cada task para rastreabilidade com o spec.md
- Sem testes — proibido pela constituição do projeto
- Migrations devem ser executadas no banco antes de qualquer teste via UI
- `StatusForm.tsx` (T007) é criado em US2 e reutilizado sem modificação em US4
- O campo `is_active` no PATCH aciona `DEACTIVATE` (true→false) ou `REACTIVATE` (false→true); lógica encapsulada em `updateStatus` (T015), não na rota
- Cor armazenada como `#RRGGBB`; validação por CHECK constraint no banco e erro 400 na API para formato inválido
- Unicidade de `name` garantida tanto por UNIQUE constraint no banco quanto por verificação prévia no serviço (mensagem amigável em pt-BR antes do erro técnico do Supabase)
