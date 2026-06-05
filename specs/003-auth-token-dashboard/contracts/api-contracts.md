# Contratos de API — Armazenamento de Token e Dashboard

**Branch**: `003-auth-token-dashboard` | **Data**: 2026-06-05

## POST /api/auth/login

Realiza a autenticação do usuário e define os cookies de sessão.

### Request

```
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### Response — Sucesso (200)

```json
{
  "success": true,
  "user": {
    "id": "uuid-do-usuario",
    "email": "usuario@exemplo.com",
    "fullName": "Nome Completo",
    "profileType": "admin" | "coletor",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

**Cookies definidos na resposta**:

| Cookie | Valor | Atributos |
|--------|-------|-----------|
| `__Secure-auth-token` | JWT de acesso (access_token) | HttpOnly, SameSite=Strict, MaxAge=604800 |
| `__Secure-user-role` | Role do usuário (ex: `"admin"`) | HttpOnly, SameSite=Strict, MaxAge=604800 |
| `__Secure-refresh-token` | Refresh token | HttpOnly, SameSite=Strict, MaxAge=604800 |

> **Mudança desta feature**: Antes, `__Secure-auth-token` era `"placeholder"`. Agora será o JWT real do Supabase. Os cookies `__Secure-user-role` e `__Secure-refresh-token` são novos.

### Response — Erro de Validação (400)

```json
{
  "success": false,
  "error": "E-mail ou senha inválidos"
}
```

### Response — Erro de Servidor (500)

```json
{
  "success": false,
  "error": "Falha ao conectar ao servidor"
}
```

---

## GET /dashboard (Página)

Rota protegida. Exibe informações do usuário autenticado e link de navegação.

### Proteção

- Verificada pelo middleware via cookie `__Secure-auth-token`
- Se cookie ausente → redirect 302 para `/login`

### Conteúdo da Página

- Dados do usuário: e-mail, nome completo, tipo de perfil, status
- Link "Gerenciar Usuários" → `/users` (visível apenas para `profileType === "admin"`)

---

## Contrato do Middleware

O middleware Next.js (`src/middleware.ts`) aplica as seguintes regras a todas as rotas (exceto assets estáticos):

| Condição | Ação |
|----------|------|
| Sem token + rota protegida (`/dashboard`, `/admin`, `/users`) | Redirect → `/login` |
| Com token + rota pública (`/login`, `/forgot-password`, `/reset-password`) | Redirect → `/dashboard` |
| Com token + rota admin (`/admin`, `/users`) + role ≠ `"admin"` | Redirect → `/dashboard` |
| Com token + rota admin + role = `"admin"` | Prossegue normalmente |
| Com token + rota protegida não-admin | Prossegue normalmente |
| Sem token + rota API (`/api/users/*`) | Retorna 401 JSON |

> **Mudança desta feature**: A regra "Com token + rota pública → `NextResponse.next()`" é corrigida para "→ Redirect `/dashboard`".
