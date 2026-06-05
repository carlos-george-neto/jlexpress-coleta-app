# Plano de Implementação: Admin Self-Deactivation Block & Toggle de Senha

**Branch**: `main` | **Data**: 2026-06-05 | **Spec**: specs/004-admin-edit-password-toggle/spec.md

## Resumo

Duas melhorias independentes: (1) ocultar o botão de desativação de conta na tela de edição quando um admin está editando seu próprio perfil, e (2) adicionar um botão de toggle de visibilidade de senha na tela de login. Ambas são puramente frontend, sem alterações de banco de dados.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 5 (strict mode)

**Dependências primárias**: Next.js 16 (App Router), React 19, Supabase JS v2, react-hook-form, zod, lucide-react, Tailwind CSS v4

**Armazenamento**: Supabase (PostgreSQL) — sem alterações de schema nesta feature

**Testes**: Nenhum (constituição: "Absolutamente não deve haver testes")

**Plataforma alvo**: Web browser (mobile-first, 320px mínimo)

**Tipo de projeto**: Aplicação web (Next.js App Router, SSR + client components)

**Metas de performance**: Sem metas específicas — UI reativa sem delay perceptível (FR-004/SC-004)

**Restrições**: Proteção apenas no frontend (spec define como entrega principal); controles de backend são complementares e fora de escopo

**Escala/Escopo**: 4 arquivos modificados, 0 arquivos novos

## Verificação da Constituição

*GATE: Deve passar antes da pesquisa (Phase 0). Re-verificado após design (Phase 1).*

| Gate | Status | Observação |
|------|--------|------------|
| Sem testes | ✅ PASS | Nenhum teste criado |
| Sem dependências desnecessárias | ✅ PASS | `lucide-react` já instalado |
| TypeScript strict | ✅ PASS | Props tipadas com interfaces |
| Componentes funcionais | ✅ PASS | Sem class components |
| Sem lógica de negócio em UI | ✅ PASS | Toggle state fica no LoginForm; regra de supressão na page |
| YAGNI | ✅ PASS | Sem abstrações além do necessário |
| Mobile-first / Acessibilidade | ✅ PASS | `aria-label` dinâmico no toggle; navegação por teclado |
| Documentação em pt-BR | ✅ PASS | Commits e docs em português |

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/004-admin-edit-password-toggle/
├── plan.md         # Este arquivo
├── research.md     # Phase 0 — decisões de pesquisa
├── data-model.md   # Phase 1 — entidades e contratos
├── quickstart.md   # Phase 1 — como testar
└── tasks.md        # Phase 2 — gerado por /speckit-tasks
```

### Código-fonte (alterações)

```text
src/
├── app/
│   ├── api/auth/me/
│   │   └── route.ts                        # CORRIGIR: auth via cookie server-side
│   └── (admin)/users/[userId]/
│       └── page.tsx                        # MODIFICAR: suprimir botão desativar para admin
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx                   # MODIFICAR: toggle de senha
│   └── ui/
│       └── Input.tsx                       # MODIFICAR: prop rightElement
```

**Decisão de estrutura**: Opção 2 (web app Next.js). Sem arquivos novos — todas as mudanças são em arquivos existentes, respeitando o princípio de simplicidade arquitetural.

## Detalhes de Implementação

### Tarefa 1 — Corrigir /api/auth/me (bloqueante para Tarefa 3)

**Arquivo**: `src/app/api/auth/me/route.ts`

**Problema**: `getCurrentUser()` usa `supabase.auth.getSession()` (cliente — lê localStorage). Em rota de API (servidor), localStorage não existe; rota sempre retorna 401.

**Solução**:
1. Importar `getServerUser` de `@/lib/supabase/server`
2. Importar `createServerSupabaseClient` de `@/lib/supabase/server`
3. Chamar `getServerUser()` para validar o JWT via cookie `auth-token`
4. Usar `createServerSupabaseClient()` para buscar `role` em `public.users`
5. Retornar `{ success: true, user: { id, email, role } }`

```ts
// Resposta de sucesso
{ success: true, user: { id: string, email: string, role: UserRole } }

// Erro 401
{ success: false, error: "Não autenticado" }
```

---

### Tarefa 2 — Estender Input com rightElement (bloqueante para Tarefa 4)

**Arquivo**: `src/components/ui/Input.tsx`

**Mudança**: Adicionar `rightElement?: React.ReactNode` à interface `InputProps`.

Quando `rightElement` está presente:
- Não renderiza os ícones de status (✕/✓) — são mutuamente exclusivos
- Renderiza `rightElement` no lugar, com `absolute right-3 top-1/2 -translate-y-1/2`
- Adiciona `pr-10` ao input para evitar sobreposição de texto com o elemento

Quando `rightElement` está ausente:
- Comportamento idêntico ao atual (compatibilidade total)

---

### Tarefa 3 — Suprimir botão de desativar para admin (depende de Tarefa 1)

**Arquivo**: `src/app/(admin)/users/[userId]/page.tsx`

**Mudança**:
1. Adicionar estado: `const [currentUserId, setCurrentUserId] = useState<string | null>(null)`
2. `useEffect` no mount: `GET /api/auth/me` → `setCurrentUserId(data.user.id)`; também armazenar `currentUserRole`
3. Calcular flag: `const isOwnAdminProfile = currentUserId === userId && currentUserRole === 'admin'`
4. Envolver a seção de ativação/desativação (botão + bloco de confirmação) em `{!isOwnAdminProfile && (...)}`

**Comportamento durante carregamento do usuário atual**: enquanto `currentUserId` é null, o botão permanece visível (fail-open — não bloqueia o fluxo se o fetch falhar). A spec define a restrição como proteção de UX, não como controle de acesso crítico.

---

### Tarefa 4 — Toggle de senha no LoginForm (depende de Tarefa 2)

**Arquivo**: `src/components/auth/LoginForm.tsx`

**Mudança**:
1. Adicionar estado: `const [showPassword, setShowPassword] = useState(false)`
2. Importar `Eye`, `EyeOff` de `lucide-react`
3. Criar o botão de toggle:
   ```tsx
   <button
     type="button"
     onClick={() => setShowPassword((v) => !v)}
     aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
     className="text-gray-400 hover:text-gray-600"
   >
     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
   </button>
   ```
4. Passar ao `Input` de senha:
   - `type={showPassword ? "text" : "password"}`
   - `rightElement={<botão acima>}`

---

## Rastreamento de Complexidade

> Nenhuma violação da constituição identificada. Seção vazia conforme protocolo.

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Fetch de `/api/auth/me` pode falhar (rede/timeout) | Fail-open: botão desativar permanece visível se fetch falhar |
| Usuário Admin sem registro em `public.users` | `getServerUser()` retorna null → route retorna 401 → `currentUserId` permanece null → botão visível |
| Toggle de senha pode confundir usuários com senha longa | Estado mascarado por padrão (FR-006); ícone diferenciado (Eye/EyeOff) satisfaz FR-007 |
