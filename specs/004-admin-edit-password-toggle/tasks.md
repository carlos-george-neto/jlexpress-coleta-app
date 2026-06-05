# Tasks: Admin Self-Deactivation Block & Toggle de Senha no Login

**Feature**: 004-admin-edit-password-toggle
**Spec**: specs/004-admin-edit-password-toggle/spec.md
**Plan**: specs/004-admin-edit-password-toggle/plan.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências entre si)
- **[Story]**: User story a que a tarefa pertence (US1, US2)
- Caminhos de arquivo exatos incluídos nas descrições

---

## Phase 1: Setup

> Nenhuma tarefa de setup necessária. O projeto já está configurado; esta feature modifica 4 arquivos existentes e não cria nenhum arquivo novo.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Corrigir o endpoint de autenticação e estender o componente Input — pré-requisitos que bloqueiam as user stories respectivas.

**⚠️ CRITICAL**: US1 não pode iniciar até T001 ser concluído; US2 não pode iniciar até T002 ser concluído. T001 e T002 são independentes entre si.

- [X] T001 [P] Corrigir `src/app/api/auth/me/route.ts` para usar `getServerUser()` (cookie `auth-token`) e buscar `role` em `public.users` via `createServerSupabaseClient()`, retornando `{ success: true, user: { id, email, role } }` ou `{ success: false, error: "Não autenticado" }` (401)
- [X] T002 [P] Adicionar prop `rightElement?: React.ReactNode` ao componente `src/components/ui/Input.tsx`: quando presente, substituir os ícones de status (✕/✓) pelo `rightElement` com `absolute right-3 top-1/2 -translate-y-1/2` e adicionar `pr-10` ao input; quando ausente, manter comportamento atual

**Checkpoint**: T001 concluído → US1 pode começar. T002 concluído → US2 pode começar.

---

## Phase 3: User Story 1 — Admin Não Pode Desativar Própria Conta (Priority: P1) 🎯 MVP

**Goal**: Suprimir o botão de desativar conta na tela de edição quando um admin está editando seu próprio perfil.

**Independent Test**: Fazer login como admin, navegar para `/users`, clicar em "Editar" no próprio usuário e verificar que o botão de desativar NÃO aparece; em seguida, clicar em "Editar" em outro usuário e verificar que o botão aparece normalmente.

### Implementation for User Story 1

- [X] T003 [US1] Em `src/app/(admin)/users/[userId]/page.tsx`, adicionar estado `currentUser: { id: string; role: UserRole } | null`, `useEffect` que chama `GET /api/auth/me` ao montar e popula o estado, e envolver a seção de ativação/desativação em `{!(currentUser?.id === userId && currentUser?.role === 'admin') && (...)}`

**Checkpoint**: US1 completamente funcional e testável de forma independente.

---

## Phase 4: User Story 2 — Toggle de Visibilidade da Senha no Login (Priority: P2)

**Goal**: Adicionar botão de toggle Eye/EyeOff ao campo de senha da tela de login.

**Independent Test**: Acessar `/login`, digitar no campo de senha, clicar no ícone de olho e verificar alternância entre senha visível e mascarada; confirmar que o submit funciona normalmente independente do estado do toggle.

### Implementation for User Story 2

- [X] T004 [US2] Em `src/components/auth/LoginForm.tsx`, adicionar estado `const [showPassword, setShowPassword] = useState(false)`, importar `Eye` e `EyeOff` de `lucide-react`, criar botão `type="button"` com `aria-label` dinâmico ("Exibir senha" / "Ocultar senha") e ícone correspondente, e passá-lo como `rightElement` ao `Input` de senha junto com `type={showPassword ? "text" : "password"}`

**Checkpoint**: US2 completamente funcional e testável de forma independente.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação final dos dois fluxos da feature.

- [X] T005 Validar os dois fluxos descritos em `specs/004-admin-edit-password-toggle/quickstart.md` executando `npm run dev` e testando manualmente no browser

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Sem dependências — pode iniciar imediatamente; T001 e T002 são paralelos entre si
- **US1 (Phase 3)**: Depende de T001 (Phase 2 concluído)
- **US2 (Phase 4)**: Depende de T002 (Phase 2 concluído)
- **Polish (Phase 5)**: Depende de T003 (US1 completo) e T004 (US2 completo)

### User Story Dependencies

- **US1 (P1)**: Pode iniciar após T001 — sem dependência de US2
- **US2 (P2)**: Pode iniciar após T002 — sem dependência de US1

### Within Each User Story

- T003 depende de T001 (rota `/api/auth/me` corrigida)
- T004 depende de T002 (prop `rightElement` disponível no `Input`)

### Parallel Opportunities

- T001 e T002 podem ser executados em paralelo (arquivos diferentes, sem dependências)
- T003 e T004 podem ser executados em paralelo após seus pré-requisitos (arquivos diferentes)

---

## Parallel Example

```bash
# Phase 2 — executar em paralelo:
Task T001: "Corrigir src/app/api/auth/me/route.ts"
Task T002: "Estender src/components/ui/Input.tsx com rightElement"

# Phase 3+4 — executar em paralelo após T001 e T002 respectivamente:
Task T003: "Implementar supressão do botão em src/app/(admin)/users/[userId]/page.tsx"
Task T004: "Implementar toggle de senha em src/components/auth/LoginForm.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar T001 (fundação para US1)
2. Completar T003 (US1 completa)
3. **PARAR e VALIDAR**: Testar US1 de forma independente conforme quickstart.md Teste 1
4. Deploy/demo se pronto

### Incremental Delivery

1. T001 + T002 em paralelo → Foundation pronta
2. T003 → US1 pronta → Testar independentemente → Deploy/Demo (MVP!)
3. T004 → US2 pronta → Testar independentemente → Deploy/Demo
4. T005 → Validação final dos dois fluxos

---

## Notes

- Sem testes (constituição do projeto: "Absolutamente não deve haver testes")
- Sem novos arquivos — todas as mudanças em arquivos existentes
- [P] tasks = arquivos diferentes, sem dependências entre si
- Fazer commit após cada tarefa concluída
