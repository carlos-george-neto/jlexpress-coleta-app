# Feature Specification: Dashboard de Coletas

**Feature Branch**: `007-dashboard-coletas`

**Created**: 2026-06-07

**Status**: Approved

**Input**: User description: "ÉPICO 5 — Dashboard Operacional de Coletas / Feature 5.1 — Dashboard de Encomendas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Coletor Visualiza Encomendas no Dashboard (Priority: P1)

Um coletor autenticado acessa o dashboard operacional e visualiza imediatamente as encomendas relevantes para sua atuação: todas com status "Pendente de Coleta" e todas cujo responsável seja ele mesmo. Os registros são exibidos com a cor indicativa do status correspondente e ordenados por data de chegada. As outras encomendas com outros stauts, deverão aparecer tambem no dashboar, mas com prioridade inferior ao do status "Pendente de Coleta".

**Why this priority**: É o fluxo central da feature — sem ele, todo o resto (popup, edição) não tem ponto de entrada. É a razão de existência do dashboard para o coletor.

**Independent Test**: Testável logando como coletor, verificando que as encomendas "Pendente de Coleta" e as com seu nome como responsável aparecem no dashboard com as cores corretas e ordenadas por data de chegada.

**Acceptance Scenarios**:

1. **Given** um coletor autenticado acessa o dashboard, **When** a tela carrega, **Then** são exibidas todas as encomendas com status "Pendente de Coleta" e todas as encomendas onde o campo "Responsável" corresponde ao nome do usuário logado, ordenadas por data de chegada igual a data atual
2. **Given** o dashboard exibe encomendas, **When** o coletor observa os registros, **Then** cada encomenda possui destaque visual com a cor indicativa do seu status
3. **Given** encomendas de status diferentes estão listadas, **When** o coletor visualiza o dashboard, **Then** os registros são agrupados ou visualmente separados por status, respeitando a cor indicativa de cada um
4. **Given** não há encomendas "Pendente de Coleta" nem encomendas atribuídas ao coletor na data atual, **When** o dashboard carrega, **Then** uma mensagem informa que não há encomendas disponíveis no momento

---

### User Story 2 - Visualização Rápida de Encomenda via Popup (Priority: P2)

Um coletor precisa verificar os dados principais de uma encomenda listada no dashboard sem precisar navegar para outra tela. Ao acionar a visualização rápida, um popup exibe as informações essenciais e oferece acesso direto à tela de edição.

**Why this priority**: Agiliza o fluxo operacional do coletor em campo — ele pode consultar detalhes sem perder o contexto do dashboard.

**Independent Test**: Testável acionando a visualização rápida de qualquer encomenda no dashboard e verificando que o popup exibe os dados corretos e o link de edição funciona.

**Acceptance Scenarios**:

1. **Given** um coletor visualiza uma encomenda no dashboard, **When** aciona a visualização rápida, **Then** um popup exibe: código, transportadora, responsável, destino, quantidade de volumes, data de chegada, data de coleta prevista, status atual (com cor) e observações
2. **Given** o popup está aberto, **When** o coletor clica no link "Editar" ou equivalente, **Then** é redirecionado para a tela de edição da encomenda respeitando as permissões do perfil coletor (apenas status, observações e quantidade coletada disponíveis para edição)
3. **Given** o popup está aberto, **When** o coletor clica fora do popup ou aciona o fechamento, **Then** o popup fecha e o dashboard volta ao estado anterior sem recarregar a listagem

---

### User Story 3 - Edição de Coleta pelo Coletor a partir do Dashboard (Priority: P3)

A partir do dashboard ou do popup de visualização rápida, o coletor acessa a tela de edição de uma encomenda. Nela, apenas os campos permitidos pelo perfil de coletor estão disponíveis: status, observações (quando obrigatório) e quantidade coletada (quando obrigatório). Todas as demais informações ficam somente para leitura.

**Why this priority**: Completa o fluxo operacional — o coletor não apenas visualiza, mas pode registrar o resultado da coleta sem sair do contexto de trabalho.

**Independent Test**: Testável acessando a edição de uma encomenda pelo coletor a partir do dashboard, atualizando o status para um de exceção, preenchendo observações e quantidade coletada, e verificando que a encomenda atualizada reflete o novo status no dashboard.

**Acceptance Scenarios**:

