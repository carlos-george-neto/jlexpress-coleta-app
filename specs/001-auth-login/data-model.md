# Modelo de Dados — Feature 001: Tela de Login

**Data**: 2026-05-31

---

## Entidades

### 1. Tabela `users` (Supabase Auth + Custom)

```sql
-- Criado automaticamente por Supabase Auth
auth.users
  - id: UUID (PK)
  - email: string (unique)
  - encrypted_password: string (gerenciado por Supabase)
  - email_confirmed_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp

-- Extensão customizada (se necessário)
public.user_profiles
  - id: UUID (PK, FK para auth.users.id)
  - full_name: string
  - profile_type: enum ('admin' | 'coletor') — default: 'coletor'
  - is_active: boolean — default: true
  - last_login_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp
```

### 2. Tabela `sessions` (Opcional - para auditoria)

```sql
public.sessions
  - id: UUID (PK)
  - user_id: UUID (FK para users.id)
  - ip_address: string
  - user_agent: string
  - token_jti: string (JWT ID)
  - expires_at: timestamp
  - created_at: timestamp
  - revoked_at: timestamp (NULL se ativa)
```

---

## Relacionamentos

```
users (1) ──→ (N) sessions
       └─→ user_profiles (1:1)
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
  3. Se sucesso: criar session record (auditoria)
  4. Retornar JWT em cookie httpOnly

Output:
  {
    success: boolean,
    user: {
      id: string,
      email: string,
      full_name: string,
      profile_type: string
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
  1. Revocar session (marcar revoked_at)
  2. Limpar cookie de sessão
  3. Revogar refresh token (Supabase)

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
  profileType: 'admin' | 'coletor';
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

### Profile Type
- Enum: 'admin' | 'coletor'
- Default: 'coletor'
- Imutável exceto por admin

---

## Migrações Supabase

```sql
-- Criar tabela de user_profiles (se usando custom fields)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'coletor' CHECK (profile_type IN ('admin', 'coletor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de sessions (para auditoria)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  token_jti TEXT UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

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

- Sessions expiram em 1 hora (configurável)
- Refresh token expira em 7 dias
- Logs de auditoria retidos por 90 dias (futura)
