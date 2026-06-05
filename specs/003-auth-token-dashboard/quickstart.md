# Guia de Início Rápido — Armazenamento de Token e Dashboard

**Branch**: `003-auth-token-dashboard` | **Data**: 2026-06-05

## O que Esta Feature Entrega

1. **Token real no cookie de autenticação**: Após login, o JWT do Supabase é armazenado em `__Secure-auth-token`; o middleware passa a validar sessões reais.
2. **Cookie de role**: O role do usuário (`admin` / `coletor`) é persistido em `__Secure-user-role`; a proteção de rotas admin funciona corretamente.
3. **Redirecionamento pós-login**: Já funcionava; confirmado que `LoginForm.tsx` redireciona para `/dashboard`.
4. **Redirecionamento de `/login` para autenticados**: Usuários já logados são redirecionados para `/dashboard` ao acessar `/login`.
5. **Dashboard atualizado**: Exibe dados reais do perfil e mostra link para `/users` apenas para admins.

---

## Arquivos Modificados

```
src/lib/supabase/auth.ts          — signIn() retorna accessToken e role
src/app/api/auth/login/route.ts   — define cookies reais no login
src/middleware.ts                  — corrige redirect de /login para autenticados
src/app/dashboard/page.tsx         — usa getCurrentUser(), link /users para admin
```

---

## Como Testar Manualmente

### Pré-requisito
- Servidor rodando: `npm run dev`
- Supabase configurado com ao menos um usuário admin e um usuário coletor

### Fluxo 1: Login com redirecionamento para dashboard
1. Acesse `http://localhost:3000/login`
2. Faça login com credenciais válidas de um usuário admin
3. **Esperado**: Redirecionamento para `/dashboard`
4. Verifique no DevTools → Application → Cookies: `__Secure-auth-token` deve conter um JWT (não "placeholder"), `__Secure-user-role` deve ser `"admin"`
5. Verifique que o dashboard exibe nome e email corretos do usuário
6. Verifique que o link "Gerenciar Usuários" está visível

### Fluxo 2: Proteção de rota — sem autenticação
1. Abra janela anônima (sem cookies)
2. Acesse `http://localhost:3000/dashboard`
3. **Esperado**: Redirecionamento para `/login`

### Fluxo 3: Redirecionamento de `/login` para autenticados
1. Faça login normalmente (Fluxo 1)
2. Tente acessar `http://localhost:3000/login` diretamente
3. **Esperado**: Redirecionamento automático para `/dashboard`

### Fluxo 4: Proteção de rota admin com usuário coletor
1. Faça login com um usuário cujo role não seja `"admin"`
2. Tente acessar `http://localhost:3000/users`
3. **Esperado**: Redirecionamento para `/dashboard`
4. Verifique que o link "Gerenciar Usuários" **não** está visível no dashboard

### Fluxo 5: Acesso admin à gestão de usuários
1. Faça login com usuário admin (Fluxo 1)
2. Clique no link "Gerenciar Usuários" no dashboard
3. **Esperado**: Navegação para `/users` sem redirecionamento

---

## Estrutura de Cookies Esperada

| Cookie | Valor Esperado | Exemplo |
|--------|---------------|---------|
| `__Secure-auth-token` | JWT Supabase (começa com `eyJ`) | `eyJhbGciOiJIUzI1NiIs...` |
| `__Secure-user-role` | Role do usuário | `admin` ou `coletor` |
| `__Secure-refresh-token` | Refresh token Supabase | `string longa` |