1. **Given** um coletor acessa a edição de uma encomenda pelo dashboard, **When** a tela de edição carrega, **Then** apenas os campos "Status", "Observações" e "Quantidade coletada" são editáveis; todos os demais campos estão somente para leitura
2. **Given** o coletor seleciona um status de exceção na tela de edição, **When** tenta confirmar sem preencher "Observações", **Then** o sistema bloqueia e exige o preenchimento do campo
3. **Given** o coletor preenche o status de exceção, observações e quantidade coletada corretamente, **When** confirma a edição, **Then** a encomenda é atualizada, a auditoria registra a operação e ao retornar ao dashboard o registro exibe o novo status com a cor correspondente
4. **Given** o coletor retorna ao dashboard após editar uma encomenda, **When** a tela é exibida, **Then** a encomenda editada reflete o status atualizado e, se o novo status não for mais "Pendente de Coleta" e a encomenda não for de sua responsabilidade, ela desaparece da listagem

---

### User Story 4 - Dashboard Administrativo de Atividades de Coletores (Priority: P4)

Um administrador autenticado acessa o mesmo caminho de dashboard, mas visualiza um painel diferente: um resumo das atividades de coleta realizadas por todos os coletores, organizado por data de chegada das encomendas. O painel permite ao administrador acompanhar o desempenho operacional da equipe.

**Why this priority**: Entrega valor diferenciado para o administrador no mesmo ponto de acesso, evitando que ele veja a listagem operacional do coletor.

**Independent Test**: Testável logando como administrador, acessando o dashboard e verificando que o painel exibe uma visão de atividades por coletor, não a listagem operacional de encomendas.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado acessa o dashboard, **When** a tela carrega, **Then** é exibido um painel de atividades dos coletores, não a listagem operacional de encomendas pendentes
2. **Given** o painel administrativo está aberto, **When** o administrador visualiza os dados, **Then** as encomendas são organizadas por data de chegada, exibindo para cada data: a lista de coletores que atuaram, a quantidade de encomendas por status e as observações registradas
3. **Given** não há atividades de coleta registradas no período, **When** o administrador visualiza o painel, **Then** uma mensagem informa que não há atividades registradas
4. **Given** o administrador visualiza o painel de atividades, **When** clica em uma encomenda listada, **Then** é redirecionado para a tela de edição completa da encomenda (com todos os campos disponíveis para o perfil admin)

---

### Edge Cases

- O que acontece quando o nome do coletor no campo "Responsável" não corresponde exatamente ao nome cadastrado no sistema (diferenças de maiúsculas/minúsculas)? A comparação deve ser case-insensitive para evitar falsos negativos na listagem do coletor.
- O que acontece se uma encomenda está "Pendente de Coleta" E o responsável é o coletor logado? O registro deve aparecer uma única vez, sem duplicação.
- O que acontece quando o coletor atualiza o status de uma encomenda para algo que não é mais "Pendente de Coleta" e não é de sua responsabilidade? A encomenda deve sair da sua listagem do dashboard imediatamente ou após recarregar.
- O que acontece se o popup for aberto e a encomenda for editada por outro usuário simultaneamente? Os dados do popup podem estar desatualizados — ao abrir a tela de edição, os dados são carregados novamente do servidor.
- O que acontece quando o admin acessa o dashboard e não há coletores com atividades? O painel exibe estado vazio com mensagem informativa.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir ao coletor autenticado, na tela de dashboard, todas as encomendas ativas com status "Pendente de Coleta", independente do responsável atribuído
- **FR-002**: O sistema DEVE exibir ao coletor autenticado, na tela de dashboard, todas as encomendas ativas cujo campo "Responsável" corresponda ao nome do usuário logado (comparação case-insensitive), independente do status
- **FR-003**: O sistema DEVE eliminar duplicatas: encomendas que satisfazem ambos os critérios (FR-001 e FR-002) devem aparecer uma única vez no dashboard do coletor
- **FR-004**: O sistema DEVE ordenar os registros no dashboard do coletor por data de chegada em ordem crescente (mais antigas primeiro)
- **FR-005**: O sistema DEVE exibir cada encomenda no dashboard com destaque visual na cor indicativa do seu status atual
- **FR-006**: O sistema DEVE agrupar visualmente as encomendas no dashboard do coletor por status, mantendo a separação cromática definida pela cor indicativa de cada status
- **FR-007**: O sistema DEVE disponibilizar visualização rápida (popup/modal) para cada encomenda listada no dashboard, exibindo: código, transportadora, responsável, destino, quantidade de volumes, data de chegada, data de coleta, status atual (com cor) e observações
- **FR-008**: O popup de visualização rápida DEVE oferecer link direto para a tela de edição da encomenda
- **FR-009**: O sistema DEVE fechar o popup sem recarregar o dashboard ao clicar fora do popup ou acionar o fechamento explícito
- **FR-010**: A tela de edição acessada pelo coletor a partir do dashboard DEVE respeitar as restrições de perfil: apenas campos "Status", "Observações" e "Quantidade coletada" são editáveis; os demais campos ficam somente para leitura
- **FR-011**: O sistema DEVE aplicar as mesmas validações de edição da feature 006 ao coletor que edita via dashboard: observações obrigatórias para status de exceção, quantidade coletada obrigatória e dentro do limite de volumes
- **FR-012**: Após a edição pelo coletor, ao retornar ao dashboard, a encomenda editada DEVE refletir o novo status; se não satisfizer mais nenhum dos critérios de exibição (FR-001 e FR-002), deve ser removida da listagem
- **FR-013**: O sistema DEVE exibir ao administrador autenticado, na tela de dashboard, um painel de atividades dos coletores em lugar da listagem operacional
- **FR-014**: O painel administrativo DEVE organizar as atividades por data de chegada das encomendas, exibindo por data: coletores que atuaram, encomendas por status e observações registradas
- **FR-015**: O painel administrativo DEVE permitir que o administrador acesse a tela de edição completa de qualquer encomenda listada
- **FR-016**: O sistema DEVE exibir mensagem de estado vazio quando não houver encomendas a exibir para o coletor ou atividades para o administrador

