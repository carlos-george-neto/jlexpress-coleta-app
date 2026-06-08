# Quickstart: Cadastro de Encomendas

**Feature**: 006-cadastro-encomendas | **Date**: 2026-06-07

## Pré-requisitos

- Feature 005 (Gestão de Status) implementada — tabela `shipment_status` populada
- Feature 001/002 (Autenticação e Usuários) funcionais
- Ao menos um usuário com role `admin` e um com role `collector` cadastrados
- Supabase rodando (local ou cloud)

---

## 1. Migração do Banco de Dados

Aplicar a migration versionada do projeto:

```bash
# Via Supabase CLI
supabase db push

# Ou cole o conteúdo de supabase/migrations/20260607000001_create_shipments.sql
# diretamente no Supabase Dashboard → SQL Editor e execute
```

O arquivo de migration (`supabase/migrations/20260607000001_create_shipments.sql`) cria:

- Tabela `public.shipments` com constraint UNIQUE (code, carrier), índices e trigger `updated_at`
- Tabela `public.shipment_audit_log` com constraint CHECK nas ações e índices
- RLS em ambas as tabelas seguindo o padrão da feature 005 (verificação via `public.users`)

**Verificação**: Após aplicar, confirme no Supabase Dashboard → Table Editor que as tabelas `shipments` e `shipment_audit_log` existem no schema `public`.

---

## 2. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

---

## 3. Verificar Funcionalidades

### Como administrador

1. Acesse `/dashboard` → clique em "Gerenciar Encomendas"
2. Acesse `/encomendas` — lista vazia inicialmente
3. Clique em "+ Nova Encomenda" → preencha todos os campos → confirme
4. Verifique que a encomenda aparece na listagem
5. Clique na encomenda → altere dados e confirme (edição completa)
6. Teste busca textual e filtros na listagem
7. Teste soft delete — encomenda desaparece da lista

### Como coletor

1. Login com usuário `collector`
2. Acesse `/encomendas` — visualiza a listagem (sem botão "+ Nova Encomenda")
3. Clique em uma encomenda → apenas campo de status é editável
4. Selecione um status de exceção → campos Observações e Quantidade Coletada aparecem e são obrigatórios
5. Confirme → status atualizado; verifique auditoria

### Validações para testar

- Campo obrigatório vazio → mensagem inline de validação
- Data de coleta anterior à chegada → bloqueio com mensagem
- Código + transportadora duplicada → mensagem de duplicidade
- Status de exceção sem observações → bloqueio
- Quantidade coletada > volume_count → bloqueio
- Coletor tentando acessar `/encomendas/nova` → redirecionado para `/encomendas`

---

## 4. Estrutura de Arquivos Criados

```
src/
├── app/
│   ├── (protected)/
│   │   ├── layout.tsx
│   │   └── encomendas/
│   │       ├── page.tsx
│   │       ├── nova/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── page.tsx
│   └── api/
│       └── shipments/
│           ├── route.ts
│           └── [shipmentId]/
│               ├── route.ts
│               └── audit-log/
│                   └── route.ts
├── components/
│   └── shipments/
│       ├── ShipmentList.tsx
│       ├── ShipmentFilters.tsx
│       ├── ShipmentForm.tsx
│       ├── ShipmentStatusUpdate.tsx
│       └── ShipmentAuditLog.tsx
└── lib/
    ├── types/shipment.ts
    ├── schemas/shipment.ts
    └── services/shipment.service.ts
```
