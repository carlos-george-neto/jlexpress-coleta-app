# Contratos de API: Gestão de Status da Encomenda

**Feature**: 005-gestao-status-encomenda | **Data**: 2026-06-06

**Base URL**: `/api/statuses`

**Autenticação**: Todas as rotas exigem cookie `auth-token` válido. Rotas de escrita (POST, PATCH) exigem `user-role = admin`.

---

## GET `/api/statuses`

Lista status com filtros, busca textual e paginação.

**Permissão**: Qualquer usuário autenticado (leitura de status ativos); admins veem todos.

### Query Parameters

| Parâmetro     | Tipo    | Padrão      | Descrição                                          |
|---------------|---------|-------------|---------------------------------------------------|
| `page`        | number  | `1`         | Número da página (começa em 1)                    |
| `limit`       | number  | `10`        | Registros por página (máx. 100)                   |
| `search`      | string  | —           | Busca por nome ou descrição (case-insensitive)    |
| `is_active`   | boolean | —           | Filtrar por estado ativo/inativo                  |
| `is_exception`| boolean | —           | Filtrar apenas status de exceção                  |
| `is_finalizer`| boolean | —           | Filtrar apenas status finalizadores               |
| `sort_by`     | string  | `flow_order`| Campo de ordenação: `flow_order`, `name`, `created_at` |
| `sort_order`  | string  | `asc`       | Direção: `asc` ou `desc`                          |

### Response 200 OK

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Pendente de Coleta",
      "description": null,
      "is_active": true,
      "requires_observation": false,
      "is_exception": false,
      "is_finalizer": false,
      "flow_order": 1,
      "indicative_color": "#6B7280",
      "created_by": "uuid",
      "updated_by": "uuid",
      "created_at": "2026-06-06T00:00:00Z",
      "updated_at": "2026-06-06T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "pages": 1
  }
}
```

### Response 401 Unauthorized

```json
{ "error": "Não autenticado" }
```

---

## POST `/api/statuses`

Cria um novo status operacional.

**Permissão**: Apenas admin.

### Request Body

```json
{
  "name": "Em Trânsito",
  "description": "Encomenda a caminho do destinatário",
  "requires_observation": false,
  "is_exception": false,
  "is_finalizer": false,
  "flow_order": 8,
  "indicative_color": "#60A5FA"
}
```

| Campo                  | Tipo    | Obrigatório | Validação                                      |
|------------------------|---------|:-----------:|------------------------------------------------|
| `name`                 | string  | Sim         | Não vazio; único entre todos os registros       |
| `description`          | string  | Não         | Opcional                                        |
| `requires_observation` | boolean | Não         | Padrão: `false`                                 |
| `is_exception`         | boolean | Não         | Padrão: `false`                                 |
| `is_finalizer`         | boolean | Não         | Padrão: `false`                                 |
| `flow_order`           | number  | Sim         | Inteiro positivo; duplicatas permitidas         |
| `indicative_color`     | string  | Não         | Formato `#RRGGBB` ou nulo                       |

### Response 201 Created

```json
{
  "status": { /* ShipmentStatus completo */ }
}
```

### Response 400 Bad Request

```json
{ "error": "Nome é obrigatório" }
{ "error": "Ordem do fluxo é obrigatória" }
{ "error": "Nome já cadastrado para outro status" }
{ "error": "Formato de cor inválido. Use #RRGGBB" }
```

### Response 401 Unauthorized / 403 Forbidden

```json
{ "error": "Não autenticado" }
{ "error": "Acesso negado. Apenas administradores." }
```

---

## GET `/api/statuses/[statusId]`

Retorna um status pelo ID.

**Permissão**: Qualquer usuário autenticado.

### Response 200 OK

```json
{
  "status": { /* ShipmentStatus completo */ }
}
```

### Response 404 Not Found

```json
{ "error": "Status não encontrado" }
```

---

## PATCH `/api/statuses/[statusId]`

Atualiza atributos de um status existente. Todos os campos são opcionais — apenas os campos enviados são atualizados.

**Permissão**: Apenas admin.

### Request Body (todos opcionais)

```json
{
  "name": "Em Trânsito Expresso",
  "description": "Entrega expressa",
  "requires_observation": true,
  "is_exception": false,
  "is_finalizer": false,
  "flow_order": 9,
  "indicative_color": "#2563EB",
  "is_active": false
}
```

**Nota**: Enviar `is_active: false` aciona a ação de auditoria `DEACTIVATE`; enviar `is_active: true` aciona `REACTIVATE`.

### Response 200 OK

```json
{
  "status": { /* ShipmentStatus atualizado */ }
}
```

### Response 400 Bad Request

```json
{ "error": "Nome já cadastrado para outro status" }
{ "error": "Formato de cor inválido. Use #RRGGBB" }
```

### Response 403 Forbidden / 404 Not Found

```json
{ "error": "Acesso negado. Apenas administradores." }
{ "error": "Status não encontrado" }
```

---

## GET `/api/statuses/[statusId]/audit-log`

Retorna o histórico de auditoria de um status.

**Permissão**: Apenas admin.

### Query Parameters

| Parâmetro | Tipo   | Padrão | Descrição            |
|-----------|--------|--------|----------------------|
| `page`    | number | `1`    | Página               |
| `limit`   | number | `20`   | Registros por página |

### Response 200 OK

```json
{
  "items": [
    {
      "id": 1,
      "status_id": "uuid",
      "action": "CREATE",
      "old_data": null,
      "new_data": { "name": "Em Trânsito", "is_active": true },
      "performed_by": "uuid",
      "performed_by_email": "admin@jlexpress.com",
      "performed_at": "2026-06-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

## Códigos de Erro Globais

| Código HTTP | Situação                                       |
|:-----------:|------------------------------------------------|
| 400         | Dados de entrada inválidos ou ausentes         |
| 401         | Sem autenticação (cookie ausente ou expirado)  |
| 403         | Usuário autenticado sem permissão de admin     |
| 404         | Recurso não encontrado                         |
| 409         | Conflito de unicidade (nome duplicado)         |
| 500         | Erro interno do servidor                       |