### Key Entities

- **Encomenda** (referência à feature 006): Exibida no dashboard com código, transportadora, responsável, destino, volumes, datas, status e observações
- **Status da Encomenda** (referência à feature 005): Fornece o nome e a cor indicativa usados na separação visual e no destaque cromático do dashboard
- **Atividade de Coleta** (visão derivada): Agrupamento de encomendas por data de chegada e coletor responsável, usada exclusivamente no painel administrativo

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O dashboard do coletor carrega e exibe todas as encomendas relevantes em menos de 2 segundos com até 200 registros
- **SC-002**: 100% das encomendas exibidas no dashboard apresentam a cor indicativa do status correto, sem discrepâncias visuais
- **SC-003**: O popup de visualização rápida abre em menos de 500 milissegundos após o acionamento
- **SC-004**: Um coletor consegue ir do dashboard até o registro de resultado de coleta (atualizar status) em menos de 3 interações (clique no card → popup → link de edição)
- **SC-005**: Nenhuma encomenda duplicada aparece no dashboard do coletor — 0 ocorrências de registros repetidos
- **SC-006**: 100% das edições realizadas pelo coletor via dashboard respeitam as restrições de perfil (somente status, observações e quantidade coletada editáveis)
- **SC-007**: O painel administrativo carrega e exibe as atividades dos coletores em menos de 3 segundos com dados de até 30 dias

## Assumptions

- A feature 006 (Cadastro de Encomendas) está implementada, incluindo os campos "Responsável", "Status" e os fluxos de edição por perfil de coletor (FR-012 da feature 006)
- A feature 005 (Gestão de Status da Encomenda) está implementada, com os status operacionais e suas cores indicativas disponíveis
- O sistema de autenticação com distinção de perfil (administrador vs. coletor) está funcional (ÉPICO 1 e ÉPICO 2)
- O campo "Responsável" é texto livre (nome da pessoa) conforme definido na feature 006 — a correspondência com o usuário logado é feita por comparação do nome do usuário autenticado com o valor do campo
- O dashboard é acessível via menu principal de navegação, seguindo os padrões de layout já estabelecidos no projeto
- O painel administrativo não precisa de filtros por período na versão inicial — exibe todas as atividades disponíveis ordenadas por data de chegada
- O popup de visualização rápida é somente leitura — a edição sempre ocorre na tela dedicada de edição da encomenda
- O dashboard não implementa atualização automática (polling) — o coletor recarrega manualmente quando necessário
- A tela de edição acessada via dashboard é a mesma tela de edição da feature 006, respeitando as permissões do perfil; não é uma tela nova
