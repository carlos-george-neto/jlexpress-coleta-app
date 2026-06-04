# Tasks: Gestão de Usuários

**Input**: Design documents from `/specs/002-gestao-usuarios/`

**Feature Branch**: `002-gestao-usuarios`

**Tech Stack**: TypeScript 5.7, Next.js 15 (App Router), Supabase + PostgreSQL, React Hook Form, Zod, TailwindCSS

**Prerequisites**: 
- ✅ Feature 001 (autenticação) implementada
- ✅ plan.md finalizado (documentado)
- ✅ spec.md com 5 user stories definidas
- ✅ data-model.md com schema PostgreSQL completo
- ✅ research.md com decisões técnicas validadas
- ✅ quickstart.md com instruções de setup

**Tests**: Nenhum (conforme constituição do projeto)

**Organization**: Tasks são agrupadas por user story (US1-US5) para permitir implementação independente e testagem de cada story. Tarefas marcadas com [P] podem rodar em paralelo (diferentes arquivos, sem dependências).

---

## Format: `- [ ] [ID] [P?] [Story?] Description com caminho exato do arquivo`

- **[ID]**: Número sequencial (T001, T002, ...)
- **[P]**: Pode rodar em paralelo (diferentes arquivos, nenhuma dependência)
- **[Story]**: Qual user story (US1, US2, US3, US4, US5)
- **Path**: Caminhos exatos em `src/`

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Propósito**: Inicialização do projeto, estrutura básica, migrações

- [ ] T001 Criar estrutura de diretórios conforme plan.md: `src/app/(admin)/users/`, `src/components/admin/users/`, `src/lib/services/`, `src/lib/types/`, `src/lib/schemas/`
- [ ] T002 [P] Criar arquivo de tipos TypeScript para usuários em `src/lib/types/user.ts` (User, UserRole, UserAuditLog types)
- [ ] T003 [P] Criar schemas Zod para validação em `src/lib/schemas/user.ts` (createUserSchema, updateUserSchema, emailSchema, passwordSchema)
- [ ] T004 [P] Executar script SQL de criação de tabelas do data-model.md via Dashboard Supabase (users, user_audit_log, índices, triggers, RLS)
- [ ] T005 Criar e executar script de seed do usuário root conforme quickstart.md (6 passos: criar em auth.users, anotar UUID, executar SQL com INSERT, verificar, salvar credenciais, testar login)
- [ ] T006 [P] Criar arquivo de service para usuários em `src/lib/services/user.service.ts` (funções CRUD base sem lógica ainda)

---

## Phase 2: Foundational (Pré-requisitos Bloqueadores)

**Propósito**: Infraestrutura compartilhada que TODOS os stories dependem

**⚠️ CRÍTICO**: Nenhuma implementação de user story pode começar até esta fase estar 100% completa

- [ ] T007 [P] Estender middleware de autenticação em `src/middleware.ts` para validar JWT e adicionar userId ao header de requisições
- [ ] T008 [P] Criar middleware RBAC (Role-Based Access Control) em `src/middleware.ts` para validar que apenas `admin` pode acessar endpoints de gestão de usuários
- [ ] T009 Criar serviço de auditoria em `src/lib/services/audit.service.ts` com função `logAuditEvent()` para registrar em `user_audit_log`
- [ ] T010 [P] Implementar helper de senha em `src/lib/security/password.ts`: `hashPassword()`, `verifyPassword()`, `generateTemporaryPassword()` (usando crypto.randomBytes + base64)
- [ ] T011 [P] Criar helper para tokens em `src/lib/security/token.ts`: `generateSecureToken()`, `hashToken()` (para reset de senha)
- [ ] T012 [P] Criar cliente Supabase Admin em `src/lib/supabase/admin.ts` com função para `adminResetUserPassword()` usando Supabase Admin API
- [ ] T013 Criar helper de validação em `src/lib/validators/email.ts`: `validateUniqueEmail()` com query ao banco para verificar duplicação (case-insensitive)
- [ ] T014 Criar layout administrativo base em `src/app/(admin)/layout.tsx` com navegação lateral, header, e proteção RBAC

