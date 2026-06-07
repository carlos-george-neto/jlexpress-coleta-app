# Feature Specification: Gestão de Status da Encomenda

**Feature Branch**: `005-gestao-status-encomenda`

**Created**: 2026-06-06

**Status**: Approved

**Input**: User description: "ÉPICO 3 - Gestão de Status da Encomenda (feature-backlog.md)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fundação da Entidade Status (Priority: P1)

O sistema precisa de uma estrutura de dados persistente e versionada para armazenar os status operacionais de encomendas. Essa estrutura deve conter todos os atributos que determinam o comportamento de cada status no fluxo de coletas, e deve ser inicializada com um conjunto de status operacionais padrão para que o sistema possa entrar em operação imediatamente após a configuração.

**Why this priority**: Pré-requisito absoluto para todas as demais histórias do ÉPICO 3. Sem a entidade de status definida e os dados iniciais carregados, nenhuma operação de cadastro, listagem, edição ou desativação é possível.

**Independent Test**: Testável verificando que, após a configuração do ambiente, a entidade de status existe com todos os atributos esperados e que os 7 status operacionais iniciais estão presentes e acessíveis pelo sistema.

**Acceptance Scenarios**:

1. **Given** um novo ambiente do sistema é configurado, **When** a inicialização do banco de dados é executada, **Then** a entidade de status existe com todos os campos: nome, descrição, indicador ativo, exige observação, exceção, finalizador, ordem do fluxo e cor indicativa
2. **Given** a entidade de status foi criada, **When** o sistema é inicializado, **Then** os 7 status operacionais padrão estão disponíveis: Pendente de Coleta, Em Coleta, Coletado, Coleta Parcial, Não Coletado, Cancelado e Aguardando Validação
3. **Given** os status iniciais foram carregados, **When** o administrador acessa a listagem, **Then** os 4 status de exceção (Coleta Parcial, Não Coletado, Cancelado) estão marcados como exceção e exigem observação, enquanto os demais não
4. **Given** a entidade de status existe, **When** o ÉPICO 4 (Gestão de Encomendas) for implementado, **Then** a entidade de encomendas pode referenciar status existentes sem alteração estrutural

---

### User Story 2 - Cadastro de Status (Priority: P2)

Um administrador precisa cadastrar novos status operacionais para parametrizar o fluxo de coletas. Ao acessar a área administrativa de status, ele preenche os atributos do status (nome, descrição, flags comportamentais, ordem e cor) e confirma o cadastro. O sistema valida os dados, rejeita duplicatas de nome e registra a operação na auditoria.

**Why this priority**: Base do sistema operacional. Sem status cadastrados, nenhum fluxo de coleta pode ser configurado. É a funcionalidade que desbloqueia todos os outros épicos que dependem de status.

**Independent Test**: Testável de forma isolada ao acessar a tela de cadastro de status, criar um novo registro e verificar que ele aparece na listagem com os atributos corretos.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado na área de gestão de status, **When** preenche nome, descrição, flags comportamentais e confirma, **Then** o status é criado, aparece na listagem e a criação é registrada na auditoria
2. **Given** um administrador tenta criar um status com nome idêntico a um já existente, **When** confirma o cadastro, **Then** o sistema rejeita e exibe mensagem de erro indicando duplicidade de nome
3. **Given** um administrador deixa o campo nome em branco, **When** tenta confirmar, **Then** o sistema bloqueia o envio e exibe validação do campo obrigatório
4. **Given** um usuário com perfil de coletor, **When** tenta acessar a gestão de status, **Then** o acesso é negado e ele é redirecionado para o dashboard

---

### User Story 3 - Listagem e Busca de Status (Priority: P3)

Um administrador precisa visualizar todos os status cadastrados, filtrar por tipo (ativos, inativos, exceção, finalizadores) e ordenar pelo fluxo operacional. A busca textual permite localizar rapidamente status específicos.

**Why this priority**: Necessário para gerenciar e auditar o catálogo de status antes de editar ou desativar qualquer registro.

**Independent Test**: Testável criando ao menos 5 status com características distintas (ativo, inativo, exceção, finalizador) e verificando filtros, ordenação por fluxo e busca textual.

**Acceptance Scenarios**:

