# Modelo de Dados — Feature 001: Tela de Login

**Data**: 2026-05-31

---

## Entidades

### 1. Tabela `auth.users` (Supabase Auth)

```sql
-- Gerenciado pelo Supabase Auth
auth.users
  - id: UUID (PK)
  - email: string (unique)
  - encrypted_password: string (gerenciado por Supabase)
  - email_confirmed_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp
```

### 2. Tabela `public.users` (Dados de Negócio)

Os dados de perfil do usuário (nome, role, status) são armazenados em `public.users` com FK para `auth.users(id)`. Ver modelo completo em `specs/002-gestao-usuarios/data-model.md`.

---

## Relacionamentos

```
auth.users (1) ──→ (1) public.users
```

---

## Fluxo de Autenticação

### Login (POST /api/auth/login)

```
Input:
  {
    email: string,
    password: string
  }

Process:
  1. Validar schema (Zod)
  2. Chamar Supabase signInWithPassword
  3. Retornar JWT em cookie httpOnly

Output:
  {
    success: boolean,
    user: {
      id: string,
      email: string,
      full_name: string,
      role: string
    },
    error?: string
  }

Erros:
  - 400: Email/senha inválidos
  - 500: Erro de servidor
```

### Logout (POST /api/auth/logout)

```
Input:
  { }

Process:
  1. Limpar cookie de sessão
  2. Revogar refresh token (Supabase)

Output:
  { success: true }
```

### Refresh Token (POST /api/auth/refresh)

```
Input:
  { } (refresh token via cookie)

Process:
  1. Validar refresh token (Supabase)
  2. Gerar novo JWT
  3. Retornar em cookie httpOnly

Output:
  { success: boolean, user: User | null }
```

---

## Tipos TypeScript

```typescript
// User type
interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'collector' | 'deliverer' | 'user';
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Auth state
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Login input
interface LoginInput {
  email: string;
  password: string;
}

// API responses
interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}
```

---

## Validações

### Email
- Formato válido (RFC 5322)
- Unique constraint no banco
- Case-insensitive para login

### Senha
- Mínimo 8 caracteres
- Hash com bcrypt (Supabase)
- Nunca armazenar em plain text

### Role
- Enum: 'admin' | 'collector' | 'deliverer' | 'user'
- Default: 'user'
- Imutável exceto por admin

---

## Migrações Supabase

As migrações de banco de dados estão em `supabase/migrations/`. A criação das tabelas de usuário (`public.users`) e auditoria (`public.user_audit_log`) é feita nas migrations da feature 002. Ver `specs/002-gestao-usuarios/data-model.md` para detalhes do schema.

**Padrão RLS obrigatório**: todas as policies devem usar `auth.jwt() ->> 'user_role'` e `auth.jwt() ->> 'user_is_active'` em vez de sub-queries em `public.users`. Ver migration `20260601000003_fix_rls_jwt_claims.sql` e `20260607000002_fix_rls_shipments_jwt_claims.sql`.

---

## Estado da Sessão

A sessão é mantida via:
1. **JWT em cookie httpOnly** — Seguro contra XSS
2. **Refresh token em cookie separado** — Para renovação
3. **Middleware Next.js** — Valida em cada requisição

```
Cookie: __Secure-auth-token (JWT)
Cookie: __Secure-refresh-token (Refresh)
```

---

## Retenção de Dados

- JWT expira em 1 hora (configurável via Supabase)
- Refresh token expira em 7 dias
- Logs de auditoria retidos por 90 dias (futura)
