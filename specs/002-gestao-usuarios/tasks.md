# Tasks: Gestão de Usuários

**Input**: Design documents from `/specs/002-gestao-usuarios/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api-contracts.md ✅, quickstart.md ✅

**Tests**: Nenhum — conforme constituição do projeto (zero testes automatizados).

**Organization**: Tasks agrupadas por user story para permitir implementação e teste independente de cada história.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: A qual user story esta task pertence (US1–US5)
- Todos os caminhos de arquivo são relativos ao root do repositório

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Objetivo**: Inicialização do projeto — tipos, schemas e migrações de banco.

- [X] T001 Criar tipos TypeScript para entidades User e UserAuditLog em `src/lib/types/user.ts`
- [X] T002 Criar Zod schemas de validação (createUserSchema, updateUserSchema, listUsersQuerySchema) em `src/lib/schemas/user.ts`
- [X] T003 [P] Criar migration SQL para tabela `public.users` com índices, trigger `updated_at` e RLS policies em `supabase/migrations/20260601000001_create_users_table.sql`
- [X] T004 [P] Criar migration SQL para tabela `public.user_audit_log` com índices, triggers de auditoria (UPDATE/DEACTIVATE) e RLS policies em `supabase/migrations/20260601000002_create_user_audit_log.sql`

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Objetivo**: Infraestrutura core que DEVE estar completa antes de qualquer user story.

**⚠️ CRÍTICO**: Nenhum trabalho de user story pode começar até que esta fase esteja completa.

- [X] T005 Criar Supabase admin client singleton (usando SERVICE_ROLE_KEY) em `src/lib/supabase/admin.ts`
- [X] T006 Estender `src/middleware.ts` para proteger rotas `/admin/**` e `/api/users/**` exigindo role `admin`
- [X] T007 Criar layout do grupo de rotas admin com guarda de autenticação em `src/app/(admin)/layout.tsx`
- [X] T008 [P] Implementar UserService com métodos base (createUser, getUserById, updateUser, listUsers) integrando Supabase admin client em `src/lib/services/user.service.ts`
- [X] T009 [P] Implementar AuditService com função `logUserAudit` para logging application-level em `src/lib/services/audit.service.ts`

**Checkpoint**: Fundação pronta — implementação das user stories pode começar.

---

## Phase 3: User Story 1 — Cadastro de Novo Usuário (Priority: P1) 🎯 MVP

**Goal**: Administrador consegue cadastrar novo usuário com email, nome, perfil e senha; recebe feedback de sucesso; auditoria registra CREATE.

**Independent Test**: Criar usuário com email `collector1@jlexpress.local`, nome e perfil via formulário → verificar registro em `public.users` e entrada `CREATE` em `user_audit_log`.

### Implementação — User Story 1

- [X] T010 [US1] Implementar `POST /api/users` para criar usuário em `auth.users` + `public.users` via UserService em `src/app/api/users/route.ts`
- [X] T011 [P] [US1] Implementar `GET /api/users/validate-email` para validação de email em tempo real (< 500ms) em `src/app/api/users/validate-email/route.ts`
- [X] T012 [P] [US1] Criar componente `UserForm` com React Hook Form + Zod e validação de email em tempo real via `/api/users/validate-email` em `src/components/admin/users/UserForm.tsx`
- [X] T013 [US1] Criar página de cadastro de novo usuário que utiliza `UserForm` e chama `POST /api/users` em `src/app/(admin)/users/new/page.tsx`
- [X] T014 [US1] Adicionar registro de auditoria `CREATE` via AuditService no método `createUser` do UserService em `src/lib/services/user.service.ts`

**Checkpoint**: US1 completa — administrador cria usuário, vê feedback positivo e auditoria registra a ação.

---

## Phase 4: User Story 2 — Edição de Dados Cadastrais (Priority: P1)

**Goal**: Administrador consegue editar nome, email e perfil de usuário existente; alterações persistem; auditoria registra quem editou e quando.

**Independent Test**: Editar usuário existente alterando nome e role → verificar persistência no banco e entrada `UPDATE` em `user_audit_log` com `old_data` e `new_data` corretos.

### Implementação — User Story 2

- [X] T015 [US2] Implementar `GET /api/users/:userId` para buscar dados completos de um usuário em `src/app/api/users/[userId]/route.ts`
- [X] T016 [US2] Implementar `PUT /api/users/:userId` para atualizar dados do usuário (com validação de email único ao editar) em `src/app/api/users/[userId]/route.ts`
- [X] T017 [US2] Implementar `GET /api/users/:userId/audit-log` com paginação e filtro por action em `src/app/api/users/[userId]/audit-log/route.ts`
- [X] T018 [US2] Criar página de edição de usuário com `UserForm` pré-preenchido, botão salvar e seção de histórico de auditoria em `src/app/(admin)/users/[userId]/page.tsx`
- [X] T019 [US2] Adicionar registro de auditoria `UPDATE` via AuditService no método `updateUser` do UserService em `src/lib/services/user.service.ts`

**Checkpoint**: US2 completa — administrador edita dados de usuário, vê auditoria com alterações anteriores e novas.

---

## Phase 5: User Story 3 — Reset de Senha (Priority: P1)

**Goal**: Administrador consegue disparar reset de senha; usuário recebe link por e-mail; auditoria registra o reset.

**Independent Test**: Clicar em "Resetar Senha" para um usuário → verificar mensagem de confirmação na UI e entrada `PASSWORD_RESET` em `user_audit_log`.

### Implementação — User Story 3

- [X] T020 [US3] Implementar `POST /api/users/:userId/reset-password` usando `supabase.auth.admin.generateLink({ type: 'recovery', email })` em `src/app/api/users/[userId]/reset-password/route.ts`
- [X] T021 [US3] Adicionar botão "Resetar Senha" com diálogo de confirmação na página de edição de usuário em `src/app/(admin)/users/[userId]/page.tsx`
- [X] T022 [US3] Adicionar registro de auditoria `PASSWORD_RESET` via AuditService no método de reset de senha do UserService em `src/lib/services/user.service.ts`

**Checkpoint**: US3 completa — administrador dispara reset de senha; usuário recebe e-mail; auditoria registra a ação.

---

## Phase 6: User Story 4 — Ativar/Desativar Usuário (Priority: P2)

**Goal**: Administrador consegue desativar usuário (soft delete); usuário desativado não consegue logar; dados persistem; administrador pode reativar.

**Independent Test**: Desativar usuário → tentar login com usuário desativado e verificar bloqueio → verificar entrada `DEACTIVATE` em `user_audit_log` → reativar usuário.

### Implementação — User Story 4

- [X] T023 [US4] Implementar `DELETE /api/users/:userId` para soft delete (setar `is_active = false`) com campo opcional `reason` em `src/app/api/users/[userId]/route.ts`
- [X] T024 [US4] Adicionar guarda de auto-desativação no handler `DELETE` (impedir admin de desativar a si mesmo) em `src/app/api/users/[userId]/route.ts`
- [X] T025 [US4] Adicionar botões "Desativar"/"Ativar" com diálogo de confirmação na página de edição de usuário em `src/app/(admin)/users/[userId]/page.tsx`
- [X] T026 [US4] Adicionar registros de auditoria `DEACTIVATE` e `ACTIVATE` via AuditService no UserService em `src/lib/services/user.service.ts`

**Checkpoint**: US4 completa — administrador ativa/desativa usuários; usuário desativado não acessa o sistema; auditoria registra a ação.

---

## Phase 7: User Story 5 — Listagem e Busca de Usuários (Priority: P2)

**Goal**: Administrador consegue listar todos os usuários com busca por nome/email, paginação e ordenação por coluna.

**Independent Test**: Acessar listagem → buscar por "João" → verificar filtro em tempo real → paginar → clicar em coluna para ordenar.

### Implementação — User Story 5

- [X] T027 [US5] Implementar `GET /api/users` com paginação, busca (search por nome/email), filtro por role e is_active, e ordenação por coluna em `src/app/api/users/route.ts`
- [X] T028 [P] [US5] Criar componente `UserList` com tabela de usuários e colunas ordenáveis (email, nome, role, status) em `src/components/admin/users/UserList.tsx`
- [X] T029 [P] [US5] Criar componente `UserSearch` com input de busca com debounce (300ms) em `src/components/admin/users/UserSearch.tsx`
- [X] T030 [P] [US5] Criar componente `UserPagination` com navegação de páginas e contador de registros em `src/components/admin/users/UserPagination.tsx`
- [X] T031 [US5] Criar página de listagem de usuários combinando `UserList`, `UserSearch` e `UserPagination` com link para `/users/new` em `src/app/(admin)/users/page.tsx`
- [X] T032 [US5] Adicionar link de navegação para página de edição em cada linha da tabela `UserList` em `src/components/admin/users/UserList.tsx`

**Checkpoint**: US5 completa — administrador lista, busca, pagina e ordena usuários.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Objetivo**: Melhorias que afetam múltiplas user stories e validações finais.

- [X] T033 [P] Criar helper `ApiResponse` para resposta padronizada de todos os endpoints (sucesso, erro, paginação) em `src/lib/api/response.ts`
- [X] T034 [P] Adicionar menu de navegação admin com link "Usuários" no layout admin em `src/app/(admin)/layout.tsx`
- [X] T035 Validar edge cases em UserService: email case-insensitive, bloqueio de auto-desativação, email duplicado na edição em `src/lib/services/user.service.ts`
- [ ] T036 Executar validação completa do quickstart.md: aplicar migrations, inserir usuário root e executar os 7 testes manuais documentados

---

## Dependências e Ordem de Execução

### Dependências entre Fases

- **Setup (Phase 1)**: Sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Stories (Phase 3–7)**: Todas dependem da conclusão do Foundational
  - Podem prosseguir em paralelo (se houver capacidade) ou sequencialmente por prioridade (P1 → P2)
- **Polish (Phase 8)**: Depende da conclusão de todas as user stories desejadas

### Dependências entre User Stories

- **US1 (P1)**: Pode começar após Foundational — sem dependências de outras histórias
- **US2 (P1)**: Pode começar após Foundational — pode reusar `UserForm` criado em US1
- **US3 (P1)**: Depende de US2 (adiciona funcionalidade à página de edição de US2)
- **US4 (P2)**: Depende de US2 (adiciona funcionalidade à página de edição de US2)
- **US5 (P2)**: Pode começar após Foundational — independente de US1–US4

### Dentro de cada User Story

- Modelos/Serviços antes de endpoints
- Endpoints antes de componentes UI
- Componentes antes de páginas
- Auditoria junto com o serviço correspondente

### Oportunidades de Paralelismo

- T003 e T004 (migrations) podem rodar em paralelo
- T008 e T009 (UserService e AuditService) podem rodar em paralelo
- T011 e T012 (validate-email endpoint e UserForm) podem rodar em paralelo dentro de US1
- T028, T029, T030 (UserList, UserSearch, UserPagination) podem rodar em paralelo dentro de US5
- T033 e T034 (ApiResponse helper e menu de navegação) podem rodar em paralelo na fase de Polish

---

## Exemplo de Execução em Paralelo: User Story 5

```bash
# Lançar todos os componentes de US5 em paralelo (após T027 ter seu contrato definido):
Task: "Criar componente UserList em src/components/admin/users/UserList.tsx"        # T028
Task: "Criar componente UserSearch em src/components/admin/users/UserSearch.tsx"    # T029
Task: "Criar componente UserPagination em src/components/admin/users/UserPagination.tsx" # T030

# Depois que todos concluírem:
Task: "Criar página de listagem em src/app/(admin)/users/page.tsx"  # T031
```

---

## Estratégia de Implementação

### MVP Primeiro (Apenas User Story 1)

1. Completar Phase 1: Setup (T001–T004)
2. Completar Phase 2: Foundational (T005–T009) — CRÍTICO
3. Completar Phase 3: User Story 1 (T010–T014)
4. **PARAR e VALIDAR**: Testar US1 independentemente (criar usuário, verificar auditoria)
5. Demo/deploy se estiver pronto

### Entrega Incremental

1. Setup + Foundational → Fundação pronta
2. US1 (P1) → Testar → Deploy MVP
3. US2 (P1) → Testar → Deploy
4. US3 (P1) → Testar → Deploy (completa P1)
5. US4 (P2) → Testar → Deploy
6. US5 (P2) → Testar → Deploy (completa P2)
7. Polish → Deploy final

### Estratégia de Time em Paralelo

Com múltiplos desenvolvedores (após Phase 2 concluída):
- **Dev A**: US1 + US2 (fluxo de criação/edição)
- **Dev B**: US3 + US4 (reset de senha + ativar/desativar)
- **Dev C**: US5 (listagem + busca)

---

## Notas

- `[P]` = arquivos diferentes, sem dependências — podem rodar em paralelo
- `[USn]` = mapeia task para user story específica para rastreabilidade
- Cada user story deve ser completável e testável independentemente
- Fazer commit após cada task ou grupo lógico
- Parar em cada checkpoint para validar a história independentemente
- Evitar: tasks vagas, conflitos no mesmo arquivo, dependências cross-story que quebrem independência