**Checkpoint**: Fundação pronta - implementação de user stories pode começar em paralelo agora

---

## Phase 3: User Story 1 - Administrador Cadastra Novo Usuário (Priority: P1) 🎯 MVP

**Goal**: Permitir que administrador cadastre novos usuários com email, nome e perfil, com validação de duplicação e auditoria completa.

**Independent Test**: Criar novo usuário com email válido, nome e perfil; verificar se persiste em `public.users`; verificar entrada de auditoria em `user_audit_log` com action CREATE; tentar criar com email duplicado e verificar erro.

### Implementação da User Story 1

- [ ] T015 [P] [US1] Criar componente form `src/components/admin/users/UserForm.tsx` com React Hook Form, Zod, campos: email, full_name, role, password, password_confirmation
- [ ] T016 [P] [US1] Criar componente página nova de usuário `src/app/(admin)/users/new/page.tsx` com UserForm integrado
- [ ] T017 [US1] Implementar endpoint POST em `src/app/api/users/route.ts` para criar usuário: validar email único, hash de senha, chamar Supabase Auth para criar user, inserir em public.users, registrar auditoria
- [ ] T018 [US1] Adicionar validação de campos obrigatórios (email, full_name, role) no schema Zod em `src/lib/schemas/user.ts`
- [ ] T019 [US1] Adicionar validação de email duplicado no endpoint POST (conferir com `validateUniqueEmail()`)
- [ ] T020 [US1] Implementar logging de auditoria em POST (action: CREATE, performed_by: userId, performed_at, new_data: usuário criado)
- [ ] T021 [US1] Adicionar tratamento de erros no endpoint (400 para validação, 409 para duplicação, 500 para erro de servidor)
- [ ] T022 [US1] Testar manualmente: criar usuário válido, verificar se aparece em public.users, verificar entrada em user_audit_log

**Checkpoint**: User Story 1 totalmente funcional e testável independentemente

---

## Phase 4: User Story 2 - Administrador Edita Dados Cadastrais de Usuário (Priority: P1)

**Goal**: Permitir edição de nome, email e perfil de usuário existente com auditoria de mudanças.

**Independent Test**: Editar usuário existente, alterar nome e role, salvar; verificar se mudanças persistem; verificar entrada em user_audit_log com action UPDATE e snapshots old_data/new_data; tentar alterar email para duplicado e verificar erro.

### Implementação da User Story 2

- [ ] T023 [P] [US2] Criar página de edição `src/app/(admin)/users/[userId]/page.tsx` que carrega dados do usuário e renderiza UserForm em modo edição
- [ ] T024 [P] [US2] Estender componente `UserForm.tsx` para suportar modo edição (valores iniciais, sem campo password ao editar)
- [ ] T025 [US2] Implementar endpoint PUT em `src/app/api/users/[userId]/route.ts` para atualizar usuário: validar email único (exceto email atual), atualizar em public.users, atualizar updated_by, registrar auditoria completa
- [ ] T026 [US2] Adicionar snapshot de dados antigos (old_data) na auditoria via trigger PostgreSQL em user_audit_log (já definido em data-model.md)
- [ ] T027 [US2] Implementar validação de email duplicado em PUT (permitir se for o mesmo email, rejeitar se for de outro usuário)
- [ ] T028 [US2] Adicionar tratamento de erros em PUT (404 se usuário não existe, 409 se email duplicado)
- [ ] T029 [US2] Testar manualmente: editar usuário, alterar nome, verificar persistência e auditoria; tentar email duplicado e verificar erro

**Checkpoint**: User Stories 1 E 2 funcionais e independentes

---

## Phase 5: User Story 3 - Administrador Reseta Senha de Usuário (Priority: P1)

**Goal**: Permitir reset de senha com envio de link de recuperação via email, registrando ação em auditoria.

**Independent Test**: Resetar senha de um usuário, verificar se email de reset foi enviado (ou link foi gerado); usar link para resetar senha; fazer login com nova senha e verificar sucesso; verificar entrada em user_audit_log com action PASSWORD_RESET.

### Implementação da User Story 3

