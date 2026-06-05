# Feature Specification: Admin Self-Deactivation Block e Toggle de Senha no Login

**Feature Branch**: `004-admin-edit-password-toggle`

**Created**: 2026-06-05

**Status**: Approved

**Input**: User description: "Usuarios com a role admin não poderão desativar seu proprio usuario na edição. Ou seja, quando o usuário logado for do tipo admin, ele não poderá desativar seu proprio usuario na edição. Portanto, o botão deverá ficar suprimido na tela de edição. Na tela de login deverá ter um botão para habilitar ou desabilitar a exibição do campo senha para o usuário poder saber o que está sendo digitado."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Não Pode Desativar Própria Conta (Priority: P1)

Um administrador logado acessa a tela de edição do seu próprio usuário. Ao visualizar a tela, o botão de desativar conta não aparece — impedindo que o administrador remova acidentalmente seu próprio acesso ao sistema.

**Why this priority**: Impede que administradores se bloqueiem acidentalmente do sistema, protegendo a integridade do acesso administrativo. Sem pelo menos um admin ativo, o sistema pode ficar sem gestão.

**Independent Test**: Pode ser testado completamente fazendo login como admin, navegando até a edição do próprio perfil e verificando que o botão de desativar não está visível.

**Acceptance Scenarios**:

1. **Given** um usuário com role admin está logado, **When** ele acessa a tela de edição do seu próprio perfil, **Then** o botão de desativar conta não é exibido na tela.
2. **Given** um usuário com role admin está logado, **When** ele acessa a tela de edição do perfil de outro usuário, **Then** o botão de desativar conta é exibido normalmente.
3. **Given** um usuário sem role admin está logado, **When** ele acessa a tela de edição do próprio perfil, **Then** o comportamento do botão de desativar não é afetado por esta regra.

---

### User Story 2 - Toggle de Visibilidade da Senha no Login (Priority: P2)

Um usuário na tela de login pode clicar em um botão ao lado do campo de senha para alternar entre exibir e ocultar o que está sendo digitado, garantindo que possa verificar se a senha foi digitada corretamente antes de enviar o formulário.

**Why this priority**: Melhora a experiência do usuário no login, reduzindo erros de digitação de senha e chamadas de suporte por acesso negado. É uma funcionalidade de usabilidade padrão em aplicações modernas.

**Independent Test**: Pode ser testado acessando a tela de login sem estar autenticado, clicando no botão de toggle e verificando que o campo de senha alterna entre texto visível e texto mascarado.

**Acceptance Scenarios**:

1. **Given** o usuário está na tela de login com o campo de senha oculto (estado padrão), **When** ele clica no botão de toggle de visibilidade, **Then** os caracteres digitados no campo de senha ficam visíveis.
2. **Given** o usuário está na tela de login com o campo de senha visível, **When** ele clica novamente no botão de toggle, **Then** os caracteres voltam a ser mascarados (estado padrão).
3. **Given** o usuário está na tela de login, **When** ele visualiza o campo de senha, **Then** o botão de toggle de visibilidade está sempre presente e acessível próximo ao campo.
4. **Given** o usuário ativou a visibilidade da senha, **When** ele submete o formulário de login, **Then** a senha é enviada normalmente, independentemente do estado do toggle.

---

### Edge Cases

- O que acontece se um admin tentar desativar a própria conta via URL direta (sem passar pela tela de edição)? → A restrição se aplica apenas à supressão do botão na tela de edição; mecanismos de controle de acesso no backend devem complementar essa proteção.
- O que acontece se houver apenas um admin no sistema e ele tentar desativar outro admin? → Este cenário está fora do escopo desta feature; a restrição cobre apenas auto-desativação.
- O toggle de senha deve persistir entre tentativas de login (ex.: página recarregada)? → Não; o toggle deve resetar para o estado padrão (senha oculta) a cada carregamento da página.
- O botão de toggle deve ser acessível por teclado? → Sim; deve ser navegável via teclado para acessibilidade básica.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE ocultar o botão de desativar conta na tela de edição quando o usuário logado for o mesmo usuário sendo editado e possuir role admin.
- **FR-002**: O sistema DEVE exibir o botão de desativar conta normalmente quando um admin editar o perfil de outro usuário.
- **FR-003**: O sistema DEVE exibir o botão de desativar conta normalmente para usuários sem role admin editando qualquer perfil, respeitando as regras de permissão existentes.
- **FR-004**: A tela de login DEVE apresentar um botão/ícone de toggle junto ao campo de senha para alternar a visibilidade do conteúdo digitado.
- **FR-005**: O botão de toggle DEVE alternar o campo de senha entre estado mascarado (padrão) e estado de texto visível a cada clique.
- **FR-006**: O estado padrão do campo de senha na tela de login DEVE ser mascarado (oculto).
- **FR-007**: O botão de toggle DEVE possuir indicação visual clara do estado atual (exibindo ou ocultando senha).
- **FR-008**: O toggle de visibilidade de senha NÃO DEVE interferir no processo de autenticação — a senha deve ser enviada corretamente independentemente do estado do toggle.

### Key Entities

- **Usuário**: Possui identidade única, role (admin ou outros tipos) e status (ativo/inativo). A comparação entre o usuário logado e o usuário sendo editado é a base da restrição de admin.
- **Sessão de usuário**: Registra a identidade e a role do usuário atualmente autenticado, utilizada para avaliar as restrições de edição.
- **Campo de senha**: Elemento do formulário de login cujo modo de exibição (mascarado/visível) é controlado pelo toggle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos administradores que acessam a edição do próprio perfil não visualizam o botão de desativar conta.
- **SC-002**: 0% de tentativas de auto-desativação completadas com sucesso por administradores através da tela de edição.
- **SC-003**: O botão de toggle de senha está presente e funcional em 100% dos carregamentos da tela de login.
- **SC-004**: A alternância de visibilidade da senha ocorre imediatamente após o clique no toggle, sem atraso perceptível pelo usuário.
- **SC-005**: Usuários que utilizam o toggle de senha não apresentam aumento na taxa de falhas de login em relação ao estado anterior à feature.

## Assumptions

- O sistema já possui um mecanismo de identificação do usuário logado que pode ser comparado ao usuário sendo editado (identidade da sessão atual).
- "Desativar" refere-se à ação de mudar o status do usuário de ativo para inativo (não exclusão permanente).
- A restrição se aplica exclusivamente à role admin; outros perfis privilegiados (se existirem) não são afetados por esta regra, a menos que futuras especificações indiquem o contrário.
- O toggle de senha se aplica ao campo de senha do formulário de login principal; formulários de alteração de senha em outras telas estão fora do escopo desta feature.
- A proteção no frontend (supressão do botão) é a entrega principal desta feature; proteções adicionais no backend estão fora do escopo mas são recomendadas como complemento de segurança.
- A tela de login já existe; esta feature adiciona apenas o elemento de toggle ao design existente.
