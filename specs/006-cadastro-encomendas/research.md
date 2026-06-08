# Research: Cadastro de Encomendas

**Feature**: 006-cadastro-encomendas | **Date**: 2026-06-07

## 1. Controle de Acesso — Rota Acessível por Admin e Coletor

**Decisão**: Criar novo route group `(protected)` com layout que verifica autenticação
sem exigir perfil de admin. O layout renderiza o Header com o `role` do usuário logado.

**Rationale**: A listagem de encomendas (US2) é acessível a "qualquer usuário autenticado".
O route group `(admin)` atual bloqueia redirecionando para `/dashboard` se o perfil
não for `admin`. Criar `(protected)` desacopla os dois contextos, reutilizando o
componente `Header` já existente que aceita a prop `role` e adapta os links exibidos.

**Alternativas consideradas**:
- Mover encomendas para `(admin)` e tratar a permissão dentro de cada página: rejeitada
  pois exigiria duplicar a lógica de redirecionamento em cada page e tornaria a URL
  `/encomendas` inacessível ao coletor.
- Server components com `cookies()` para autorização SSR: rejeitada para manter
  consistência com o padrão client-side adotado em `(admin)/layout.tsx`.

---

## 2. Unicidade código + transportadora (inclusive soft-deleted)

**Decisão**: Constraint `UNIQUE(code, carrier)` na tabela `shipments` sem condição
(não partial index por `is_active`).

**Rationale**: FR-002 exige rejeição quando a combinação já existe "em outro registro
ativo ou inativo". Um índice UNIQUE incondicional cobre todos os registros, incluindo
os com `is_active = false`. Um partial index `WHERE is_active = true` seria
insuficiente. A validação se dá naturalmente pelo banco, sem código extra.

**Alternativas consideradas**:
- Validação apenas no service (sem constraint no banco): rejeitada — race condition
  possível em inserções concorrentes.
- Partial index `WHERE is_active = true`: rejeitada — viola FR-002 que inclui inativos.

---

## 3. Paginação — Tamanho de Página

**Decisão**: 20 itens por página, conforme especificado em Assumptions do spec.

**Rationale**: O spec declara explicitamente "tamanho de página padrão de 20 itens".
A feature de status usa 10 itens (padrão mais conservador), mas encomendas têm
volume operacional maior, justificando 20.

---

## 4. Formulário de Edição — Interface Admin vs. Coletor

**Decisão**: Mesma rota `/encomendas/[id]` com componente de formulário que renderiza
campos distintos com base no `role` do usuário logado.

**Rationale**: US3 (acceptance 4) especifica que o coletor que acessa a "edição completa"
vê apenas campos de status e condicionais. Isso implica a mesma URL com UI adaptativa
por role, ao invés de rotas separadas. Reduz duplicação de lógica e facilita navegação.

**Alternativas consideradas**:
- Rota separada `/encomendas/[id]/coletar` para coleta: rejeitada — complexidade extra
  sem benefício para o usuário.

---

## 5. Auditoria — Ações Definidas

**Decisão**: Quatro tipos de ação no audit log:
- `CREATE` — cadastro de nova encomenda (admin)
- `FULL_UPDATE` — edição completa de dados (admin)
- `STATUS_UPDATE` — atualização de status com campos condicionais (coletor)
- `DELETE` — soft delete (admin)

**Rationale**: O spec (US6) define "criação, edição completa, registro de coleta e
remoção" como os eventos auditáveis. Nomes distintos permitem filtrar por tipo de
operação na auditoria. Mapeiam 1:1 para as histórias de usuário.

---

## 6. Status — Constraint de Campos Condicionais

**Decisão**: `observations` obrigatório quando `status.requires_observation = true`;
`collected_count` obrigatório quando `status.is_exception = true` com valor
`0 ≤ collected_count ≤ volume_count`.

**Rationale**: FR-004 e FR-005 definem essas regras. A validação ocorre tanto no
cliente (UX imediata) quanto no servidor (service layer). O campo `collected_count`
pode ser 0 — representa coleta onde nenhum item foi coletado (ex.: Não Coletado).

---

## 7. Deleção Física — Prevenção

**Decisão**: Soft delete via flag `is_active = false`. Nenhuma rota DELETE remove
fisicamente o registro. FR-013 é a regra. O endpoint DELETE da API realiza PATCH
em `is_active`.

---

## 8. Header — Atualização de Navegação

**Decisão**: Adicionar link "Encomendas" no Header para roles `admin` e `collector`.

**Rationale**: A spec diz que "O acesso à gestão de encomendas é disponibilizado a
partir do Dashboard". O Header é o componente de navegação principal. O Dashboard
também deve exibir um card/link para encomendas para qualquer usuário autenticado.