1. **Given** existem status cadastrados, **When** o administrador acessa a listagem, **Then** os status são exibidos de forma paginada e ordenados pela ordem do fluxo
2. **Given** o administrador aplica o filtro "exceção", **When** a listagem é atualizada, **Then** apenas status marcados como exceção são exibidos
3. **Given** o administrador aplica o filtro "inativos", **When** a listagem é atualizada, **Then** apenas status desativados são exibidos com indicador visual de inativo
4. **Given** o administrador digita um texto na busca, **When** a busca é executada, **Then** apenas status cujo nome ou descrição contém o texto são listados

---

### User Story 4 - Edição de Status (Priority: P4)

Um administrador precisa alterar atributos de um status existente: nome, descrição, flags comportamentais (exige observação, exceção, finalizador), ordem do fluxo e cor indicativa. Todas as alterações são registradas na auditoria.

**Why this priority**: Necessário para manutenção e ajuste dos status conforme a operação evolui, sem precisar desativar e recriar.

**Independent Test**: Testável editando um status existente, alterando múltiplos campos e verificando as alterações na listagem e no registro de auditoria.

**Acceptance Scenarios**:

1. **Given** o administrador acessa a edição de um status existente, **When** altera nome, descrição e flags e confirma, **Then** o status é atualizado e a alteração aparece na auditoria com os valores anteriores e novos
2. **Given** o administrador edita um status e tenta usar um nome já pertencente a outro status, **When** confirma, **Then** o sistema rejeita com mensagem de duplicidade
3. **Given** o administrador altera a flag "exige observação" de false para true, **When** salva, **Then** a partir daquele momento, ao usar esse status em uma encomenda, o campo observação torna-se obrigatório

---

### User Story 5 - Desativação de Status (Priority: P5)

Um administrador precisa desativar um status que não deve mais ser utilizado em novas coletas. O sistema impede o uso do status inativo em novos fluxos, mas preserva o histórico de encomendas que já o utilizaram.

**Why this priority**: Garante o controle do ciclo de vida dos status sem perda de rastreabilidade histórica. Nenhum dado deve ser apagado (RN013).

**Independent Test**: Testável desativando um status ativo e verificando: que ele não aparece como opção selecionável em novas encomendas, que o indicador de inativo é exibido na listagem e que encomendas históricas ainda exibem o status corretamente.

**Acceptance Scenarios**:

1. **Given** um status ativo, **When** o administrador o desativa, **Then** ele recebe indicador visual de inativo na listagem e é removido das opções disponíveis para novos fluxos
2. **Given** um status inativo, **When** qualquer usuário tenta selecioná-lo para uma nova encomenda, **Then** a operação é bloqueada pelo sistema
3. **Given** encomendas históricas que utilizaram um status agora desativado, **When** consultadas, **Then** o status desativado ainda é exibido corretamente no histórico e na timeline da encomenda
4. **Given** um administrador tenta excluir fisicamente um status, **When** confirma a exclusão, **Then** o sistema bloqueia e informa que apenas desativação é permitida

---

### Edge Cases

