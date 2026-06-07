# Implementation Plan: Gestão de Status da Encomenda

**Branch**: `005-gestao-status-encomenda` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-gestao-status-encomenda/spec.md`

## Summary

Implementação do catálogo de status operacionais de encomendas, com CRUD administrativo completo (criar, listar com filtros e busca, editar e desativar via soft delete), auditoria de todas as operações, seed com 7 status iniciais via migration e integração ao painel administrativo. A abordagem replica os padrões estabelecidos pelos épicos anteriores: separação em camadas `types/` → `services/` → `api/` → `components/`, auditoria via tabela de log, RLS no Supabase e middleware de autenticação existente.

## Technical Context

**Language/Version**: TypeScript strict (Next.js App Router, Node.js 18+)

**Primary Dependencies**: Next.js (App Router), Supabase JS v2, Tailwind CSS, Lucide React

**Storage**: Supabase PostgreSQL — duas novas tabelas: `shipment_statuses` e `shipment_status_audit_log`

**Testing**: Nenhum — proibido pela constituição

**Target Platform**: Web application (mobile-first, 320px mín), dark theme conforme `design-system.md`

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: Listagem carrega em < 2s com até 100 registros (SC-002); paginação server-side

**Constraints**: Mobile-first 320px mínimo; WCAG AA; zero novas dependências (seletor de cor via `<input type="color">` nativo); TypeScript strict; sem `any` implícito; LGPD — entidade de status não contém dados pessoais

**Scale/Scope**: ~100 registros esperados; tráfego baixo (operação interna administrativa)

## Constitution Check

| Gate | Status | Observação |
|------|:------:|------------|
| Idioma pt-BR em docs/commits/PRs | APROVADO | Todo artefato em português |
| Zero testes (unitários/integração/e2e) | APROVADO | Nenhum test será criado |
| TypeScript strict — zero `any` implícito | APROVADO | Tipos explícitos em `src/lib/types/status.ts` |
| Stack restrita (Next.js + Supabase + Tailwind + Lucide) | APROVADO | Sem novas dependências; `<input type="color">` nativo para seleção de cor |
| Clean Code / YAGNI | APROVADO | Sem abstrações além do necessário; replica padrão existente |
| Mobile-first 320px mín | APROVADO | Responsivo desde a listagem |
| Acessibilidade WCAG AA | APROVADO | `aria-label` em todos os links e botões |
| Escopo restrito ao spec.md ativo | APROVADO | Nenhum recurso além dos FRs listados |

*Sem violações — nenhuma justificativa necessária.*

## Project Structure

### Documentation (this feature)

```text
specs/005-gestao-status-encomenda/
├── plan.md              # Este arquivo
├── research.md          # Decisões técnicas — Phase 0
├── data-model.md        # Modelo de dados — Phase 1
├── quickstart.md        # Guia de configuração — Phase 1
├── contracts/
│   └── api.md           # Contratos de API REST — Phase 1
└── tasks.md             # Gerado por /speckit-tasks (não por /speckit-plan)
```

### Source Code

```text
src/
├── app/
│   ├── (admin)/
│   │   └── statuses/
│   │       ├── page.tsx              # Listagem de status (FR-005, FR-006, FR-007)
│   │       ├── new/
│   │       │   └── page.tsx          # Cadastro de status (FR-002, FR-004)
│   │       └── [statusId]/
│   │           └── page.tsx          # Edição de status (FR-008, FR-010)
│   ├── api/
│   │   └── statuses/
│   │       ├── route.ts              # GET (listagem), POST (criar)
│   │       └── [statusId]/
│   │           ├── route.ts          # GET (individual), PATCH (atualizar/desativar)
│   │           └── audit-log/
│   │               └── route.ts      # GET log de auditoria (FR-009)
│   └── dashboard/
│       └── page.tsx                  # Atualizado: link "Gerenciar Status" para admin (FR-014)
├── components/
│   └── admin/
│       └── statuses/
│           ├── StatusList.tsx        # Tabela com badges de estado e cor
│           ├── StatusForm.tsx        # Formulário criar/editar com seletor de cor nativo
│           ├── StatusFilters.tsx     # Filtros combináveis + busca textual
│           └── StatusBadge.tsx       # Badge reutilizável de estado (ativo/inativo/exceção)
├── lib/
│   ├── services/
│   │   └── status.service.ts         # CRUD completo + auditoria
│   └── types/
│       └── status.ts                 # ShipmentStatus, StatusAuditLog, ListStatusQuery
└── supabase/
    └── migrations/
        ├── 20260606000001_create_shipment_statuses.sql   # Tabela + RLS + trigger
        └── 20260606000002_seed_shipment_statuses.sql     # 7 status iniciais (idempotente)
```

**Structure Decision**: Web application seguindo o padrão `/admin/users` já implementado, com separação em `services/`, `types/`, `components/admin/` e rotas API dedicadas. Sem novos padrões arquiteturais.

## Complexity Tracking

*Sem violações da constituição — não aplicável.*
