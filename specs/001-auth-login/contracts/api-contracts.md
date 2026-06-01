# Contratos de API — Feature 001: Tela de Login

**Data**: 2026-05-31

---

## POST /api/auth/login

**Descrição**: Autenticar usuário com e-mail e senha.

### Request

```typescript
Content-Type: application/json

{
  email: string;      // Formato: email válido
  password: string;   // Mínimo 8 caracteres
}
```

### Response — Sucesso (200)

```typescript
{
  success: true;
  user: {
    id: string;           // UUID
    email: string;
    full_name: string;
    profile_type: 'admin' | 'coletor';
    is_active: boolean;
  };
}
```

**Cookies Definidos**:
- `__Secure-auth-token` (JWT, httpOnly, Secure, SameSite=Strict)
- `__Secure-refresh-token` (Refresh Token, httpOnly, Secure, SameSite=Strict)

### Response — Erro 400

```typescript
{
  success: false;
  error: "E-mail ou senha inválidos";
}
```

### Response — Erro 500

```typescript
{
  success: false;
  error: "Falha ao conectar ao servidor";
}
```

---

## POST /api/auth/logout

**Descrição**: Encerrar sessão do usuário autenticado.

### Request

```typescript
Content-Type: application/json
Authorization: Bearer {JWT}

{}
```

### Response — Sucesso (200)

```typescript
{
  success: true;
}
```

**Cookies Deletados**:
- `__Secure-auth-token`
- `__Secure-refresh-token`

### Response — Erro 401

```typescript
{
  success: false;
  error: "Não autenticado";
}
```

---

## POST /api/auth/refresh

**Descrição**: Renovar token JWT usando refresh token.

### Request

```typescript
Content-Type: application/json

{}
```

**Cookies Enviados**:
- `__Secure-refresh-token` (automaticamente)

### Response — Sucesso (200)

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    full_name: string;
    profile_type: 'admin' | 'coletor';
    is_active: boolean;
  };
}
```

**Cookies Definidos**:
- `__Secure-auth-token` (novo JWT)

### Response — Erro 401

```typescript
{
  success: false;
  error: "Sessão expirada. Por favor, faça login novamente.";
}
```

---

## POST /api/auth/reset-password

**Descrição**: Solicitar redefinição de senha (Future - P2).

### Request

```typescript
Content-Type: application/json

{
  email: string;
}
```

### Response — Sucesso (200)

```typescript
{
  success: true;
  message: "E-mail de redefinição enviado para seu endereço registrado";
}
```

---

## GET /api/auth/me

**Descrição**: Obter dados do usuário autenticado.

### Request

```typescript
Authorization: Bearer {JWT}
```

### Response — Sucesso (200)

```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    full_name: string;
    profile_type: 'admin' | 'coletor';
    is_active: boolean;
  };
}
```

### Response — Erro 401

```typescript
{
  success: false;
  error: "Não autenticado";
}
```

---

## Códigos de Status HTTP

| Status | Significado |
|--------|-------------|
| 200 | Sucesso |
| 400 | Requisição inválida (schema, credenciais) |
| 401 | Não autenticado ou token expirado |
| 500 | Erro interno do servidor |

---

## Headers de Segurança

Todas as respostas incluem:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## Tratamento de Erros

### Validação de Email/Senha

```typescript
// Zod Schema
const loginSchema = z.object({
  email: z.string()
    .email("Formato de e-mail inválido")
    .min(1, "E-mail é obrigatório"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .min(1, "Senha é obrigatória"),
});
```

### Mensagens de Erro (pt-BR)

- "Formato de e-mail inválido" — Email não segue RFC 5322
- "Senha é obrigatória" — Campo vazio
- "Senha deve ter no mínimo 8 caracteres" — Muito curta
- "E-mail ou senha inválidos" — Credenciais rejeitadas
- "Falha ao conectar ao servidor" — Erro Supabase/rede
- "Sessão expirada. Por favor, faça login novamente." — Refresh token inválido

---

## Rate Limiting (Recomendado)

Implementar após MVP:

```
POST /api/auth/login: 5 tentativas por IP em 15 minutos
POST /api/auth/reset-password: 3 tentativas por email em 1 hora
```
