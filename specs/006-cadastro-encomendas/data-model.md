# Data Model: Cadastro de Encomendas

**Feature**: 006-cadastro-encomendas | **Date**: 2026-06-07

## Entidades

### 1. `shipments` (Encomendas)

Representa um item físico disponível para coleta.

```sql
CREATE TABLE IF NOT EXISTS public.shipments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT        NOT NULL,
  carrier         TEXT        NOT NULL,
  volume_count    INTEGER     NOT NULL CHECK (volume_count >= 1),
  arrival_date    DATE        NOT NULL,
  pickup_date     DATE,
  destination     TEXT        NOT NULL,
  responsible     TEXT        NOT NULL,
  status_id       UUID        NOT NULL REFERENCES public.shipment_status(id),
  observations    TEXT,
  collected_count INTEGER     CHECK (collected_count >= 0),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_shipment_code_carrier UNIQUE (code, carrier)
);

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Campos e Validações**:

| Campo            | Tipo     | Obrigatório  | Validação                                                        |
|------------------|----------|-------------|------------------------------------------------------------------|
| `id`             | UUID     | gerado      | PK auto-gerada                                                   |
| `code`           | TEXT     | sim         | Não vazio; único por transportadora (inclusive inativos)         |
| `carrier`        | TEXT     | sim         | Não vazio                                                        |
| `volume_count`   | INTEGER  | sim         | >= 1                                                             |
| `arrival_date`   | DATE     | sim         | Não nulo                                                         |
| `pickup_date`    | DATE     | não         | Se informado: >= arrival_date                                    |
| `destination`    | TEXT     | sim         | Não vazio                                                        |
| `responsible`    | TEXT     | sim         | Não vazio; texto livre (não referência a usuário)                |
| `status_id`      | UUID     | sim         | FK → shipment_status(id); status deve ter is_active = true       |
| `observations`   | TEXT     | condicional | Obrigatório quando status.requires_observation = true            |
| `collected_count`| INTEGER  | condicional | Obrigatório quando status.is_exception = true; 0 ≤ v ≤ volume_count |
| `is_active`      | BOOLEAN  | sim         | Default TRUE; FALSE = soft deleted                               |
| `created_by`     | UUID     | nullable    | FK → users(id); nulo permitido no banco; enforçado como obrigatório na service layer |
| `updated_by`     | UUID     | nullable    | FK → users(id); nulo permitido no banco; enforçado como obrigatório na service layer |

**Índices adicionais** (além do UNIQUE e PK):
```sql
CREATE INDEX IF NOT EXISTS idx_shipments_status_id    ON public.shipments(status_id);
CREATE INDEX IF NOT EXISTS idx_shipments_is_active    ON public.shipments(is_active);
CREATE INDEX IF NOT EXISTS idx_shipments_arrival_date ON public.shipments(arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier      ON public.shipments(carrier);
```

**Transições de Estado** (via `status_id`):
- Qualquer status ativo pode ser atribuído na criação
- Admin pode transicionar para qualquer status ativo na edição completa
- Coletor pode transicionar para qualquer status ativo; se `is_exception = true`,
  os campos `observations` e `collected_count` tornam-se obrigatórios

---

### 2. `shipment_audit_log` (Auditoria de Encomendas)

Registro imutável de cada operação relevante sobre encomendas.

```sql
CREATE TABLE IF NOT EXISTS public.shipment_audit_log (
  id           BIGSERIAL   PRIMARY KEY,
  shipment_id  UUID        NOT NULL REFERENCES public.shipments(id),
  action       TEXT        NOT NULL,
  old_data     JSONB,
  new_data     JSONB,
  performed_by UUID        NOT NULL REFERENCES public.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT shipment_audit_action_check CHECK (
    action IN ('CREATE', 'FULL_UPDATE', 'STATUS_UPDATE', 'DELETE')
  )
);

CREATE INDEX IF NOT EXISTS idx_shipment_audit_shipment_id  ON public.shipment_audit_log(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_audit_performed_at ON public.shipment_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_audit_action       ON public.shipment_audit_log(action);
```

**Campos**:

| Campo          | Tipo        | Descrição                                                            |
|----------------|-------------|----------------------------------------------------------------------|
| `id`           | BIGSERIAL   | PK auto-incrementada                                                 |
| `shipment_id`  | UUID        | FK → shipments(id)                                                   |
| `action`       | TEXT        | `CREATE` / `FULL_UPDATE` / `STATUS_UPDATE` / `DELETE`                |
| `old_data`     | JSONB       | Snapshot completo do registro antes da operação (null em CREATE)     |
| `new_data`     | JSONB       | Snapshot completo do registro após a operação (null em DELETE lógico)  |
| `performed_by` | UUID        | FK → users(id); quem executou                                        |
| `performed_at` | TIMESTAMPTZ | Data/hora da operação                                                |

**Regras de Imutabilidade**:
- Nenhum UPDATE ou DELETE físico sobre `shipment_audit_log`
- Acesso de escrita apenas via `supabaseAdmin` no service
- RLS Supabase: SELECT para usuários autenticados; INSERT/UPDATE/DELETE bloqueados a nível de policy

---

## Relacionamentos

```
users
  ↑ created_by, updated_by, performed_by
  │
shipments ──── status_id ──→ shipment_status
  │
  └── id ──→ shipment_audit_log.shipment_id
```

---

## Tipos TypeScript (src/lib/types/shipment.ts)

```typescript
export type ShipmentAuditAction = "CREATE" | "FULL_UPDATE" | "STATUS_UPDATE" | "DELETE";

export interface Shipment {
  id: string;
  code: string;
  carrier: string;
  volume_count: number;
  arrival_date: string;       // ISO date string "YYYY-MM-DD"
  pickup_date: string | null;
  destination: string;
  responsible: string;
  status_id: string;
  observations: string | null;
  collected_count: number | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentWithStatus extends Shipment {
  shipment_status: {
    id: string;
    name: string;
    indicative_color: string | null;
    is_exception: boolean;
    requires_observation: boolean;
    is_finalizer: boolean;
  };
}

export interface ShipmentAuditLog {
  id: number;
  shipment_id: string;
  action: ShipmentAuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string;
  performed_by_email?: string;
  performed_at: string;
}

export interface ListShipmentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status_id?: string;
  carrier?: string;
  arrival_date_from?: string;
  arrival_date_to?: string;
  sort_by?: "arrival_date" | "pickup_date" | "carrier" | "status_id";
  sort_order?: "asc" | "desc";
}
```
