# Research: Gestão de Status da Encomenda

**Feature**: 005-gestao-status-encomenda | **Data**: 2026-06-06

## Decisões Técnicas

---

### 1. Seletor de Cor

**Decisão**: `<input type="color">` nativo HTML combinado com campo de texto para valor hexadecimal

**Rationale**: A especificação exige armazenamento do valor de cor como hexadecimal (ex.: `#FF5733`). O elemento nativo `<input type="color">` retorna exatamente esse formato, não requer dependências adicionais e é suportado em todos os navegadores modernos. A combinação com um campo de texto paralelo permite que o administrador insira o hex manualmente para maior precisão.

**Alternatives considered**:
- Biblioteca de color picker (ex.: react-colorful): Rejeitada — proibida pela constituição (zero dependências novas)
- Campo texto simples sem seletor visual: Aceito como fallback mas sem feedback visual imediato
- Paleta de cores pré-definidas: Rejeitada — a spec não limita as cores disponíveis

---

### 2. Arquitetura de Auditoria

**Decisão**: Tabela `shipment_status_audit_log` dedicada, seguindo o padrão de `user_audit_log`

**Rationale**: O padrão estabelecido nos épicos 1 e 2 usa uma tabela de auditoria por domínio. A função `logUserAudit` em `audit.service.ts` serve de referência direta para a nova `logStatusAudit`. A auditoria é acionada no nível do serviço (`status.service.ts`), não via trigger de banco — mantendo rastreabilidade do usuário que realizou a operação (`performed_by`), informação disponível apenas na camada de aplicação.

**Alternatives considered**:
- Trigger automático de banco de dados: Rejeitado — perde o contexto do `performed_by` (usuário autenticado via token), que precisa vir da camada de aplicação
- Tabela única de auditoria compartilhada: Rejeitado — aumenta complexidade de queries e viola YAGNI para este escopo

---

### 3. RLS (Row Level Security)

**Decisão**: Admins gerenciam tudo; usuários autenticados leem apenas status ativos para uso futuro no ÉPICO 4

**Rationale**: O ÉPICO 4 (Gestão de Encomendas) precisará ler status ativos para exibir opções ao coletor/entregador. FR-011 e o AC-4 da US1 confirmam isso. A política de SELECT permite leitura de status ativos para qualquer usuário autenticado, enquanto INSERT/UPDATE são restritos a admins. A tabela de auditoria mantém o padrão do `user_audit_log`: apenas admins leem, service role insere.

**Alternatives considered**:
- Apenas admins leem status: Rejeitado — bloquearia o ÉPICO 4 sem alteração estrutural adicional
- Leitura pública sem autenticação: Rejeitado — dados internos da operação (LGPD)

---

### 4. Soft Delete e Reativação

**Decisão**: Campo `is_active` (BOOLEAN) controlado via PATCH na API; ausência de método DELETE

**Rationale**: Idêntico ao padrão de usuários. FR-010 proíbe exclusão física. A reativação (ativo: false → true) é suportada nativamente pelo PATCH do serviço — sem endpoint especial necessário (YAGNI). O AC-4 da US5 confirma que a API deve bloquear tentativas de exclusão física.

**Alternatives considered**:
- Campo `deleted_at` (timestamp): Rejeitado — complexidade desnecessária; `is_active` é o padrão idiomático do projeto
- Endpoint DELETE retornando 405: Descartado como over-engineering; a API simplesmente não expõe o método DELETE

---

### 5. Paginação e Filtros

**Decisão**: Query params combinados na rota `GET /api/statuses`, processados em `status.service.ts`

**Rationale**: Segue exatamente o padrão `ListUsersQuery` + `listUsers()` de `user.service.ts`. Filtros são aplicados via `.eq()` e `.ilike()`, combinados; paginação via `.range()`. O Supabase retorna `count` total para metadados de paginação (`PaginationMeta`).

**Alternatives considered**:
- Filtros no lado do cliente (client-side filtering): Rejeitado — inviável com paginação server-side e critério de performance SC-002 (< 2s com 100 registros)
- Supabase RPC: Rejeitado — padrão do projeto é REST com App Router

---

### 6. Unicidade de Nome (incluindo inativos)

**Decisão**: Constraint `UNIQUE` no banco + verificação explícita no serviço antes de INSERT/UPDATE

**Rationale**: FR-003 é explícito — o nome deve ser único independente do estado ativo/inativo. O constraint UNIQUE na coluna `name` garante isso no banco. O serviço faz verificação prévia para retornar mensagem de erro amigável em português, sem expor erros técnicos do Supabase diretamente ao cliente.

**Alternatives considered**:
- Unicidade apenas para status ativos: Rejeitado — FR-003 é explícito quanto a registros ativos e inativos
- Apenas constraint de banco sem verificação prévia: Rejeitado — experiência ruim (mensagem de erro técnica em inglês)

---

### 7. Seed de Dados Iniciais

**Decisão**: Migration SQL dedicada (`20260606000002_seed_shipment_statuses.sql`) com `INSERT ... ON CONFLICT DO NOTHING`

**Rationale**: Garante idempotência — pode ser reexecutada sem duplicar dados. O `ON CONFLICT (name) DO NOTHING` usa o constraint UNIQUE existente. Não requer ação manual do administrador após configuração (SC-000).

**Alternatives considered**:
- Seed via script TypeScript: Rejeitado — SQL migration é o padrão do projeto e garante execução ordenada e versionada
- INSERT sem ON CONFLICT: Rejeitado — falha se a migration for reexecutada em ambiente de desenvolvimento

---

### 8. Link no Dashboard (FR-014)

**Decisão**: Adicionar card/link na seção de admin do `dashboard/page.tsx` para `/admin/statuses`, seguindo o padrão do link "Gerenciar Usuários" já existente

**Rationale**: O dashboard já possui uma seção condicional para admins com link para `/users`. A adição de um novo link segue o mesmo padrão sem introduzir novas abstrações.

**Alternatives considered**:
- Menu lateral dedicado: Rejeitado — YAGNI; o dashboard atual usa links simples e funciona bem
