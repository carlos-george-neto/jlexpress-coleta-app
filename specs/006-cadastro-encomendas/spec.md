# Feature Specification: Cadastro de Encomendas

**Feature Branch**: `006-cadastro-encomendas`

**Created**: 2026-06-07

**Status**: Approved

**Input**: User description: "ÉPICO 4 — Gestão de Encomendas / Feature 4.1 — Cadastro de Encomendas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar Nova Encomenda (Priority: P1)

Um administrador precisa registrar uma nova encomenda no sistema, informando dados de identificação (código, transportadora, volumes), logística (destino, responsável) e datas (chegada, coleta prevista), associando um status inicial. O sistema valida os dados e persiste o registro.

**Why this priority**: Pré-requisito para todas as demais histórias. Sem encomendas cadastradas, não há o que listar, editar ou auditar.

**Independent Test**: Testável de forma isolada acessando a tela de cadastro, preenchendo todos os campos obrigatórios e verificando que o registro aparece na listagem com os dados corretos.

**Acceptance Scenarios**:

1. **Given** um administrador na tela de cadastro, **When** preenche todos os campos obrigatórios e confirma, **Then** a encomenda é criada com status inicial configurado, aparece na listagem e a criação é registrada na auditoria
2. **Given** um administrador deixa um campo obrigatório em branco, **When** tenta confirmar o cadastro, **Then** o sistema bloqueia o envio e destaca o campo faltante com mensagem de validação
3. **Given** o campo "Quantidade de volumes" está preenchido com valor menor que 1, **When** tenta confirmar, **Then** o sistema bloqueia e exibe mensagem de valor inválido
4. **Given** o campo "Data de coleta" está preenchido com data anterior à "Data de chegada", **When** tenta confirmar, **Then** o sistema bloqueia e exibe mensagem de inconsistência de datas
5. **Given** o status selecionado é do tipo exceção (ex.: Cancelado), **When** o campo "Observações" está em branco, **Then** o sistema exige preenchimento de observações antes de salvar
6. **Given** já existe uma encomenda com o mesmo código para a mesma transportadora, **When** o administrador tenta cadastrar outra com a mesma combinação, **Then** o sistema rejeita e exibe mensagem de duplicidade

---

### User Story 2 - Listar, Buscar e Filtrar Encomendas (Priority: P2)

Qualquer usuário autenticado precisa visualizar todas as encomendas ativas, buscar por texto (código, transportadora, destino, responsável) e aplicar filtros por status, transportadora e intervalos de data. A listagem é paginada e ordenável por múltiplos critérios.

**Why this priority**: Essencial para a operação diária — tanto administradores quanto coletores precisam localizar encomendas rapidamente.

**Independent Test**: Testável criando ao menos 10 encomendas com características distintas e verificando que busca textual, filtros por status, ordenação por data e paginação retornam resultados corretos.

**Acceptance Scenarios**:

1. **Given** existem encomendas cadastradas, **When** o usuário acessa a listagem, **Then** as encomendas ativas são exibidas de forma paginada, ordenadas por padrão pela data de chegada (mais recente primeiro)
2. **Given** o usuário digita um texto na busca, **When** a busca é executada, **Then** apenas encomendas cujo código, transportadora, destino ou responsável contêm o texto são listadas
3. **Given** o usuário aplica filtro por um ou mais status, **When** a listagem é atualizada, **Then** apenas encomendas com os status selecionados são exibidas
4. **Given** o usuário aplica filtro por intervalo de data de chegada, **When** a listagem é atualizada, **Then** apenas encomendas com data de chegada no intervalo informado são exibidas
5. **Given** há mais encomendas do que o limite por página, **When** o usuário navega pelas páginas, **Then** todas as encomendas são acessíveis sem duplicação ou omissão

---

### User Story 3 - Editar Encomenda — Dados Completos (Priority: P3)

