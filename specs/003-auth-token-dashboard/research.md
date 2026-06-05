# Pesquisa — Armazenamento de Token e Dashboard

**Branch**: `003-auth-token-dashboard` | **Data**: 2026-06-05

## 1. Estado Atual do Fluxo de Autenticação

### Diagnóstico

O fluxo de login já existe e funciona parcialmente:

1. `LoginForm.tsx` → POST `/api/auth/login` → redirect para `/dashboard` ✓
2. Middleware verifica cookie `__Secure-auth-token` nas rotas protegidas ✓
3. Cookie `__Secure-auth-token` é definido como `"placeholder"` no login ✗
4. Cookie `__Secure-user-role` é verificado no middleware mas **nunca é definido** no login ✗
5. Dashboard existe mas tem `profileType` fixo em `"coletor"` ✗
6. Dashboard não tem link para gestão de usuários ✗
7. Middleware permite acesso a `/login` para usuários já autenticados ✗

### Fluxo da Sessão Supabase

Quando `supabase.auth.signInWithPassword()` é chamado na função `signIn()` em `auth.ts`, o Supabase retorna:
- `data.session.access_token` — JWT de acesso (curta duração, ~1 hora)
- `data.session.refresh_token` — token de renovação (longa duração)
- `data.session.expires_in` — tempo em segundos até expiração

O SDK cliente (`persistSession: true`) armazena esses tokens no `localStorage` do navegador automaticamente. O middleware Next.js (server-side) não tem acesso ao `localStorage`, por isso é necessário também persistir via cookies HTTP.

---

## 2. Decisões de Design

### Decisão 1: Estratégia de Armazenamento de Token

**Decisão**: Armazenar o `access_token` da sessão Supabase em cookie `HttpOnly` `__Secure-auth-token`.

**Justificativa**: A abordagem já existe no projeto — apenas o valor precisa ser corrigido (de "placeholder" para o token real). Introduzir `@supabase/ssr` ou outra biblioteca seria uma dependência desnecessária, violando o princípio "Zero dependências desnecessárias" da constituição.

**Alternativas consideradas**:
- `@supabase/ssr` com `createServerClient` — mais completo mas adiciona dependência; rejeitado por YAGNI
- Armazenar no `localStorage` apenas — impossível acessar no middleware server-side; rejeitado
- Armazenar o JWT completo em cookie não-HttpOnly — inseguro; rejeitado

---

### Decisão 2: Cookie de Role do Usuário

**Decisão**: Definir cookie `__Secure-user-role` com o role do usuário (ex: `"admin"`, `"coletor"`) no endpoint de login.

**Justificativa**: O middleware já verifica esse cookie para proteger rotas admin. O login atual nunca o define, causando falha silenciosa na proteção de rotas admin.

**Alternativas consideradas**:
- Decodificar o JWT no middleware para extrair o role — mais seguro mas mais complexo; rejeitado por simplicidade arquitetural
- Chamada ao banco no middleware — impossível no Edge Runtime do Next.js sem o Supabase client configurado; rejeitado

---

### Decisão 3: Escopo das Mudanças no Dashboard

**Decisão**: Atualizar o `DashboardPage` para:
1. Buscar dados reais do perfil do usuário via `getCurrentUser()` de `auth.ts`
2. Exibir link para `/users` apenas quando `profileType === "admin"`

**Justificativa**: O dashboard já usa `supabase.auth.getUser()` mas não busca dados do perfil (por isso o `profileType` está fixo). A função `getCurrentUser()` já existe em `auth.ts` e já faz o enriquecimento com dados da tabela `public.users`.

---

### Decisão 4: Redirecionamento em `/login` para Autenticados

**Decisão**: No middleware, quando o usuário tem token e acessa uma rota pública como `/login`, redirecionar para `/dashboard`.

**Justificativa**: O middleware atual tem o código:
```ts
if (authToken && publicRoutes.some((route) => pathname.startsWith(route))) {
  return NextResponse.next(); // BUG: deveria redirecionar, não prosseguir
}
```
Isso viola FR-009 da spec. A correção é substituir `NextResponse.next()` por `NextResponse.redirect(new URL("/dashboard", request.url))`.

---

## 3. Escopo das Mudanças

### Arquivos a Modificar (sem criar novos)

| Arquivo | Mudança |
|---------|---------|
| `src/lib/supabase/auth.ts` | `signIn()` retorna `accessToken` e `role` do usuário |
| `src/app/api/auth/login/route.ts` | Usa token real e define cookie `__Secure-user-role` |
| `src/middleware.ts` | Redireciona `/login` → `/dashboard` quando autenticado |
| `src/app/dashboard/page.tsx` | Usa `getCurrentUser()`, exibe link `/users` para admin |

### O que NÃO muda

- Estrutura de rotas (já adequada)
- Supabase clients (já configurados)
- Componentes UI (sem alterações de UI significativas além do link)
- Logout route (já limpa os cookies corretamente)
- Proteção middleware de rotas protegidas → login (já funciona)
- Users page (já funcional)

---

## 4. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Token expira enquanto usuário está logado | Supabase SDK cliente renova automaticamente via `autoRefreshToken: true`; cookie será inválido mas middleware rejeita → redirect para login |
| Cookie `__Secure-` não funciona em HTTP local | Em desenvolvimento (`NODE_ENV !== "production"`), o prefixo `__Secure-` não é aplicado pelo browser — Next.js já usa `secure: process.env.NODE_ENV === "production"` nos cookies |
| Role cookie pode ficar desatualizado se role mudar | Risco aceitável para MVP; na próxima implementação de renovação de sessão o cookie seria atualizado |
