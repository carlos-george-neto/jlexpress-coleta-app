# Quickstart: Gestão de Status da Encomenda

**Feature**: 005-gestao-status-encomenda | **Data**: 2026-06-06

---

## Pré-requisitos

- Épicos 1 e 2 implementados (auth + gestão de usuários funcionais)
- Branch `005-gestao-status-encomenda` ativa
- Supabase local configurado (`supabase start`) ou projeto remoto apontado via `.env.local`

---

## 1. Executar as Migrations

```bash
# Opção A: Supabase local (CLI)
supabase db push

# Opção B: Supabase remoto (dashboard SQL editor)
# Cole e execute os arquivos na ordem:
# 1. supabase/migrations/20260606000001_create_shipment_statuses.sql
# 2. supabase/migrations/20260606000002_seed_shipment_statuses.sql
```

Após execução, o banco terá:
- Tabela `shipment_statuses` com constraint UNIQUE em `name`
- Tabela `shipment_status_audit_log`
- 7 status operacionais iniciais inseridos

---

## 2. Verificar o Seed

No painel do Supabase ou via SQL:

```sql
SELECT name, flow_order, is_active, is_exception, is_finalizer
FROM shipment_statuses
ORDER BY flow_order;
```

Resultado esperado (7 linhas):

| name                 | flow_order | is_active | is_exception | is_finalizer |
|----------------------|:----------:|:---------:|:------------:|:------------:|
| Pendente de Coleta   | 1          | true      | false        | false        |
| Em Coleta            | 2          | true      | false        | false        |
| Coletado             | 3          | true      | false        | true         |
| Coleta Parcial       | 4          | true      | true         | false        |
| Não Coletado         | 5          | true      | true         | false        |
| Cancelado            | 6          | true      | true         | true         |
| Aguardando Validação | 7          | true      | false        | false        |

---

## 3. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

---

## 4. Acessar a Gestão de Status

1. Faça login com uma conta de **administrador** em `/login`
2. No dashboard, clique em **"Gerenciar Status"**
3. Ou acesse diretamente: `http://localhost:3000/admin/statuses`

---

## 5. Validações Manuais Pós-Deploy

| Critério | Como verificar |
|----------|----------------|
| 7 status iniciais disponíveis | Acessar listagem — deve exibir 7 registros |
| Criar status com nome duplicado | Tentar criar "Coletado" — deve rejeitar com mensagem de erro |
| Criar status com nome em branco | Submeter formulário vazio — deve bloquear e exibir validação |
| Desativar um status | Editar qualquer status, marcar inativo, salvar — badge "Inativo" deve aparecer na listagem |
| Filtro "exceção" | Aplicar filtro — deve exibir apenas Coleta Parcial, Não Coletado, Cancelado |
| Auditoria de criação | Criar um status e verificar log de auditoria no banco: `SELECT * FROM shipment_status_audit_log ORDER BY performed_at DESC LIMIT 1` |
| Acesso negado para não-admin | Tentar acessar `/admin/statuses` com conta de coletor — deve redirecionar para `/dashboard` |

---

## Estrutura de Arquivos Criados

```
src/
├── app/
│   ├── (admin)/statuses/          # Páginas administrativas
│   ├── api/statuses/              # Endpoints da API REST
│   └── dashboard/page.tsx         # Atualizado com link de status
├── components/admin/statuses/     # Componentes de UI
└── lib/
    ├── services/status.service.ts # Lógica de negócio
    └── types/status.ts            # Tipos TypeScript
supabase/migrations/
├── 20260606000001_create_shipment_statuses.sql
└── 20260606000002_seed_shipment_statuses.sql
```