- [ ] T030 [P] [US3] Criar componente botão de reset em `src/components/admin/users/UserActions.tsx` com confirmação antes de executar
- [ ] T031 [P] [US3] Integrar botão de reset em página de edição de usuário (`src/app/(admin)/users/[userId]/page.tsx`)
- [ ] T032 [US3] Implementar endpoint POST em `src/app/api/users/[userId]/reset-password/route.ts` que: chama Supabase Admin API (`generateLink` com type recovery), registra auditoria com action PASSWORD_RESET, retorna sucesso
- [ ] T033 [US3] Implementar template de email para reset (em Supabase Email Templates ou arquivo em `src/lib/email/templates/`)
- [ ] T034 [US3] Adicionar configuração de redirect URL em reset password (apontar para página de reset com token)
- [ ] T035 [US3] Adicionar logging específico de PASSWORD_RESET em auditoria (performed_by, performed_at, reason: "Administrador solicitou reset")
- [ ] T036 [US3] Adicionar tratamento de erros (404 se usuário não existe, 500 se Supabase falhar)
- [ ] T037 [US3] Testar manualmente: resetar senha, verificar email/link, fazer login com nova senha, verificar auditoria

**Checkpoint**: User Stories 1, 2 E 3 funcionais

---

## Phase 6: User Story 4 - Administrador Ativa/Desativa Usuário (Priority: P2)

**Goal**: Permitir soft delete (ativação/desativação) de usuários com preservação de histórico e bloqueio de login para inativos.

**Independent Test**: Desativar usuário (is_active = false); verificar que usuário não consegue fazer login; reativar usuário (is_active = true); verificar que login funciona novamente; verificar entrada em user_audit_log com actions DEACTIVATE/ACTIVATE; dados históricos preservados.

### Implementação da User Story 4

- [ ] T038 [P] [US4] Criar componente toggle de ativação em `src/components/admin/users/UserStatus.tsx` (ativo/inativo)
- [ ] T039 [P] [US4] Integrar toggle em página de listagem e edição de usuários
- [ ] T040 [US4] Implementar endpoint PATCH em `src/app/api/users/[userId]/status/route.ts` para alternar is_active: atualizar em public.users, registrar auditoria (action: ACTIVATE ou DEACTIVATE)
- [ ] T041 [US4] Estender middleware de autenticação para verificar se usuário está ativo (is_active = true) antes de permitir requisições
- [ ] T042 [US4] Adicionar validação em login (Feature 001) para bloquear login de usuários inativos
- [ ] T043 [US4] Adicionar proteção contra auto-desativação (admin não consegue desativar a si mesmo)
- [ ] T044 [US4] Adicionar tratamento de erros (404 se usuário não existe, 400 se tentar desativar a si mesmo)
- [ ] T045 [US4] Testar manualmente: desativar usuário, tentar login e verificar bloqueio; reativar e verificar que login funciona; tentar auto-desativação e verificar erro

**Checkpoint**: User Stories 1-4 funcionais

---

## Phase 7: User Story 5 - Administrador Lista e Busca Usuários (Priority: P2)

**Goal**: Permitir listagem paginada de usuários com busca por nome/email e ordenação por coluna.

**Independent Test**: Acessar listagem de usuários; verificar se aparecem com paginação (ex: 10 por página); buscar por nome, verificar filtro em tempo real; buscar por email, verificar resultado correto; ordenar por colunas; verificar performance < 3 segundos para 1000 usuários.

### Implementação da User Story 5

