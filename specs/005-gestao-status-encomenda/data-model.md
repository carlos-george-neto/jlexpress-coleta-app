# Data Model: Gestão de Status da Encomenda

**Feature**: 005-gestao-status-encomenda | **Data**: 2026-06-06

---

## Entidades

### 1. `shipment_statuses`

Representa um estado operacional pelo qual uma encomenda pode passar.

| Coluna               | Tipo             | Restrições                          | Padrão     | Descrição                                      |
|----------------------|------------------|-------------------------------------|------------|------------------------------------------------|
| `id`                 | UUID             | PK, NOT NULL                        | gen_random_uuid() | Identificador único                    |
| `name`               | VARCHAR(100)     | NOT NULL, UNIQUE                    | —          | Nome do status (único, inclusive inativos)     |
| `description`        | TEXT             | —                                   | NULL       | Descrição opcional do status                   |
| `is_active`          | BOOLEAN          | NOT NULL                            | TRUE       | Controla disponibilidade para uso              |
| `requires_observation` | BOOLEAN        | NOT NULL                            | FALSE      | Obriga campo observação em encomendas          |
| `is_exception`       | BOOLEAN          | NOT NULL                            | FALSE      | Indica status de exceção operacional           |
| `is_finalizer`       | BOOLEAN          | NOT NULL                            | FALSE      | Indica que encerra o fluxo da encomenda        |
| `flow_order`         | INTEGER          | NOT NULL                            | —          | Posição na ordenação padrão do fluxo           |
| `indicative_color`   | VARCHAR(7)       | —                                   | NULL       | Cor hex (ex.: `#FF5733`); opcional             |
| `created_by`         | UUID             | FK → public.users(id), SET NULL     | NULL       | Usuário que criou o registro                   |
| `updated_by`         | UUID             | FK → public.users(id), SET NULL     | NULL       | Usuário que atualizou por último               |
| `created_at`         | TIMESTAMPTZ      | NOT NULL                            | NOW()      | Data/hora de criação                           |
| `updated_at`         | TIMESTAMPTZ      | NOT NULL                            | NOW()      | Data/hora da última atualização                |

**Índices**:
- `idx_shipment_statuses_is_active` — filtros de ativos/inativos
- `idx_shipment_statuses_flow_order` — ordenação padrão
- `idx_shipment_statuses_is_exception` — filtro de exceção
- `idx_shipment_statuses_is_finalizer` — filtro de finalizadores
- `idx_shipment_statuses_name` — busca textual e unicidade

**Constraints**:
- UNIQUE(`name`) — unicidade independente de `is_active` (FR-003)
- CHECK(`indicative_color` IS NULL OR `indicative_color` ~ '^#[0-9A-Fa-f]{6}$') — validação de formato hex

**Trigger**: `update_shipment_statuses_updated_at` — atualiza `updated_at` antes de cada UPDATE (reutiliza função `update_updated_at_column()` já existente).

---

### 2. `shipment_status_audit_log`

Registro imutável de cada operação de criação ou modificação de status (FR-009).

| Coluna           | Tipo        | Restrições                              | Padrão  | Descrição                                        |
|------------------|-------------|-----------------------------------------|---------|--------------------------------------------------|
| `id`             | BIGSERIAL   | PK                                      | —       | Identificador sequencial                         |
| `status_id`      | UUID        | NOT NULL, FK → shipment_statuses(id), CASCADE | — | Status auditado                              |
| `action`         | VARCHAR(50) | NOT NULL, CHECK                         | —       | Tipo de operação: CREATE, UPDATE, DEACTIVATE, REACTIVATE |
| `old_data`       | JSONB       | —                                       | NULL    | Snapshot dos valores anteriores                  |
| `new_data`       | JSONB       | —                                       | NULL    | Snapshot dos valores novos                       |
| `performed_by`   | UUID        | NOT NULL, FK → public.users(id), SET NULL | —     | Usuário responsável pela operação                |
| `performed_at`   | TIMESTAMPTZ | NOT NULL                                | NOW()   | Data/hora da operação                            |

**Índices**:
- `idx_status_audit_status_id`
- `idx_status_audit_performed_by`
- `idx_status_audit_performed_at`
- `idx_status_audit_action`

**Constraints**:
- CHECK(`action` IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE'))

**Nota**: Sem trigger automático de banco — auditoria acionada explicitamente em `status.service.ts` para preservar contexto do `performed_by`.

---

## Transições de Estado

```
is_active: TRUE  ←──────── REACTIVATE ──────┐
     │                                       │
     ▼ DEACTIVATE                            │
is_active: FALSE ───────────────────────────►┘
```

- Status criados sempre com `is_active = TRUE`
- Desativação: PATCH `{ is_active: false }` → registra ação `DEACTIVATE`
- Reativação: PATCH `{ is_active: true }` → registra ação `REACTIVATE`
- Exclusão física: bloqueada (FR-010) — API não expõe método DELETE

---

## Seed: 7 Status Operacionais Iniciais (FR-015)

| # | Nome                 | `flow_order` | `is_active` | `requires_observation` | `is_exception` | `is_finalizer` | Cor sugerida |
|---|----------------------|:------------:|:-----------:|:----------------------:|:--------------:|:--------------:|:------------:|
| 1 | Pendente de Coleta   | 1            | TRUE        | FALSE                  | FALSE          | FALSE          | `#6B7280`   |
| 2 | Em Coleta            | 2            | TRUE        | FALSE                  | FALSE          | FALSE          | `#3B82F6`   |
| 3 | Coletado             | 3            | TRUE        | FALSE                  | FALSE          | TRUE           | `#22C55E`   |
| 4 | Coleta Parcial       | 4            | TRUE        | TRUE                   | TRUE           | FALSE          | `#F59E0B`   |
| 5 | Não Coletado         | 5            | TRUE        | TRUE                   | TRUE           | FALSE          | `#EF4444`   |
| 6 | Cancelado            | 6            | TRUE        | TRUE                   | TRUE           | TRUE           | `#991B1B`   |
| 7 | Aguardando Validação | 7            | TRUE        | FALSE                  | FALSE          | FALSE          | `#8B5CF6`   |

**Nota**: Status de exceção (Coleta Parcial, Não Coletado, Cancelado) exigem observação conforme AC-3 da US1.

---

## Tipos TypeScript (`src/lib/types/status.ts`)

```typescript
export type StatusAuditAction = "CREATE" | "UPDATE" | "DEACTIVATE" | "REACTIVATE";

export interface ShipmentStatus {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  requires_observation: boolean;
  is_exception: boolean;
  is_finalizer: boolean;
  flow_order: number;
  indicative_color: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStatusAuditLog {
  id: number;
  status_id: string;
  action: StatusAuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string;
  performed_by_email?: string;
  performed_at: string;
}

export interface ListStatusQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  is_exception?: boolean;
  is_finalizer?: boolean;
  sort_by?: "name" | "flow_order" | "created_at";
  sort_order?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
```

---

## Relação com ÉPICO 4 (Gestão de Encomendas)

A entidade `shipment_statuses` é projetada para ser referenciada por encomendas no ÉPICO 4 sem alteração estrutural (AC-4 da US1):

```sql
-- Referência futura no ÉPICO 4 (não implementada agora):
-- shipments.current_status_id UUID REFERENCES shipment_statuses(id)
```

A política RLS de leitura (qualquer usuário autenticado pode ler status ativos) antecipa essa necessidade.
