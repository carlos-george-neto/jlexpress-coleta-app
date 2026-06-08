# Contratos de API: Dashboard Operacional de Coletas

**Branch**: `007-dashboard-coletas` | **Data**: 2026-06-07

---

## GET /api/dashboard/shipments

Retorna as encomendas relevantes para o dashboard do coletor autenticado.
A filtragem é server-side com base no perfil do usuário do JWT.

### Autenticação
Qualquer usuário autenticado (`resolveAuthenticatedUser`).

### Query Params
Nenhum.

### Resposta — Sucesso (200)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "EX-001",
        "carrier": "Correios",
        "volume_count": 3,
        "arrival_date": "2026-06-07",
        "pickup_date": "2026-06-10",
        "destination": "Almoxarifado Central",
        "responsible": "João Silva",
        "status_id": "uuid",
        "observations": null,
        "collected_count": null,
        "is_active": true,
        "created_by": "uuid",
        "updated_by": null,
        "created_at": "2026-06-07T10:00:00Z",
        "updated_at": "2026-06-07T10:00:00Z",
        "shipment_status": {
          "id": "uuid",
          "name": "Pendente de Coleta",
          "indicative_color": "#F59E0B",
          "is_exception": false,
          "requires_observation": false,
          "is_finalizer": false
        }
      }
    ],
    "total": 12
  }
}
```

### Resposta — Não Autenticado (401)

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Não autenticado"
}
```

### Resposta — Erro Interno (500)

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Erro interno do servidor"
}
```

### Notas de Implementação

- Busca o `full_name` do usuário autenticado via `auth.profile.full_name`
- Filtra `is_active = true`
- Condição OR: `shipment_status.name ILIKE 'pendente de coleta'` OU `responsible ILIKE :fullName`
- Deduplicação via `DISTINCT` na query
- Ordenação: `arrival_date ASC`

---

## GET /api/dashboard/activities

Retorna as atividades de coleta para o painel administrativo, agrupadas por data de chegada.

### Autenticação
Somente administrador (`resolveAdminUser`).

### Query Params
Nenhum.

### Resposta — Sucesso (200)

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "arrival_date": "2026-06-07",
        "entries": [
          {
            "collector": "João Silva",
            "shipments": [
              {
                "id": "uuid",
                "code": "EX-001",
                "carrier": "Correios",
                "destination": "Almoxarifado Central",
                "status_name": "Coletado",
                "indicative_color": "#10B981",
                "observations": "Entregue com avaria leve",
                "arrival_date": "2026-06-07",
                "pickup_date": "2026-06-07"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Resposta — Não Autenticado (401)

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Não autenticado"
}
```

### Resposta — Sem Permissão (403)

```json
{
  "success": false,
  "error": "INSUFFICIENT_PERMISSIONS",
  "message": "Acesso negado"
}
```

### Resposta — Erro Interno (500)

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Erro interno do servidor"
}
```

### Notas de Implementação

- Filtra `is_active = true`
- Sem filtro de período (todas as encomendas ativas)
- Agrupamento server-side por `arrival_date` DESC, depois por `responsible`
- Retorna `ActivityByDate[]` conforme `src/lib/types/dashboard.ts`

---

## Contratos de Componentes

### CollectorDashboard

```typescript
interface CollectorDashboardProps {
  userFullName: string;
}
```

- Busca dados via `GET /api/dashboard/shipments`
- Agrupa encomendas por status (visual), priorizando "Pendente de Coleta"
- Renderiza cards com destaque cromático (`indicative_color`)
- Abre `ShipmentQuickViewModal` ao clicar em um card

### AdminDashboard

```typescript
interface AdminDashboardProps {
  // sem props — busca dados internamente
}
```

- Busca dados via `GET /api/dashboard/activities`
- Renderiza seções por `arrival_date`
- Cada seção lista coletores e suas encomendas com link para edição

### ShipmentQuickViewModal

```typescript
interface ShipmentQuickViewModalProps {
  shipment: ShipmentWithStatus;
  onClose: () => void;
}
```

- Modal com overlay `fixed inset-0`
- Exibe todos os campos definidos em FR-007
- Link "Editar" navega para `/encomendas/[id]`
- Fecha ao clicar fora (click no overlay) ou no botão de fechar
- Sem recarga da listagem ao fechar (FR-009)