- [ ] T046 [P] [US5] Criar componente tabela de usuários `src/components/admin/users/UserTable.tsx` com colunas: email, full_name, role, is_active, last_login_at, ações (editar, reset, desativar/ativar)
- [ ] T047 [P] [US5] Criar componente de busca `src/components/admin/users/UserSearch.tsx` com input de busca (nome/email) e filtro de status (ativo/inativo)
- [ ] T048 [P] [US5] Criar componente de paginação `src/components/admin/users/UserPagination.tsx` (botões anterior/próximo, página atual, total de páginas)
- [ ] T049 [P] [US5] Criar página principal de listagem `src/app/(admin)/users/page.tsx` integrando UserTable, UserSearch, UserPagination
- [ ] T050 [US5] Implementar endpoint GET em `src/app/api/users/route.ts` com suporte a: query params (search, filter, sort, page, limit), busca case-insensitive em email/full_name, paginação, ordenação por colunas, retornar { users, total, pages }
- [ ] T051 [US5] Adicionar índices de performance em `public.users` (já em data-model.md): idx_users_email, idx_users_role, idx_users_is_active
- [ ] T052 [US5] Implementar busca com query LIKE em SQL para email/full_name (com índices full-text search se tempo permitir)
- [ ] T053 [US5] Adicionar tratamento de paginação (validar limit, offset, retornar total correto)
- [ ] T054 [US5] Adicionar tratamento de erros (validar parâmetros de busca, retornar 400 se inválido)
- [ ] T055 [US5] Testar manualmente: listar usuários, buscar por nome, buscar por email, ordenar colunas, paginar, verificar performance

**Checkpoint**: Todas as User Stories 1-5 funcionais e independentes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Propósito**: Melhorias transversais que afetam múltiplas user stories

- [ ] T056 [P] Adicionar confirmações de ação (modal) em desativar/resetar/deletar em todas as páginas
- [ ] T057 [P] Melhorar mensagens de erro (feedback claro ao usuário final em todas as operações)
- [ ] T058 [P] Implementar feedback de sucesso (toast/notification) após criar/editar/desativar usuários
- [ ] T059 [P] Refatorar componentes `UserForm.tsx`, `UserTable.tsx` para melhorar reutilização e legibilidade
- [ ] T060 Adicionar validação de política de senha em `src/lib/validators/password.ts` (comprimento mínimo, caracteres especiais, conforme constitution.md)
- [ ] T061 Implementar rate limiting em endpoints sensíveis (POST /users, PUT /users/:id) para evitar abuso
- [ ] T062 [P] Implementar cache de listagem de usuários (ex: Redis ou React Query) para melhorar performance em listagens frequentes
- [ ] T063 [P] Adicionar logs estruturados em todos os endpoints de usuários (winston ou console estruturado)
- [ ] T064 Executar validation de quickstart.md (verificar script de seed root, instruções de setup, testes manuais)
- [ ] T065 [P] Criar documentação de uso em `specs/002-gestao-usuarios/IMPLEMENTATION_GUIDE.md` (como usar endpoints, exemplos cURL)
- [ ] T066 [P] Melhorar estilo responsivo com TailwindCSS em todos os componentes (mobile-first, testar em dispositivos)
- [ ] T067 Refatorar service layer em `src/lib/services/user.service.ts` (adicionar testes manuais de lógica)
- [ ] T068 [P] Adicionar tratamento de timezone (todos os timestamps em UTC conforme constitution.md)
- [ ] T069 Validar conformidade com constituição (Portuguese, TypeScript strict, no tests, RLS policies, soft delete)
- [ ] T070 [P] Cleanup de código: remover logs de debug, comentários obsoletos, importações não usadas

**Checkpoint**: Polimento completo, código pronto para produção

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências - pode começar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - **BLOQUEIA** todas as user stories (CRÍTICO)
- **User Stories (Phases 3-7)**: Todas dependem de Foundational completo
  - Podem ser implementadas em paralelo se houver equipe
  - Ou sequencial em ordem de prioridade (P1 → P2)
- **Polish (Phase 8)**: Depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: Inicia após Foundational - Sem dependências em outras stories
- **US2 (P1)**: Inicia após Foundational - Integra com US1 mas é independente
- **US3 (P1)**: Inicia após Foundational - Integra com US1/US2 mas é independente
- **US4 (P2)**: Inicia após Foundational - Integra com US1-3 mas é independente
- **US5 (P2)**: Inicia após Foundational - Integra com US1-4 mas é independente

### Within Each User Story

- Componentes antes de páginas
- Endpoints antes de integração
- Validação antes de auditoria
- Story completa antes de next priority

### Parallel Opportunities