Um administrador precisa alterar quaisquer dados de uma encomenda existente — campos de texto, datas, status ou volumes. O sistema aplica as mesmas validações do cadastro, registra a alteração na auditoria e exibe feedback de sucesso.

**Why this priority**: Necessário para corrigir dados incorretos ou atualizar informações logísticas de uma encomenda.

**Independent Test**: Testável editando uma encomenda existente, alterando múltiplos campos e verificando as mudanças na listagem e no registro de auditoria.

**Acceptance Scenarios**:

1. **Given** um administrador acessa a edição de uma encomenda existente, **When** altera campos e confirma, **Then** os dados são atualizados, visíveis na listagem e a alteração é registrada na auditoria com valores anteriores e novos
2. **Given** o administrador tenta alterar o status para um de exceção sem preencher observações, **When** confirma, **Then** o sistema bloqueia e solicita preenchimento das observações
3. **Given** o administrador altera a data de coleta para uma data anterior à data de chegada, **When** confirma, **Then** o sistema bloqueia e exibe mensagem de inconsistência de datas
4. **Given** um usuário com perfil de coletor tenta acessar a edição completa de uma encomenda, **When** acessa a tela, **Then** apenas o campo de status (e os campos condicionais) estão disponíveis para edição

---

### User Story 4 - Registrar Coleta — Atualizar Status (Priority: P4)

Um coletor precisa registrar o resultado de uma coleta atualizando o status de uma encomenda. Para status de exceção (ex.: Coleta Parcial, Não Coletado, Cancelado), o coletor deve informar obrigatoriamente uma observação e a quantidade de itens efetivamente coletados. O sistema registra a operação na auditoria.

**Why this priority**: É o principal fluxo operacional do coletor — sem isso, o sistema não reflete a realidade das coletas realizadas em campo.

**Independent Test**: Testável acessando com perfil de coletor, atualizando o status de uma encomenda para "Coletado" e depois para "Coleta Parcial" (com observação e quantidade coletada), verificando que ambas as alterações aparecem corretamente na listagem e na auditoria.

**Acceptance Scenarios**:

1. **Given** um coletor acessa uma encomenda, **When** altera o status para um status sem flag de exceção (ex.: Em Coleta) e confirma, **Then** o status é atualizado e a alteração é registrada na auditoria
2. **Given** um coletor tenta alterar o status para um de exceção com "Observações" em branco, **When** confirma, **Then** o sistema bloqueia e exige o preenchimento das observações
3. **Given** um coletor seleciona um status de exceção e preenche as observações mas não informa a quantidade coletada, **When** confirma, **Then** o sistema bloqueia e exige o preenchimento da quantidade coletada
4. **Given** um coletor preenche status de exceção, observações e quantidade coletada (ex.: 3 de 5 volumes), **When** confirma, **Then** a encomenda é atualizada e a auditoria registra o usuário, a mudança de status, as observações e a quantidade coletada
5. **Given** um coletor tenta editar campos como código, transportadora ou datas, **When** acessa a tela de registro de coleta, **Then** esses campos estão somente para leitura e não podem ser alterados

---

### User Story 5 - Remover Encomenda (Soft Delete) (Priority: P5)

Um administrador precisa remover uma encomenda cadastrada por engano ou duplicada. O sistema executa soft delete — o registro é marcado como inativo e desaparece da listagem principal, mas não é fisicamente deletado do banco de dados.

**Why this priority**: Permite corrigir erros de cadastro sem comprometer o histórico e a auditoria do sistema.

**Independent Test**: Testável removendo uma encomenda e verificando que ela desaparece da listagem principal, mas permanece acessível em consultas de registros inativos e na auditoria.

**Acceptance Scenarios**:

