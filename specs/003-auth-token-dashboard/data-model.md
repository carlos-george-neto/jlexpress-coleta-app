# Modelo de Dados — Armazenamento de Token e Dashboard

**Branch**: `003-auth-token-dashboard` | **Data**: 2026-06-05

## Entidades Envolvidas

### 1. AuthSession (Sessão de Autenticação)

Representa os dados retornados pelo Supabase após login bem-sucedido. Não é persistida em banco de dados — é armazenada em cookies HTTP no servidor e no `localStorage` pelo SDK Supabase no cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `accessToken` | `string` | JWT de acesso gerado pelo Supabase Auth |
| `refreshToken` | `string` | Token de renovação de longa duração |
| `expiresIn` | `number` | Segundos até expiração do access token |
| `userId` | `string (UUID)` | ID do usuário autenticado |

### 2. AuthCookies (Cookies de Autenticação)

Cookies HTTP definidos pelo endpoint de login e lidos pelo middleware Next.js.

| Cookie | Conteúdo | HttpOnly | Duração |
|--------|----------|----------|---------|
| `__Secure-auth-token` | `access_token` da sessão Supabase | Sim | 7 dias |
| `__Secure-user-role` | Role do usuário (`"admin"` ou `"coletor"`) | Sim | 7 dias |
| `__Secure-refresh-token` | `refresh_token` da sessão Supabase | Sim | 7 dias |

> **Nota**: O cookie `__Secure-refresh-token` já é limpo no logout (`src/app/api/auth/logout/route.ts`) mas ainda não é definido no login. Esta feature não o inclui no escopo de uso ativo (sem refresh automático server-side), mas é adequado defini-lo para consistência com o logout.

### 3. User (Perfil do Usuário — existente)

Entidade já existente na tabela `public.users` do Supabase. Referenciada nesta feature pelo dashboard e pelo login para obter o role.

| Campo | Tipo | Relevante para Esta Feature |
|-------|------|----------------------------|
| `id` | `UUID` | Identificação do usuário |
| `email` | `text` | Exibição no dashboard |
| `full_name` | `text` | Exibição no dashboard |
| `role` | `text` (`"admin"` / `"collector"` / outros) | Determina cookie `__Secure-user-role` e visibilidade do link /users |
| `is_active` | `boolean` | Bloqueio de login |

---

## Fluxo de Dados Pós-Login

```
LoginForm.tsx
    │ POST { email, password }
    ▼
POST /api/auth/login
    │ chama signIn(email, password)
    ▼
src/lib/supabase/auth.ts :: signIn()
    │ supabase.auth.signInWithPassword() → { session, user }
    │ fetchUserProfile(userId) → { role }
    │ retorna { accessToken, role, user }
    ▼
POST /api/auth/login (continua)
    │ Set-Cookie: __Secure-auth-token = accessToken
    │ Set-Cookie: __Secure-user-role = role
    │ Set-Cookie: __Secure-refresh-token = refreshToken
    ▼
LoginForm.tsx recebe { success: true }
    │ router.push("/dashboard")
    ▼
Middleware Next.js
    │ lê __Secure-auth-token → existe → prossegue
    ▼
DashboardPage
    │ getCurrentUser() → busca perfil completo do Supabase
    │ exibe dados do usuário
    │ se role === "admin" → exibe link para /users
```

---

## Fluxo de Proteção de Rota

```
Usuário acessa /dashboard (sem token)
    │
    ▼
Middleware
    │ authToken === undefined → protectedRoute → redirect /login

Usuário acessa /login (com token)
    │
    ▼
Middleware
    │ authToken existe + publicRoute → redirect /dashboard

Usuário acessa /users (com token, role !== "admin")
    │
    ▼
Middleware
    │ authToken existe + adminRoute + userRole !== "admin" → redirect /dashboard
```
