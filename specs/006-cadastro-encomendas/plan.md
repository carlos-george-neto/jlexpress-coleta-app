# Implementation Plan: Cadastro de Encomendas

**Branch**: `main` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-cadastro-encomendas/spec.md`

## Summary

Implementar o módulo completo de gestão de encomendas: cadastro, listagem com busca
e filtros, edição por role (admin: dados completos; coletor: somente status), soft
delete e auditoria imutável. A stack é Next.js 16 App Router + TypeScript strict +
Supabase + Tailwind, seguindo os padrões estabelecidos na feature 005.

## Technical Context

**Language/Version**: TypeScript (strict) — Next.js 16.2.6

**Primary Dependencies**: Next.js App Router, Supabase JS v2, Zod 4.x, Tailwind CSS, Lucide Icons

**Storage**: Supabase PostgreSQL — novas tabelas `shipments` e `shipment_audit_log` via `supabase/migrations/20260607000001_create_shipments.sql`

**Testing**: Nenhum (diretiva absoluta da constituição)

**Target Platform**: Web (mobile-first, 320px mínimo)

**Project Type**: Web application — Next.js full-stack

**Performance Goals**: Listagem carrega em < 2s com até 500 encomendas (SC-003)

**Constraints**: TypeScript strict sem `any`; zero dependências externas novas; LGPD

**Scale/Scope**: Operação diária com até 500 encomendas; paginação de 20 itens

## Constitution Check

| Princípio                       | Status | Observação                                          |
|---------------------------------|--------|-----------------------------------------------------|
| Idioma pt-BR (docs/commits)     | ✅     | Plano e artefatos em português                      |
| Zero testes                     | ✅     | Nenhum arquivo de teste será criado                 |
| TypeScript strict                | ✅     | Props tipadas, sem `any` implícito                  |
| Zero dependências novas         | ✅     | Usa Zod já existente, sem novas libs                |
| Componentes funcionais          | ✅     | Apenas function components                          |
| Mobile-first 320px              | ✅     | Tailwind responsivo, padrão do projeto              |
| Separação negócio / UI          | ✅     | Service layer isolado dos componentes               |
| Escopo do spec                  | ✅     | Apenas US1–US6 implementadas                        |
| YAGNI                           | ✅     | Sem abstrações além do necessário                   |

**Resultado**: Nenhuma violação. Aprovado para implementação.

## Project Structure

### Documentation (esta feature)

```text
specs/006-cadastro-encomendas/
├── plan.md              # Este arquivo
├── research.md          # Decisões e justificativas de pesquisa
├── data-model.md        # Modelo de dados e SQL de migração
├── quickstart.md        # Guia de setup e verificação
├── contracts/
│   └── api.md           # Contratos REST dos endpoints
└── tasks.md             # Gerado por /speckit-tasks (ainda não criado)
```

### Source Code

```text
src/
├── app/
│   ├── (protected)/                          [NOVO route group]
│   │   ├── layout.tsx                        [NOVO] verifica autenticação (admin + collector)
│   │   └── encomendas/
│   │       ├── page.tsx                      [NOVO] listagem com busca, filtros, paginação
│   │       ├── nova/
│   │       │   └── page.tsx                  [NOVO] cadastro (admin; redireciona collector)
│   │       └── [id]/
│   │           └── page.tsx                  [NOVO] edição (admin: completo; collector: status)
│   ├── api/
│   │   └── shipments/
│   │       ├── route.ts                      [NOVO] GET list + POST create
│   │       └── [shipmentId]/
│   │           ├── route.ts                  [NOVO] GET + PATCH + DELETE
│   │           └── audit-log/
│   │               └── route.ts              [NOVO] GET audit log
│   └── dashboard/
│       └── page.tsx                          [ALTERAR] adicionar card/link Encomendas
├── components/
│   ├── layout/
│   │   └── Header.tsx                        [ALTERAR] adicionar nav Encomendas para admin+collector
│   └── shipments/
│       ├── ShipmentList.tsx                  [NOVO] tabela de encomendas com paginação
│       ├── ShipmentFilters.tsx               [NOVO] busca textual + filtros por status/transportadora/data
│       ├── ShipmentForm.tsx                  [NOVO] formulário completo (admin)
│       ├── ShipmentStatusUpdate.tsx          [NOVO] formulário simplificado (collector)
│       └── ShipmentAuditLog.tsx              [NOVO] lista de eventos de auditoria
└── lib/
    ├── types/
    │   └── shipment.ts                       [NOVO] interfaces TypeScript
    ├── schemas/
    │   └── shipment.ts                       [NOVO] schemas Zod
    └── services/
        └── shipment.service.ts               [NOVO] regras de negócio + acesso ao banco