1. **Given** um administrador seleciona uma encomenda e confirma a remoção, **When** a ação é executada, **Then** a encomenda desaparece da listagem principal e a remoção é registrada na auditoria
2. **Given** um usuário com perfil de coletor, **When** tenta remover uma encomenda, **Then** a ação é bloqueada pelo sistema
3. **Given** uma encomenda foi removida (soft delete), **When** consultada diretamente, **Then** o sistema ainda retorna o registro com indicador de inativo

---

### User Story 6 - Auditoria de Encomendas (Priority: P6)

O sistema registra automaticamente cada operação relevante sobre encomendas — criação, edição completa, registro de coleta e remoção — com identificação do usuário responsável, data/hora e detalhes das alterações.

**Why this priority**: Garante rastreabilidade de todas as operações para fins operacionais e de conformidade.

**Independent Test**: Testável realizando criação, atualização de status por coletor, edição completa e remoção de uma encomenda, e verificando que todos os eventos aparecem no log de auditoria com os atributos corretos.

**Acceptance Scenarios**:

1. **Given** qualquer operação de criação, edição ou remoção é realizada, **When** o usuário consulta a auditoria da encomenda, **Then** todos os eventos estão registrados com usuário responsável, data/hora, tipo de operação e campos alterados
2. **Given** um coletor registra uma coleta de exceção, **When** a auditoria é consultada, **Then** o registro inclui o status anterior, o novo status, as observações e a quantidade coletada informada
3. **Given** um registro de auditoria foi criado, **When** qualquer usuário tenta modificá-lo, **Then** a operação é bloqueada — registros de auditoria são imutáveis

---

### Edge Cases

- O que acontece quando todos os status estão desativados? O sistema exibe alerta informando que não há status ativos disponíveis para cadastro, impedindo a criação de novas encomendas.
- O que acontece com o status de uma encomenda quando o status associado é desativado posteriormente? A encomenda mantém o status; apenas novas atribuições desse status são bloqueadas.
- O que acontece quando busca e filtros são combinados? Os critérios são aplicados de forma cumulativa (AND) — o resultado deve satisfazer todos simultaneamente.
- O que acontece quando a busca textual retorna zero resultados? O sistema exibe mensagem de "nenhuma encomenda encontrada" mantendo os filtros ativos visíveis.
- O código da encomenda deve ser único por transportadora: a combinação código + transportadora deve ser única no sistema — a mesma transportadora não pode ter dois registros com o mesmo código, mas transportadoras diferentes podem usar o mesmo código.
- O que acontece quando o coletor informa uma quantidade coletada maior que a quantidade de volumes original? O sistema deve rejeitar e exibir mensagem informando que a quantidade coletada não pode exceder a quantidade de volumes da encomenda.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE permitir o cadastro de encomendas com os campos: código da encomenda (obrigatório), transportadora (obrigatório), quantidade de volumes (obrigatório, inteiro >= 1), data de chegada (obrigatório), data de coleta (opcional), destino (obrigatório), responsável (obrigatório), status (obrigatório, referência a status ativo), observações (opcional — obrigatório para status com flag "exige observação"), quantidade coletada (opcional — obrigatório para status de exceção, inteiro >= 0 e <= quantidade de volumes)
- **FR-002**: O sistema DEVE rejeitar o cadastro quando a combinação de código da encomenda e transportadora já existir em outro registro ativo ou inativo
- **FR-003**: O sistema DEVE validar que a data de coleta, quando informada, é igual ou posterior à data de chegada
- **FR-004**: O sistema DEVE exigir preenchimento do campo "Observações" quando o status selecionado tiver a flag "exige observação" ativa
- **FR-005**: O sistema DEVE exigir preenchimento do campo "Quantidade coletada" quando o status selecionado for do tipo exceção; o valor deve ser inteiro >= 0 e não pode exceder a quantidade de volumes da encomenda
- **FR-006**: O sistema DEVE oferecer apenas status com flag "ativo" igual a verdadeiro como opções selecionáveis no cadastro e edição
- **FR-007**: O sistema DEVE exibir a listagem de encomendas ativas de forma paginada, ordenada por padrão pela data de chegada (mais recente primeiro)
- **FR-008**: O sistema DEVE oferecer busca textual simultânea nos campos: código da encomenda, transportadora, destino e responsável
- **FR-009**: O sistema DEVE oferecer filtros independentes e combináveis: por status, por transportadora e por intervalo de data de chegada
- **FR-010**: O sistema DEVE permitir ordenação da listagem por: data de chegada, data de coleta, transportadora e status
- **FR-011**: O sistema DEVE permitir ao administrador a edição de todos os campos de uma encomenda existente, aplicando as mesmas validações do cadastro
- **FR-012**: O sistema DEVE restringir o perfil de coletor à atualização exclusiva do campo status de uma encomenda; ao selecionar um status de exceção, os campos "Observações" e "Quantidade coletada" tornam-se obrigatórios e visíveis; todos os demais campos permanecem somente para leitura
- **FR-013**: O sistema DEVE implementar exclusivamente soft delete, impedindo qualquer exclusão física de encomendas
- **FR-014**: O sistema DEVE restringir a operação de remoção (soft delete) exclusivamente ao perfil de administrador
- **FR-015**: O sistema DEVE registrar na auditoria cada operação de criação, edição completa, registro de coleta e remoção de encomenda, incluindo: usuário responsável, data/hora, tipo de operação e valores anteriores e novos dos campos alterados
- **FR-016**: O sistema DEVE exibir a listagem de encomendas apenas para usuários autenticados

