# Data Model: Dashboard Operacional de Coletas

**Branch**: `007-dashboard-coletas` | **Data**: 2026-06-07

## Entidades Referenciadas

Esta feature não cria novas tabelas. Toda a lógica opera sobre as tabelas existentes.

### shipments (existente)

| Campo | Tipo | Relevância para o Dashboard |
|-------|------|-----------------------------|
| id | uuid | Chave primária; usado no link de edição |
| code | text | Exibido no popup (FR-007) |
| carrier | text | Exibido no popup (FR-007) |
| volume_count | integer | Exibido no popup (FR-007) |
| arrival_date | date | Ordenação principal (FR-004); chave de agrupamento no painel admin (FR-014) |
| pickup_date | date | Exibido no popup (FR-007) |
| destination | text | Exibido no popup (FR-007) |
| responsible | text | Critério de filtragem para coletor (FR-002); agrupamento no painel admin (FR-014) |
| status_id | uuid | FK para shipment_status |
| observations | text | Exibido no popup (FR-007) |
| collected_count | integer | Exibido no popup (implícito em FR-007) |
| is_active | boolean | Filtro obrigatório — somente encomendas ativas |

### shipment_status (existente)

| Campo | Tipo | Relevância para o Dashboard |
|-------|------|-----------------------------|
| id | uuid | Chave primária |
| name | text | Critério de filtragem ("Pendente de Coleta", FR-001); exibido no card e popup |
| indicative_color | text | Cor do destaque visual (FR-005); exibida no card, popup e grupos |
| is_exception | boolean | Não usado diretamente no dashboard |
| requires_observation | boolean | Não usado diretamente no dashboard |

---

## Novos Tipos TypeScript (`src/lib/types/dashboard.ts`)

```typescript
// Reutiliza ShipmentWithStatus de src/lib/types/shipment.ts

export interface ActivityEntry {
  collector: string;           // valor de shipments.responsible
  shipments: ShipmentSummary[];
}

export interface ShipmentSummary {
  id: string;
  code: string;
  carrier: string;
  destination: string;
  status_name: string;
  indicative_color: string | null;
  observations: string | null;
  arrival_date: string;
  pickup_date: string | null;
}

export interface ActivityByDate {
  arrival_date: string;        // formato YYYY-MM-DD
  entries: ActivityEntry[];    // agrupado por responsible
}
```

---

## Queries do Dashboard (`src/lib/services/dashboard.service.ts`)

### Query 1 — Dashboard do Coletor

Retorna todas as encomendas ativas onde:
- o status se chama "Pendente de Coleta" (case-insensitive), **OU**
- o campo `responsible` corresponde ao nome completo do coletor logado (case-insensitive)

Sem duplicatas (encomenda que satisfaz ambos aparece uma única vez).
Ordenadas por `arrival_date ASC`.

```sql
-- Equivalente Supabase (pseudocódigo da lógica de service):
SELECT DISTINCT s.*, ss.id, ss.name, ss.indicative_color, ss.is_exception,
       ss.requires_observation, ss.is_finalizer
FROM shipments s
JOIN shipment_status ss ON ss.id = s.status_id
WHERE s.is_active = true
  AND (
    LOWER(ss.name) = 'pendente de coleta'
    OR LOWER(s.responsible) = LOWER(:userFullName)
  )
ORDER BY s.arrival_date ASC
```

**Implementação via Supabase JS**:
- Buscar IDs de status cujo `name ILIKE 'pendente de coleta'`
- Fazer query com `.or('status_id.in.(...),responsible.ilike.:name')`
- Aplicar `.order('arrival_date', { ascending: true })`
- Aplicar `.eq('is_active', true)`
- Join com `shipment_status` via `select('*, shipment_status(*)')`

**Assinatura do service**:
```typescript
export async function getCollectorDashboardShipments(
  userFullName: string
): Promise<ShipmentWithStatus[]>
```

---

### Query 2 — Painel Administrativo

Retorna todas as encomendas ativas, com join no status, ordenadas por `arrival_date DESC`.
O service agrupa os resultados por `arrival_date`, e dentro de cada data por `responsible`.

```sql
SELECT s.id, s.code, s.carrier, s.destination, s.responsible,
       s.arrival_date, s.pickup_date, s.observations,
       ss.name as status_name, ss.indicative_color
FROM shipments s
JOIN shipment_status ss ON ss.id = s.status_id
WHERE s.is_active = true
ORDER BY s.arrival_date DESC
```

**Assinatura do service**:
```typescript
export async function getAdminDashboardActivities(): Promise<ActivityByDate[]>
```

**Lógica de agrupamento** (no service, não no componente):
1. Resultado flat do Supabase → agrupar por `arrival_date`
2. Dentro de cada data → agrupar por `responsible`
3. Ordenar datas decrescente (mais recente primeiro)
4. Retornar `ActivityByDate[]`

---

## Lógica de Agrupamento Visual no Coletor

O componente `CollectorDashboard` recebe `ShipmentWithStatus[]` já ordenadas por
`arrival_date ASC` e aplica agrupamento visual por status:

1. Separar encomendas com `status.name ILIKE 'pendente de coleta'` → grupo prioritário
2. Demais encomendas → agrupadas por `status.name` em ordem de aparição
3. Renderizar grupo "Pendente de Coleta" primeiro, depois os demais grupos

Este agrupamento é puramente visual/renderização — não altera os dados.

---

## Transições de Estado Visíveis no Dashboard

Após o coletor editar uma encomenda e retornar ao dashboard (FR-012):

| Novo status | responsible continua = usuário | Aparece no dashboard? |
|-------------|--------------------------------|-----------------------|
| Pendente de Coleta | qualquer | ✅ Sim (FR-001) |
| Qualquer status | Sim | ✅ Sim (FR-002) |
| Outro status | Não | ❌ Não (removido da lista) |

O dashboard não faz polling automático. A remoção ocorre na próxima navegação ao
dashboard ou ao recarregar manualmente (spec: "O dashboard não implementa atualização
automática").