```

**Structure Decision**: Single Next.js project (Option 1 adaptado). Segue exatamente
o padrão da feature 005 — types → schemas → service → API routes → pages → components.
O novo route group `(protected)` é o único desvio estrutural, necessário para suportar
acesso de coletor à listagem.

---

## Phase 0: Research (Concluída)

Ver [research.md](research.md) para todas as decisões tomadas:

1. **Route group `(protected)`** — layout que verifica autenticação sem exigir admin
2. **UNIQUE(code, carrier) incondicional** — cobre registros inativos conforme FR-002
3. **Paginação 20 itens** — conforme spec (Assumptions)
4. **Mesma rota `/encomendas/[id]`** — UI adaptativa por role (admin vs. collector)
5. **4 tipos de ação no audit log** — CREATE, FULL_UPDATE, STATUS_UPDATE, DELETE
6. **Campos condicionais** — observations obrigatório por requires_observation; collected_count por is_exception
7. **Soft delete via PATCH** — is_active = false, sem DELETE físico
8. **Header com link Encomendas** — para admin e collector

---

## Phase 1: Design & Contracts (Concluída)

### Data Model

Ver [data-model.md](data-model.md) para:
- Schema SQL completo de `shipments` e `shipment_audit_log`
- Índices, constraints e RLS
- Interfaces TypeScript

### API Contracts

Ver [contracts/api.md](contracts/api.md) para:
- POST /api/shipments
- GET /api/shipments (com filtros)
- GET /api/shipments/[id]
- PATCH /api/shipments/[id]
- DELETE /api/shipments/[id]
- GET /api/shipments/[id]/audit-log

### Quickstart

Ver [quickstart.md](quickstart.md) para SQL de migração e passos de verificação.

---

## Implementation Guidelines

### Service Layer (shipment.service.ts)

Funções a implementar:
- `createShipment(params, performedBy)` — valida unicidade, campos condicionais; registra CREATE
- `getShipmentById(id)` — retorna ShipmentWithStatus ou null
- `updateShipment(id, params, performedBy, role)` — valida por role; registra FULL_UPDATE ou STATUS_UPDATE
- `softDeleteShipment(id, performedBy)` — define is_active=false; registra DELETE
- `listShipments(query)` — filtros combinados, paginação, join com shipment_status
- `listShipmentAuditLog(id, page, limit)` — join com users para email

Padrão de auditoria: fire-and-forget com try/catch (não propaga erro de auditoria).

### API Routes

Helpers de auth em `src/lib/api/auth.ts`:
- `resolveAdminUser()` — autenticado + ativo + role=admin
- `resolveAuthenticatedUser()` — autenticado + ativo (qualquer role)

Role detection no PATCH:
- Admin: pode alterar qualquer campo → registra FULL_UPDATE
- Collector: apenas status_id, observations, collected_count → registra STATUS_UPDATE
- Outras roles: acesso somente leitura (403 no PATCH)

### Pages & Components

**`(protected)/layout.tsx`**:
- Client component (mesmo padrão do admin layout)
- Verifica autenticação; redireciona para /login se não autenticado
- Aceita qualquer role ativa
- Renderiza `<Header role={profile.role} />`

**`encomendas/page.tsx`**:
- Botão "+ Nova Encomenda" visível apenas para admin
- Filtros: busca textual (search), status_id, carrier, arrival_date_from/to
- Tabela com colunas: Código, Transportadora, Destino, Responsável, Status (badge colorido), Data Chegada, Data Coleta
- Paginação (20 itens/página)
- Clique na linha → `/encomendas/[id]`

**`encomendas/nova/page.tsx`**:
- Redireciona collector para /encomendas
- Renderiza ShipmentForm em modo criação

**`encomendas/[id]/page.tsx`**:
- Admin → renderiza ShipmentForm em modo edição (todos os campos) + botão soft delete
- Collector → renderiza ShipmentStatusUpdate (apenas status + condicionais)
- Ambos → renderiza ShipmentAuditLog abaixo do formulário

**`ShipmentForm`**:
- Todos os campos do spec (FR-001)
- Campos condicionais (observations, collected_count) aparecem/somem dinamicamente por status selecionado
- Validação client-side inline + submit → API

**`ShipmentStatusUpdate`**:
- Apenas: select de status, textarea de observations (condicional), input de collected_count (condicional)
- Mesma lógica de campos condicionais

**`ShipmentFilters`**:
- Input de busca (debounced)
- Select de status (status ativos)
- Input de transportadora (texto)
- Date range (data chegada de/até)

**`ShipmentList`**:
- Tabela responsiva
- StatusBadge reutilizado da feature 005 (indicative_color)
- Link para /encomendas/[id] em cada linha

### Header Update

Adicionar ao `navLink` existente:
- Link "Encomendas" visível quando `role === "admin" || role === "collector"`

### Dashboard Update

Adicionar link/card "Gerenciar Encomendas" → `/encomendas` para todos os usuários autenticados.

---

## Complexity Tracking

Nenhuma violação da constituição identificada. Seção não aplicável.