- **Setup**: T001-T006 marcados [P] podem rodar em paralelo
- **Foundational**: T007-T014 marcados [P] podem rodar em paralelo (mas T006/T009 devem estar antes de US1)
- **Após Foundational**: Todas as US podem começar em paralelo (se 5 desenvolvedores: 1 por story)
- **Within US1**: T015, T016 [P] podem rodar em paralelo
- **Within US2**: T023, T024 [P] podem rodar em paralelo
- **Within US5**: T046, T047, T048, T049 [P] podem rodar em paralelo

---

## Parallel Example: User Story 1 (MVP)

```bash
# Após Phase 1 + Phase 2 estarem 100% completos:

# Componentes em paralelo:
Task T015: Criar UserForm.tsx
Task T016: Criar /new/page.tsx

# Depois:
Task T017: POST endpoint (depende de T015, T016)
Tasks T018-T022: Validação e logging (dependem de T017)
```

---

## Parallel Example: Após Foundational (Multi-desenvolvedor)

```bash
# Com 5 desenvolvedores após Phase 2:

Developer A: US1 (T015-T022)
Developer B: US2 (T023-T029)
Developer C: US3 (T030-T037)
Developer D: US4 (T038-T045)
Developer E: US5 (T046-T055)

Todos podem começar em paralelo após T001-T014 finalizarem
```

---

## Implementation Strategy

### MVP First (Just US1)

1. ✅ Complete Phase 1 (Setup) - T001-T006
2. ✅ Complete Phase 2 (Foundational) - T007-T014
3. ✅ Complete Phase 3 (US1) - T015-T022
4. **STOP and VALIDATE** - Testar US1 isoladamente
5. Deploy/Demo
6. **Próximo**: Ou continuar com US2 (P1) ou ir para Polish

### Incremental Delivery (Recomendado)

1. Phases 1-2 (Setup + Foundational) - **2-3 dias**
2. Phase 3 (US1) - **1-2 dias** → Deploy MVP
3. Phase 4 (US2) - **1 dia** → Deploy
4. Phase 5 (US3) - **1 dia** → Deploy
5. Phase 6 (US4) - **1 dia** → Deploy
6. Phase 7 (US5) - **1-2 dias** → Deploy
7. Phase 8 (Polish) - **1 dia** → Final polish
8. **Total**: ~8-10 dias para feature completa

### Parallel Team (4-5 Developers)

1. Dias 1-2: Todos trabalham em Setup + Foundational
2. Dia 3+: Cada dev pega uma US em paralelo
3. Todos integram no dia final
4. **Total**: ~5-6 dias para feature completa

---

## Task Checklist Format

Todas as tarefas seguem o formato obrigatório:
```
- [ ] [TaskID] [P?] [Story?] Description com arquivo exato
```

✅ **CORRECT**: `- [ ] T015 [P] [US1] Criar componente form src/components/admin/users/UserForm.tsx com React Hook Form`

❌ **WRONG**: `- [ ] Criar form` (sem ID, sem arquivo)

---

## Status & Próximos Passos

✅ **Tasks.md gerado com sucesso**

- Total de 70 tarefas
- Organizadas em 8 phases
- 5 user stories (US1-5, todas P1/P2)
- Tarefas parallelizáveis identificadas [P]
- MVP scope: Phases 1-3 (US1 básico)

**Próximo**: 
1. Iniciar com Phase 1 (Setup) - T001-T006
2. Após concluir Setup, ir para Phase 2 (Foundational) - T007-T014
3. Após Foundational, começar Phase 3 (US1 - MVP)

**Para executar tarefa específica**:
- Copiar descrição da tarefa
- Abrir arquivo mencionado
- Completar conforme descrição
- Marcar ☑️ quando pronto
- Committar com mensagem: `feat(002-gestao-usuarios): T0XX - [descrição]`

**Validação**:
- Cada task deve ser independente e executável
- MVP (US1) deve funcionar isoladamente após Phase 3
- Testar conforme "Independent Test" de cada story

---

**Gerado em**: 2026-06-01  
**Feature Branch**: `002-gestao-usuarios`  
**Baseado em**: plan.md, spec.md, data-model.md, research.md, quickstart.md  
**Conform com**: constitution.md (Portuguese, TypeScript strict, RLS, soft delete, auditoria 100%, zero testes)

