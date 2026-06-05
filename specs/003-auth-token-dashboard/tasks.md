---

description: "Task list for feature 003-auth-token-dashboard"
---

# Tasks: Armazenamento de Token e Dashboard

**Input**: Design documents from `/specs/003-auth-token-dashboard/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api-contracts.md ✓, quickstart.md ✓

**Tests**: N/A — sem testes conforme constituição do projeto.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes. Apenas 4 arquivos modificados; nenhum arquivo novo criado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode executar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: A qual user story a tarefa pertence (US1, US2, US3)
- Caminhos de arquivo incluídos em todas as descrições

---

## Phase 1: Setup (Estado Atual)

**Purpose**: Revisar o estado atual dos 4 arquivos que serão modificados antes de iniciar as mudanças

- [X] T001 Revisar estado atual de `src/lib/supabase/auth.ts`, `src/app/api/auth/login/route.ts`, `src/middleware.ts` e `src/app/dashboard/page.tsx` para confirmar ponto de partida

---

## Phase 2: Foundational (Pré-requisito para US1)

**Purpose**: Modificar `signIn()` em `auth.ts` para expor os tokens da sessão — bloqueia a implementação do endpoint de login (US1)

**⚠️ CRÍTICO**: A tarefa T003 (US1) não pode começar até esta fase estar completa

- [X] T002 Atualizar `signIn()` em `src/lib/supabase/auth.ts` para retornar `accessToken`, `refreshToken` e `role` além dos campos já existentes, e adicionar esses campos ao tipo de retorno da função

**Checkpoint**: `signIn()` retorna `{ success, accessToken, refreshToken, role, user }` — US1 pode iniciar

---

## Phase 3: User Story 1 — Login com Redirecionamento para Dashboard (Priority: P1) 🎯 MVP

**Goal**: Após login bem-sucedido, o token JWT real é armazenado em cookie HTTP e o usuário é redirecionado para `/dashboard`

**Independent Test**: Fazer login com credenciais válidas → verificar no DevTools que `__Secure-auth-token` contém um JWT real (começa com `eyJ`), que `__Secure-user-role` está definido e que o redirecionamento para `/dashboard` ocorre

### Implementation para User Story 1

- [X] T003 [US1] Atualizar `src/app/api/auth/login/route.ts` para usar `result.accessToken`, `result.role` e `result.refreshToken` retornados por `signIn()` e definir os três cookies `__Secure-auth-token`, `__Secure-user-role` e `__Secure-refresh-token` com `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "strict"` e `maxAge: 60 * 60 * 24 * 7`

**Checkpoint**: US1 funcional — login define cookies reais; validar com Fluxo 1 do quickstart.md

---

## Phase 4: User Story 2 — Proteção de Rotas Autenticadas (Priority: P1)

**Goal**: Usuários autenticados que acessam `/login` são redirecionados para `/dashboard`; usuários sem token são bloqueados em rotas protegidas

**Independent Test**: Abrir janela anônima e acessar `/dashboard` diretamente → deve redirecionar para `/login`; estando logado, acessar `/login` → deve redirecionar para `/dashboard`

### Implementation para User Story 2

- [X] T004 [P] [US2] Corrigir `src/middleware.ts`: substituir `return NextResponse.next()` por `return NextResponse.redirect(new URL("/dashboard", request.url))` no bloco que verifica `authToken && publicRoutes`

**Checkpoint**: US2 funcional — validar com Fluxos 2 e 3 do quickstart.md

---

## Phase 5: User Story 3 — Tela de Dashboard com Acesso à Gestão de Usuários (Priority: P2)

**Goal**: Dashboard exibe dados reais do perfil do usuário e mostra link para `/users` apenas para admins

**Independent Test**: Logar como admin → verificar que nome e email reais são exibidos e que o link "Gerenciar Usuários" está visível; logar como coletor → verificar que o link não aparece

### Implementation para User Story 3

- [X] T005 [P] [US3] Atualizar `src/app/dashboard/page.tsx`: substituir `supabase.auth.getUser()` por `getCurrentUser()` importado de `@/lib/supabase/auth`, remover o `profileType: "coletor"` fixo em código, e adicionar o link condicional `{user.profileType === "admin" && <Link href="/users">Gerenciar Usuários</Link>}` com `aria-label="Ir para a tela de gestão de usuários"` e classes Tailwind `text-blue-600 hover:text-blue-700 font-medium`

**Checkpoint**: US3 funcional — validar com Fluxos 4 e 5 do quickstart.md

---

## Phase 6: Polish & Validação

**Purpose**: Validação completa do fluxo integrado entre as três user stories

- [ ] T006 Executar todos os 5 fluxos do `specs/003-auth-token-dashboard/quickstart.md` para validar a integração completa: login → cookies → dashboard → link admin → proteção de rotas

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências — pode iniciar imediatamente
- **Foundational (Phase 2)**: Depende do Setup — BLOQUEIA US1 (T003)
- **User Story 1 (Phase 3)**: Depende da Foundational — T003 precisa do retorno atualizado de `signIn()`
- **User Story 2 (Phase 4)**: Depende apenas do Setup — INDEPENDENTE de US1 e Foundational
- **User Story 3 (Phase 5)**: Depende apenas do Setup — INDEPENDENTE de US1, US2 e Foundational
- **Polish (Phase 6)**: Depende de todas as user stories estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: Depende de T002 (Foundational) — `route.ts` precisa dos tokens de `signIn()`
- **User Story 2 (P1)**: Independente — `middleware.ts` não depende de nenhuma outra tarefa
- **User Story 3 (P2)**: Independente — `dashboard.tsx` usa `getCurrentUser()` que já existe em `auth.ts`

### Within Each User Story

- US1: T002 deve estar completo antes de T003
- US2: T004 pode executar em qualquer momento após T001
- US3: T005 pode executar em qualquer momento após T001

### Parallel Opportunities

- Após T002 (Foundational): T003, T004, T005 podem todos ser iniciados em paralelo por desenvolvedores diferentes (arquivos distintos, sem conflito)
- T004 (middleware.ts) e T005 (dashboard.tsx) são completamente independentes entre si e de T003

---

## Parallel Example: Após Foundational

```
Após T002 concluído:
  → Desenvolvedor A: T003 — src/app/api/auth/login/route.ts (US1)
  → Desenvolvedor B: T004 — src/middleware.ts (US2)
  → Desenvolvedor C: T005 — src/app/dashboard/page.tsx (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Concluir Phase 1: Setup (T001)
2. Concluir Phase 2: Foundational (T002) — CRÍTICO
3. Concluir Phase 3: User Story 1 (T003)
4. **PARAR e VALIDAR**: Testar Fluxo 1 do quickstart.md
5. Entregar/demonstrar MVP

### Incremental Delivery

1. Setup + Foundational → base pronta
2. US1 (T003) → login com token real → validar Fluxo 1 → MVP!
3. US2 (T004) → proteção de rotas → validar Fluxos 2 e 3
4. US3 (T005) → dashboard enriquecido → validar Fluxos 4 e 5
5. Polish (T006) → validação completa integrada

---

## Notes

- [P] = arquivo diferente, sem dependência — pode executar em paralelo
- [Story] mapeia a tarefa para a user story para rastreabilidade
- Nenhum novo arquivo criado — todas as mudanças são dentro de arquivos existentes
- Zero novas dependências — constraint da constituição
- Sem testes — constraint da constituição
- Validar por quickstart.md após cada user story