- O que acontece quando todos os status são desativados? O sistema deve exibir alerta de que não há status ativos disponíveis para uso.
- O que acontece com encomendas que estão em um status que é desativado? Permanecem com o status atual; apenas novas atribuições são bloqueadas.
- Dois administradores editam o mesmo status simultaneamente? O último a salvar prevalece — comportamento padrão de formulário sem bloqueio otimista.
- Qual o comportamento ao tentar reutilizar o nome de um status desativado? O nome ainda está em uso pelo registro inativo e deve ser rejeitado como duplicata.
- Status com ordem do fluxo igual a outro? Permitido — dois status podem compartilhar a mesma posição na ordenação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-000**: O sistema DEVE possuir uma entidade de status de encomenda com os seguintes atributos: nome (texto, obrigatório, único), descrição (texto, opcional), ativo (booleano), exige observação (booleano), é exceção (booleano), é finalizador (booleano), ordem do fluxo (número inteiro) e cor indicativa (texto)
- **FR-001**: O sistema DEVE restringir toda a gestão de status (criar, editar, desativar, visualizar) exclusivamente ao perfil de administrador
- **FR-002**: O sistema DEVE permitir o cadastro de status com os campos: nome (obrigatório, único), descrição (opcional), ativo (padrão: verdadeiro), exige observação (padrão: falso), status de exceção (padrão: falso), status finalizador (padrão: falso), ordem do fluxo (número inteiro, obrigatório) e cor indicativa (opcional)
- **FR-003**: O sistema DEVE rejeitar cadastro ou edição quando o nome do status já existir em qualquer outro registro, independente de estar ativo ou inativo
- **FR-004**: O sistema DEVE validar e bloquear o envio quando campos obrigatórios (nome, ordem do fluxo) estiverem em branco
- **FR-005**: O sistema DEVE exibir a listagem de status com paginação, ordenada por padrão pela ordem do fluxo em ordem crescente
- **FR-006**: O sistema DEVE oferecer filtros independentes e combináveis na listagem: ativos, inativos, exceção, finalizadores
- **FR-007**: O sistema DEVE oferecer busca textual por nome ou descrição na listagem
- **FR-008**: O sistema DEVE permitir a edição de todos os atributos de um status existente
- **FR-009**: O sistema DEVE registrar na auditoria cada operação de criação e edição, incluindo: usuário responsável, data/hora e valores anteriores e novos dos campos alterados
- **FR-010**: O sistema DEVE implementar exclusivamente soft delete (desativação), impedindo qualquer exclusão física de status
- **FR-011**: Status com flag "ativo" igual a falso NÃO DEVEM aparecer como opção selecionável em fluxos de atribuição de encomendas
- **FR-012**: O sistema DEVE exibir indicador visual distinto para status inativos na listagem administrativa
- **FR-013**: O histórico e a timeline de encomendas que utilizaram um status posteriormente desativado DEVEM permanecer intactos e legíveis
- **FR-014**: O sistema DEVE disponibilizar acesso à gestão de status a partir do painel do Dashboard administrativo
- **FR-015**: O sistema DEVE pré-carregar um conjunto de status operacionais iniciais via migration: Pendente de Coleta, Em Coleta, Coletado, Coleta Parcial (exceção, exige observação), Não Coletado (exceção, exige observação), Cancelado (exceção, exige observação), Aguardando Validação

### Key Entities

- **Status da Encomenda**: Representa um estado operacional pelo qual uma encomenda pode passar. Atributos: nome (único), descrição, ativo, exige observação, é exceção, é finalizador, ordem do fluxo (inteiro), cor indicativa
- **Auditoria de Status**: Registro imutável de cada operação de criação ou modificação de status. Atributos: identificador do status, usuário responsável, data/hora da operação, tipo de operação (criação/edição), snapshot dos valores anteriores e novos

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-000**: Os 7 status operacionais iniciais estão disponíveis para uso imediatamente após a configuração do sistema, sem nenhuma ação manual do administrador
- **SC-001**: Um administrador consegue criar um novo status operacional em menos de 60 segundos
- **SC-002**: A listagem de status carrega e exibe resultados em menos de 2 segundos com até 100 status cadastrados
- **SC-003**: Os filtros e a busca textual retornam resultados corretos em 100% dos casos, sem falsos positivos ou negativos
- **SC-004**: Nenhum status desativado aparece como opção selecionável em fluxos de encomenda após a desativação — 0 ocorrências
- **SC-005**: 100% das operações de criação e edição são registradas na auditoria com usuário, data/hora e detalhes completos
- **SC-006**: Dados históricos de encomendas permanecem íntegros e consultáveis após a desativação de qualquer status
- **SC-007**: 100% das tentativas de cadastro com nome duplicado são rejeitadas antes da persistência no banco

## Assumptions

- O sistema de autenticação e controle de acesso (RBAC) está implementado, com o perfil de administrador funcional (ÉPICO 1 e ÉPICO 2 concluídos)
- A entidade de status será referenciada pela entidade de encomendas no ÉPICO 4; este épico apenas cria e gerencia o catálogo de status
- A cor indicativa será armazenada como valor hexadecimal (ex.: `#FF5733`); a interface oferece um seletor de cor ou campo de texto
- Não há limite máximo de status cadastrados
- O conjunto inicial de status é inserido via migration/seed no banco de dados, não pela interface administrativa
- A ordem do fluxo aceita valores inteiros positivos; não há constraint de unicidade — dois status podem compartilhar a mesma posição
- A interface de gestão de status deve ser responsiva conforme o design-system.md do projeto
- Não há fluxo de aprovação para criação ou edição de status — o administrador salva e o status fica disponível imediatamente
- A reativação de um status desativado é possível via edição (alterando o campo "ativo" para verdadeiro)
