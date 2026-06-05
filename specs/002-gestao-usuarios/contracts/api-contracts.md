# Contratos de API: Gestão de Usuários

**Feature**: 002-gestao-usuarios  
**Data**: 2026-06-01  
**Base**: REST API (Next.js)  

---

## Resumo de Endpoints

| Método | Rota | Descrição | Auth | RBAC |
|--------|------|-----------|------|------|
| POST | `/api/users` | Criar novo usuário | ✅ | Admin |
| GET | `/api/users` | Listar usuários com filtro/paginação | ✅ | Admin |
| GET | `/api/users/:userId` | Obter detalhes de usuário | ✅ | Admin ou Self |
| PUT | `/api/users/:userId` | Editar usuário | ✅ | Admin |
| DELETE | `/api/users/:userId` | Soft delete (desativar) | ✅ | Admin |
| POST | `/api/users/:userId/reset-password` | Reset de senha | ✅ | Admin |
| GET | `/api/users/:userId/audit-log` | Histórico de auditoria | ✅ | Admin |
| GET | `/api/users/validate-email` | Validar email único | ✅ | Admin |

---

## Endpoints Detalhados

### 1. POST `/api/users` — Criar Novo Usuário

Cria um novo usuário no sistema.

**Request**:

```http
POST /api/users HTTP/1.1
Content-Type: application/json
Authorization: Bearer {session_token}

{
  "email": "novousuario@jlexpress.com",
  "full_name": "João Silva",
  "role": "collector",
  "password": "SenhaForte123!@"
}
```

**Request Body Schema** (Zod):

```typescript
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  full_name: z.string().min(3).max(255),
  role: z.enum(['admin', 'collector', 'deliverer', 'user']),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*]/),
});
```

**Response (201 Created)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "novousuario@jlexpress.com",
    "full_name": "João Silva",
    "role": "collector",
    "is_active": true,
    "created_at": "2026-06-01T10:30:00Z",
    "created_by": "admin-user-id"
  }
}
```

**Error Response (400 Bad Request)**:

```json
{
  "success": false,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Email já cadastrado no sistema"
}
```

**Error Response (401 Unauthorized)**:

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Autenticação necessária"
}
```

**Error Response (403 Forbidden)**:

```json
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Apenas administradores podem criar usuários"
}
```

**Status Codes**:
- `201 Created` — Usuário criado com sucesso
- `400 Bad Request` — Validação falhou ou email duplicado
- `401 Unauthorized` — Token inválido/expirado
- `403 Forbidden` — Usuário não é admin
- `500 Internal Server Error` — Erro do servidor

---

### 2. GET `/api/users` — Listar Usuários

Retorna lista paginada de usuários com filtros opcionais.

**Request**:

```http
GET /api/users?page=1&limit=10&search=joão&role=collector&is_active=true HTTP/1.1
Authorization: Bearer {session_token}
```

**Query Parameters**:
- `page` (number, default: 1) — Página (1-indexed)
- `limit` (number, default: 10, max: 100) — Registros por página
- `search` (string) — Busca por name ou email (case-insensitive)
- `role` (enum) — Filtro por role: `admin|collector|deliverer|user`
- `is_active` (boolean) — Filtro por status: `true|false`
- `sort_by` (string, default: `created_at`) — Campo de ordenação: `email|full_name|created_at|is_active`
- `sort_order` (enum, default: `desc`) — `asc|desc`

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "joao@jlexpress.com",
        "full_name": "João Silva",
        "role": "collector",
        "is_active": true,
        "created_at": "2026-05-15T09:00:00Z",
        "updated_at": "2026-05-20T14:30:00Z",
        "last_login_at": "2026-06-01T08:45:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

**Error Response (401/403)**: Idem POST `/api/users`

---

### 3. GET `/api/users/:userId` — Obter Detalhes

Retorna dados completos de um usuário específico.

**Request**:

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer {session_token}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao@jlexpress.com",
    "full_name": "João Silva",
    "role": "collector",
    "is_active": true,
    "created_at": "2026-05-15T09:00:00Z",
    "created_by": "admin-id-1",
    "updated_at": "2026-05-20T14:30:00Z",
    "updated_by": "admin-id-2",
    "last_login_at": "2026-06-01T08:45:00Z"
  }
}
```

**Error Response (404 Not Found)**:

```json
{
  "success": false,
  "error": "USER_NOT_FOUND",
  "message": "Usuário não encontrado"
}
```

---

### 4. PUT `/api/users/:userId` — Editar Usuário

Atualiza dados de um usuário existente.

**Request**:

```http
PUT /api/users/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Content-Type: application/json
Authorization: Bearer {session_token}

{
  "full_name": "João Carlos Silva",
  "role": "deliverer",
  "email": "joao.carlos@jlexpress.com"
}
```

**Request Body Schema** (Zod):

```typescript
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  full_name: z.string().min(3).max(255).optional(),
  role: z.enum(['admin', 'collector', 'deliverer', 'user']).optional(),
}).refine(obj => Object.keys(obj).length > 0, 'Nenhum campo para atualizar');
```

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao.carlos@jlexpress.com",
    "full_name": "João Carlos Silva",
    "role": "deliverer",
    "is_active": true,
    "updated_at": "2026-06-01T11:00:00Z",
    "updated_by": "admin-id"
  }
}
```

**Error Response (409 Conflict)**:

```json
{
  "success": false,
  "error": "EMAIL_ALREADY_EXISTS",
  "message": "Email já está cadastrado para outro usuário"
}
```

---

### 5. DELETE `/api/users/:userId` — Soft Delete (Desativar)

Desativa um usuário (soft delete) — não remove dados do banco.

**Request**:

```http
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Authorization: Bearer {session_token}

{
  "reason": "Funcionário desligado da empresa"
}
```

**Request Body**:
- `reason` (string, optional) — Motivo da desativação (registrado em auditoria)

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Usuário desativado com sucesso",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "joao@jlexpress.com",
    "is_active": false,
    "updated_at": "2026-06-01T11:05:00Z"
  }
}
```

**Efeito Colateral**:
- Usuário não consegue fazer login após desativação
- Dados persistem no banco (auditoria)
- Pode ser reativado com PUT (setando `is_active: true` — não implementado na Phase 1)

---

### 6. POST `/api/users/:userId/reset-password` — Reset de Senha

Inicia fluxo de reset de senha. Supabase envia link por e-mail.

**Request**:

```http
POST /api/users/550e8400-e29b-41d4-a716-446655440000/reset-password HTTP/1.1
Content-Type: application/json
Authorization: Bearer {session_token}

{
  "redirect_url": "https://app.jlexpress.com/reset-password"
}
```

**Request Body**:
- `redirect_url` (string, optional) — URL para redirecionamento após reset (default: env var)

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Link de reset enviado para o email do usuário",
  "data": {
    "email": "joao@jlexpress.com",
    "reset_link_sent_at": "2026-06-01T11:10:00Z"
  }
}
```

**Fluxo**:
1. Admin clica em "Reset Password" na UI
2. POST `/api/users/:userId/reset-password` é chamado
3. Backend chama `admin.auth.generateLink({ type: 'recovery', email: ... })`
4. Supabase envia e-mail com link de reset (TTL 1 hora)
5. Usuário clica link no e-mail → vai para página `/reset-password?token=...`
6. Usuário define nova senha → POST `/api/auth/reset-password` (da Feature 001)

---

### 7. GET `/api/users/:userId/audit-log` — Histórico de Auditoria

Retorna todas as alterações de um usuário.

**Request**:

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000/audit-log?page=1&limit=20 HTTP/1.1
Authorization: Bearer {session_token}
```

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `action` (enum, optional) — Filtro por tipo: `CREATE|UPDATE|DELETE|PASSWORD_RESET|ACTIVATE|DEACTIVATE`

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1001,
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "action": "UPDATE",
        "old_data": {
          "full_name": "João Silva",
          "role": "collector"
        },
        "new_data": {
          "full_name": "João Carlos Silva",
          "role": "deliverer"
        },
        "performed_by": "admin-id",
        "performed_by_email": "admin@jlexpress.com",
        "performed_at": "2026-06-01T11:00:00Z",
        "reason": null
      },
      {
        "id": 1000,
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "action": "CREATE",
        "old_data": null,
        "new_data": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "email": "joao@jlexpress.com",
          "full_name": "João Silva",
          "role": "collector",
          "is_active": true
        },
        "performed_by": "admin-id",
        "performed_by_email": "admin@jlexpress.com",
        "performed_at": "2026-05-15T09:00:00Z",
        "reason": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

---

### 8. GET `/api/users/validate-email` — Validar Email Único

Valida se email já existe (resposta imediata para feedback em tempo real).

**Request**:

```http
GET /api/users/validate-email?email=novouser@jlexpress.com HTTP/1.1
Authorization: Bearer {session_token}
```

**Query Parameters**:
- `email` (string, required) — Email a validar
- `exclude_user_id` (UUID, optional) — ID de usuário para excluir da validação (ao editar)

**Response (200 OK) — Email disponível**:

```json
{
  "success": true,
  "available": true,
  "email": "novouser@jlexpress.com"
}
```

**Response (200 OK) — Email já existe**:

```json
{
  "success": true,
  "available": false,
  "email": "novousuario@jlexpress.com",
  "message": "Email já cadastrado"
}
```

---

## Regras de Autorização

**Matriz de Permissões**:

| Ação | Admin | Usuário Comum | Não Autenticado |
|------|-------|---------------|-----------------|
| Criar usuário | ✅ | ❌ | ❌ |
| Listar usuários | ✅ | ❌ | ❌ |
| Ver detalhes own | ✅ (todos) | ✅ (self) | ❌ |
| Editar usuário | ✅ | ❌ | ❌ |
| Desativar usuário | ✅ | ❌ | ❌ |
| Reset senha | ✅ | ❌ | ❌ |
| Ver audit log | ✅ | ❌ | ❌ |
| Validar email | ✅ | ❌ | ❌ |

**Implementação**:
- Middleware protege todas as rotas com `/@admin` group
- Service layer verifica `user.role === 'admin'`
- RLS no banco de dados garante segunda linha de defesa

---

## Tratamento de Erros Padrão

Todos os endpoints retornam estrutura de erro consistente:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descrição do erro em português",
  "details": {} // opcional, para erros de validação
}
```

**Códigos de Erro Comuns**:
- `UNAUTHORIZED` (401) — Autenticação requerida
- `INSUFFICIENT_PERMISSIONS` (403) — Não é admin
- `VALIDATION_ERROR` (400) — Falha na validação de schema
- `EMAIL_ALREADY_EXISTS` (409) — Email duplicado
- `USER_NOT_FOUND` (404) — Usuário não existe
- `INTERNAL_SERVER_ERROR` (500) — Erro do servidor

---

## Rate Limiting

- **Limite padrão**: 100 requisições por minuto por user
- **Endpoints sensíveis** (POST, PUT, DELETE): 10 requisições por minuto

---

## Versionamento

Endpoints não têm versão de URL (v1/, v2/) — use HTTP headers se necessário escalonar:

```http
Accept: application/vnd.jlexpress.v1+json
```

---

**Status**: ✅ Contratos finalizados

**Última Atualização**: 2026-06-01 11:15 UTC
