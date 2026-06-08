# Implementation Plan: Dashboard Operacional de Coletas

**Branch**: `007-dashboard-coletas` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-dashboard-coletas/spec.md`

## Summary

Implementar o dashboard operacional de coletas com dois painéis distintos por perfil:
(1) o coletor vê encomendas relevantes (status "Pendente de Coleta" ou sob sua responsabilidade)
agrupadas por status com popup de visualização rápida e acesso direto à edição;
(2) o administrador vê um painel de atividades dos coletores organizado por data de chegada.
A abordagem técnica migra a rota `/dashboard` para o grupo `(protected)`, cria endpoints
dedicados em `/api/dashboard/` e novos componentes de dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) | Next.js App Router 16.2.6 | React 19.2.4

**Primary Dependencies**: Next.js App Router, Tailwind CSS, Supabase JS Client, Lucide React

**Storage**: Supabase PostgreSQL — tabelas `shipments`, `shipment_status`, `users`

**Testing**: Nenhum (diretiva constitucional absoluta)

**Target Platform**: Web (mobile-first 320px+, WCAG AA)

**Project Type**: Aplicação web full-stack (Next.js com API Routes)

**Performance Goals**:
- Dashboard do coletor: < 2s com até 200 registros (SC-001)
- Popup de visualização rápida: < 500ms após acionamento (SC-003)
- Painel administrativo: < 3s com dados de até 30 dias (SC-007)

**Constraints**: Mobile-first (320px mínimo), WCAG AA, zero dependências novas, TypeScript strict

**Scale/Scope**: ~200 encomendas no dashboard do coletor; visão completa (sem filtro de período) no painel admin

## Constitution Check

*GATE: Deve passar antes da Phase 0. Re-verificado após Phase 1.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| Idioma PT-BR (documentação, commits, comentários) | ✅ PASSA | Todo o plano e artefatos em PT-BR |
| Zero testes | ✅ PASSA | Nenhum teste será criado |
| TypeScript strict, zero `any` implícito | ✅ PASSA | Todas as interfaces tipadas explicitamente |
| Componentes funcionais apenas | ✅ PASSA | Nenhum class component |
| Props tipadas com interfaces em types dedicado | ✅ PASSA | Novos tipos em `src/lib/types/dashboard.ts` |
| Sem lógica de negócio em componentes de UI | ✅ PASSA | Lógica no service e API routes |
| Zero dependências além das listadas na stack | ✅ PASSA | Sem novas dependências |
| Mobile-first (320px mínimo) | ✅ PASSA | Todos os componentes com layout responsivo |
| Acessibilidade WCAG AA | ✅ PASSA | aria-label em botões/links, role="dialog" no modal |
| LGPD: sem dados sensíveis sem consentimento | ✅ PASSA | Dados operacionais existentes, sem PII novo |
| Escopo restrito ao spec.md | ✅ PASSA | Sem recursos fora do spec |

**Veredicto pré-design**: APROVADO — sem violações. Avançar para Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/007-dashboard-coletas/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/
│   └── dashboard-api.md # Phase 1 output
└── tasks.md             # Phase 2 output (gerado por /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (protected)/
│   │   └── dashboard/
│   │       └── page.tsx             # NOVO: reescreve src/app/dashboard/page.tsx
│   └── api/
│       └── dashboard/
│           ├── shipments/
│           │   └── route.ts         # NOVO: GET endpoint do dashboard do coletor
│           └── activities/
│               └── route.ts         # NOVO: GET endpoint do painel administrativo
├── components/
│   └── dashboard/
│       ├── CollectorDashboard.tsx   # NOVO: painel operacional do coletor
│       ├── AdminDashboard.tsx       # NOVO: painel de atividades do admin
│       └── ShipmentQuickViewModal.tsx # NOVO: popup de visualização rápida
└── lib/
    ├── services/
    │   └── dashboard.service.ts     # NOVO: queries e agregações do dashboard
    └── types/
        └── dashboard.ts             # NOVO: tipos exclusivos do dashboard
```

**Arquivo a remover**: `src/app/dashboard/page.tsx` (substituído pela versão em `(protected)/dashboard/`)

**Structure Decision**: Single project (Next.js full-stack). Os novos arquivos seguem a mesma
estrutura das features 005/006: page → API route → service → components. A rota `/dashboard`
é mantida; o arquivo físico migra de `src/app/dashboard/` para `src/app/(protected)/dashboard/`
para aderir ao padrão de autenticação e layout compartilhado do projeto.