### Key Entities

- **Encomenda**: Representa um item físico disponível para coleta. Atributos: código, transportadora, quantidade de volumes, data de chegada, data de coleta, destino, responsável, status (referência à entidade Status), observações, quantidade coletada, ativo (soft delete)
- **Auditoria de Encomenda**: Registro imutável de cada operação relevante sobre encomendas. Atributos: identificador da encomenda, usuário responsável, data/hora da operação, tipo de operação (criação/edição completa/registro de coleta/remoção), snapshot dos valores anteriores e novos

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador consegue cadastrar uma nova encomenda em menos de 90 segundos
- **SC-002**: Um coletor consegue registrar o resultado de uma coleta (atualizar status + campos condicionais) em menos de 60 segundos
- **SC-003**: A listagem de encomendas carrega e exibe resultados em menos de 2 segundos com até 500 encomendas cadastradas
- **SC-004**: Busca textual e filtros retornam resultados corretos em 100% dos casos, sem falsos positivos ou negativos
- **SC-005**: 100% das operações de criação, edição e remoção são registradas na auditoria com usuário, data/hora e detalhes completos
- **SC-006**: Nenhuma encomenda removida (soft delete) aparece na listagem principal — 0 ocorrências
- **SC-007**: 100% das tentativas de cadastro ou edição com dados inválidos (campos obrigatórios ausentes, datas inconsistentes, código duplicado por transportadora, quantidade coletada inválida) são rejeitadas antes da persistência

## Assumptions

- A entidade de Status (Feature 005 — Gestão de Status da Encomenda) está implementada e os 7 status operacionais iniciais estão disponíveis
- O sistema de autenticação e controle de acesso (RBAC) com perfis de administrador e coletor está funcional (ÉPICO 1 e ÉPICO 2)
- O campo "Responsável" armazena texto livre (nome da pessoa) — não é uma referência a um usuário do sistema
- A paginação usa tamanho de página padrão de 20 itens por página
- Não há limite máximo de encomendas cadastradas
- A interface de gestão de encomendas deve ser responsiva conforme o design-system.md do projeto
- A reativação de uma encomenda removida (soft delete) está fora do escopo desta feature
- O acesso à gestão de encomendas é disponibilizado a partir do Dashboard
- A unicidade código + transportadora é verificada inclusive contra registros inativos (soft deleted), evitando reuso acidental de combinações removidas
