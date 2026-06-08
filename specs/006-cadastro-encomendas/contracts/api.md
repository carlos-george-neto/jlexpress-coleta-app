# API Contracts: Cadastro de Encomendas

**Feature**: 006-cadastro-encomendas | **Date**: 2026-06-07

Todos os endpoints seguem o padrão de resposta do projeto:
- Sucesso: `{ success: true, data: {...} }`
- Paginado: `{ success: true, data: { items: [...], pagination: {...} } }`
- Erro: `{ success: false, error: "CODE", message: "...", details?: {...} }`

---

## POST /api/shipments

Cadastra uma nova encomenda. Apenas administradores.

### Request Body

```json
{
  "code": "ENC-001",
  "carrier": "Transportes XYZ",
  "volume_count": 5,
  "arrival_date": "2026-06-10",
  "pickup_date": "2026-06-12",
  "destination": "Armazém Central",
  "responsible": "João Silva",
  "status_id": "uuid-do-status",
  "observations": null,
  "collected_count": null
}
```

### Validações

- `code`: string não vazia
- `carrier`: string não vazia
- `volume_count`: inteiro >= 1
- `arrival_date`: data ISO válida (YYYY-MM-DD)
- `pickup_date`: data ISO >= arrival_date (opcional)
- `destination`: string não vazia
- `responsible`: string não vazia
- `status_id`: UUID de status ativo existente
- `observations`: obrigatório se status.requires_observation = true
- `collected_count`: obrigatório se status.is_exception = true; 0 ≤ v ≤ volume_count
- Combinação code + carrier deve ser única (inclusive inativos)

### Responses

**201 Created**
```json
{
  "success": true,
  "data": { "shipment": { /* Shipment completo */ } }
}
```

**400 Bad Request** — validação falhou
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos",
  "details": { "message": "Código já cadastrado para esta transportadora" }
}
```

**401 Unauthorized** — não autenticado

**403 Forbidden** — perfil não é admin

---

## GET /api/shipments

Lista encomendas ativas com paginação, busca e filtros. Qualquer usuário autenticado ativo.

### Query Parameters

| Parâmetro          | Tipo   | Padrão        | Descrição                                              |
|--------------------|--------|---------------|--------------------------------------------------------|
| `page`             | number | 1             | Página atual                                           |
| `limit`            | number | 20            | Itens por página (máx 100)                             |
| `search`           | string | —             | Busca textual em code, carrier, destination, responsible|
| `status_id`        | UUID   | —             | Filtro por status                                      |
| `carrier`          | string | —             | Filtro exato por transportadora                        |
| `arrival_date_from`| date   | —             | Data de chegada >= (YYYY-MM-DD)                        |
| `arrival_date_to`  | date   | —             | Data de chegada <= (YYYY-MM-DD)                        |
| `sort_by`          | string | arrival_date  | Campo de ordenação                                     |
| `sort_order`       | string | desc          | asc ou desc                                            |

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "ENC-001",
        "carrier": "Transportes XYZ",
        "volume_count": 5,
        "arrival_date": "2026-06-10",
        "pickup_date": "2026-06-12",
        "destination": "Armazém Central",
        "responsible": "João Silva",
        "status_id": "uuid",
        "observations": null,
        "collected_count": null,
        "is_active": true,
        "created_at": "2026-06-07T12:00:00Z",
        "updated_at": "2026-06-07T12:00:00Z",
        "shipment_status": {
          "id": "uuid",
          "name": "Aguardando Coleta",
          "indicative_color": "#3B82F6",
          "is_exception": false,
          "requires_observation": false,
          "is_finalizer": false
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  }
}
```

**401 Unauthorized**

---

## GET /api/shipments/[shipmentId]

Retorna uma encomenda pelo ID. Qualquer usuário autenticado ativo.

### Response 200

```json
{
  "success": true,
  "data": {
    "shipment": { /* ShipmentWithStatus completo */ }
  }
}
```

**401 Unauthorized** | **404 Not Found**

---

## PATCH /api/shipments/[shipmentId]

Atualiza uma encomenda. Comportamento diferente por role:
- **Admin**: pode alterar qualquer campo
- **Coletor**: pode alterar apenas `status_id`, `observations`, `collected_count`

O tipo de auditoria registrado:
- Admin → `FULL_UPDATE`
- Coletor → `STATUS_UPDATE`

### Request Body (Admin — todos os campos)

```json
{
  "code": "ENC-001",
  "carrier": "Transportes XYZ",
  "volume_count": 5,
  "arrival_date": "2026-06-10",
  "pickup_date": "2026-06-12",
  "destination": "Armazém Central",
  "responsible": "João Silva",
  "status_id": "uuid-do-status",
  "observations": "Observação opcional",
  "collected_count": null
}
```

### Request Body (Coletor — apenas campos de status)

```json
{
  "status_id": "uuid-do-status",
  "observations": "Motivo da exceção",
  "collected_count": 3
}
```

### Responses

**200 OK**
```json
{
  "success": true,
  "data": { "shipment": { /* atualizado */ } }
}
```

**400 Bad Request** — validação

**401 Unauthorized** | **403 Forbidden** | **404 Not Found**

---

## DELETE /api/shipments/[shipmentId]

Soft delete de uma encomenda. Apenas administradores. Define `is_active = false`.

### Response 200

```json
{
  "success": true,
  "message": "Encomenda removida com sucesso"
}
```

**401 Unauthorized** | **403 Forbidden** | **404 Not Found**

---

## GET /api/shipments/[shipmentId]/audit-log

Retorna o histórico de auditoria de uma encomenda. Qualquer usuário autenticado ativo.

### Query Parameters

| Parâmetro | Tipo   | Padrão | Descrição       |
|-----------|--------|--------|-----------------|
| `page`    | number | 1      | Página atual    |
| `limit`   | number | 20     | Itens por página|

### Response 200

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "shipment_id": "uuid",
        "action": "CREATE",
        "old_data": null,
        "new_data": { /* snapshot */ },
        "performed_by": "uuid",
        "performed_by_email": "admin@example.com",
        "performed_at": "2026-06-07T12:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
  }
}
```

**401 Unauthorized** | **404 Not Found**

---

## Códigos de Erro

| Código                    | HTTP | Descrição                                          |
|---------------------------|------|----------------------------------------------------|
| `UNAUTHORIZED`            | 401  | Não autenticado                                    |
| `INSUFFICIENT_PERMISSIONS`| 403  | Perfil sem permissão para esta ação                |
| `NOT_FOUND`               | 404  | Encomenda não encontrada                           |
| `VALIDATION_ERROR`        | 400  | Dados inválidos (detalhes no campo `details`)      |
| `DUPLICATE_CODE_CARRIER`  | 409  | Código + transportadora já existem                 |
| `STATUS_INACTIVE`         | 422  | Status selecionado não está ativo                  |
| `INTERNAL_SERVER_ERROR`   | 500  | Erro interno                                       |
