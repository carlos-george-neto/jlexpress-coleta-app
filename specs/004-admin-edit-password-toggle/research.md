# Pesquisa: Admin Self-Deactivation Block & Toggle de Senha no Login

**Feature**: 004-admin-edit-password-toggle | **Data**: 2026-06-05

---

## Decisão 1 — Identificação do Usuário Logado no Servidor

**Decisão**: Corrigir `/api/auth/me` para usar `getServerUser()` de `server.ts` (lê cookie httpOnly `auth-token`) em vez de `getCurrentUser()` de `auth.ts` (que usa `supabase.auth.getSession()` — inacessível no servidor por depender de localStorage).

**Motivação**: `getCurrentUser()` foi projetado para uso no cliente (browser). Em rotas de API do Next.js App Router (servidor), não há `localStorage`, então `getSession()` retorna nulo e a rota sempre responde 401. O padrão correto já existe: `getServerUser()` em `server.ts` valida o JWT via `supabase.auth.getUser(token)` usando o cookie `auth-token`.

**Alternativas descartadas**:
- Usar `supabase.auth.getSession()` no servidor → não funciona sem localStorage
- Ler cookie `user-role` no cliente → cookie é `httpOnly`, inacessível via JavaScript
- Armazenar `user-id` em cookie não-httpOnly → risco de segurança desnecessário

---

## Decisão 2 — Exposição da Role do Usuário Logado

**Decisão**: O endpoint `/api/auth/me` corrigido retorna `{ id, email, role }` buscando o perfil em `public.users` via `createServerSupabaseClient()` (service role) após validar o JWT.

**Motivação**: `getServerUser()` retorna apenas o `User` do `auth.users` (sem role). A role está em `public.users`. O mesmo padrão de busca já é usado em outros endpoints da API (ex.: `users/[userId]/route.ts`).

**Alternativas descartadas**:
- Ler role do JWT/metadata → não armazenado no Supabase JWT por padrão neste projeto
- Cookie `user-role` no cliente → httpOnly, inacessível via JavaScript

---

## Decisão 3 — Lógica de Supressão do Botão de Desativar

**Decisão**: No componente `EditUserPage` (`src/app/(admin)/users/[userId]/page.tsx`), adicionar um `useEffect` que chama `GET /api/auth/me` ao montar. O resultado popula um estado `currentUser: { id, role } | null`. A seção de ativação/desativação (botão + confirmação) é renderizada condicionalmente: suprimida quando `currentUser?.id === userId && currentUser?.role === 'admin'`.

**Motivação**: Abordagem mínima, sem novo componente ou contexto global. A comparação ocorre exclusivamente no frontend (spec define proteção no frontend como entrega principal). Ambas condições (próprio usuário + role admin) são necessárias para evitar falsos negativos.

**Alternativas descartadas**:
- Middleware bloqueando PATCH/DELETE → fora de escopo, spec menciona como complemento futuro
- Context global de usuário → over-engineering (YAGNI), não usado em nenhuma outra tela

---

## Decisão 4 — Toggle de Visibilidade de Senha

**Decisão**: Extender o componente `Input` com prop opcional `rightElement?: React.ReactNode`. Quando presente, substitui os ícones de status (✕/✓) dentro do wrapper relativo. Em `LoginForm.tsx`, adicionar `useState(false)` para `showPassword` e passar o botão Eye/EyeOff como `rightElement` ao `Input` de senha.

**Ícones**: `lucide-react` (já instalado) — `Eye` e `EyeOff`.

**Motivação**: Reutiliza o componente `Input` existente com modificação mínima. O campo de senha no login não exibe ícone de sucesso/erro visual (apenas texto de erro abaixo), portanto não há conflito com os status icons. Manter lógica de estado no `LoginForm` respeita a separação entre componente de UI (`Input`) e lógica de negócio.

**Alternativas descartadas**:
- Novo `PasswordInput` component → duplica estilos do `Input`, viola YAGNI
- Renderizar toggle fora do `Input` → difícil alinhar visualmente com o campo
- `onTogglePassword` callback no `Input` → mistura responsabilidades no componente UI

---

## Decisão 5 — Acessibilidade do Toggle

**Decisão**: O botão de toggle terá `type="button"` (evita submit acidental), `aria-label` dinâmico ("Exibir senha" / "Ocultar senha"), e será focável via teclado (`tabIndex` padrão).

**Motivação**: Requisito da spec (edge case) e alinhado com o gate de acessibilidade mínima da constituição (WCAG AA básico).
