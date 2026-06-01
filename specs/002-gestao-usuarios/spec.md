# Especificação de Feature: Gestão de Usuários

**Feature Branch**: `002-gestao-usuarios`

**Created**: 2026-06-01

**Status**: Draft

**Input**: Épico 2 — Gestão de Usuários do backlog de produto - "Permitir administração de usuários do sistema com funcionalidades de cadastro e edição"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Administrador Cadastra Novo Usuário (Priority: P1)

Um administrador do sistema precisa cadastrar novos usuários (coletores, entregadores ou outros administradores) para que eles possam acessar o sistema e realizar suas funções operacionais.

**Why this priority**: Capacidade central para onboarding de qualquer novo usuário no sistema. Sem isso, nenhum usuário pode ser adicionado.

**Independent Test**: Pode ser testado criando um novo usuário com email, nome e perfil, e verificando se ele é persistido e pode fazer login.

**Acceptance Scenarios**:

1. **Given** o administrador está na tela de cadastro de usuários, **When** preenche email válido, nome, perfil e cria a senha, **Then** o usuário é criado com sucesso e recebe feedback positivo
2. **Given** o administrador tenta criar um usuário com email já existente, **When** confirma o formulário, **Then** o sistema exibe erro de duplicação e não cria o usuário
3. **Given** o administrador deixa um campo obrigatório em branco, **When** tenta enviar, **Then** o sistema valida e exibe mensagem de erro indicando qual campo é obrigatório

---

### User Story 2 - Administrador Edita Dados Cadastrais de Usuário (Priority: P1)

Um administrador precisa editar informações cadastrais de um usuário existente (nome, email, perfil) para manter os dados atualizados e realizar ajustes operacionais.

**Why this priority**: Gerenciamento essencial de dados de usuários, permite correção de informações incorretas e atualização de papéis.

**Independent Test**: Pode ser testado editando um usuário existente, alterando seus dados, salvando e verificando se as alterações persistem.

**Acceptance Scenarios**:

1. **Given** o administrador acessa um usuário existente, **When** altera o nome e perfil, **Then** as alterações são salvas e a auditoria registra quem fez a alteração e quando
2. **Given** o administrador tenta alterar o email para um valor já existente em outro usuário, **When** tenta salvar, **Then** o sistema exibe erro de duplicação
3. **Given** o administrador edita um usuário, **When** navega para outra página e retorna, **Then** as alterações persistem

---

### User Story 3 - Administrador Reseta Senha de Usuário (Priority: P1)

Um administrador pode reseta a senha de um usuário que tenha esquecido ou quando o usuário está tendo problemas de acesso.

**Why this priority**: Essencial para resolução de problemas operacionais e acesso do usuário ao sistema.

**Independent Test**: Pode ser testado resetando a senha de um usuário e verificando se o novo acesso funciona com a senha temporária.

**Acceptance Scenarios**:

1. **Given** o administrador acessa a edição de um usuário, **When** clica em "Resetar Senha", **Then** uma senha temporária é gerada e exibida
2. **Given** uma senha foi resetada, **When** o usuário tenta fazer login com a nova senha, **Then** consegue acessar o sistema
3. **Given** o administrador reseta uma senha, **When** confirma a ação, **Then** a auditoria registra quem fez o reset e quando

---

### User Story 4 - Administrador Ativa/Desativa Usuário (Priority: P2)

Um administrador pode ativar ou desativar um usuário (soft delete) para controlar quem tem acesso ao sistema sem perder dados históricos.

**Why this priority**: Importante para gestão de acessos e controle de permissões, mas pode ser implementado após a capacidade básica de CRUD.

**Independent Test**: Pode ser testado desativando um usuário e verificando que ele não consegue mais fazer login, enquanto dados históricos são preservados.

**Acceptance Scenarios**:

1. **Given** um usuário ativo está listado, **When** administrador clica em "Desativar", **Then** o usuário é marcado como inativo e não consegue mais fazer login
2. **Given** um usuário inativo está listado, **When** administrador clica em "Ativar", **Then** o usuário volta a ter acesso
3. **Given** um usuário é desativado, **When** consulta o histórico de auditoria, **Then** o registro de desativação está documentado com usuário e timestamp

---

### User Story 5 - Administrador Lista e Busca Usuários (Priority: P2)

Um administrador precisa listar todos os usuários do sistema com capacidade de busca, paginação e ordenação para localizar rapidamente um usuário específico.

**Why this priority**: Essencial para gerenciamento em escala, permitindo encontrar usuários rapidamente, mas é suporte a outras operações.

**Independent Test**: Pode ser testado buscando por nome/email, paginando resultados e verificando se a listagem está correta e performática.

**Acceptance Scenarios**:

1. **Given** existem múltiplos usuários no sistema, **When** administrador acessa a listagem, **Then** vê todos os usuários com paginação (ex: 10 por página)
2. **Given** a listagem de usuários está aberta, **When** digita um termo de busca no campo de busca, **Then** a lista filtra em tempo real por nome ou email
3. **Given** há muitos usuários listados, **When** clica em ordenar por coluna, **Then** a lista é reordenada conforme solicitado

---

### Edge Cases

- O que acontece se o administrador tenta desativar a si mesmo?
- Como o sistema se comporta se dois administradores tentam editar o mesmo usuário simultaneamente?
- Qual é o comportamento quando a senha temporária não consegue ser gerada?
- Como o sistema trata email duplicado em casos sensíveis a maiúsculas/minúsculas?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE permitir cadastro de novo usuário com email, nome, e atribuição de perfil
- **FR-002**: Sistema DEVE validar que email é único no sistema (case-insensitive)
- **FR-003**: Sistema DEVE permitir edição de dados cadastrais de usuário existente (nome, email, perfil)
- **FR-004**: Sistema DEVE permitir reset de senha de usuário, gerando uma senha temporária
- **FR-005**: Sistema DEVE permitir ativação e desativação de usuários (soft delete)
- **FR-006**: Sistema DEVE permitir listagem paginada de usuários
- **FR-007**: Sistema DEVE permitir busca de usuários por nome ou email
- **FR-008**: Sistema DEVE permitir ordenação de usuários por coluna
- **FR-009**: Sistema DEVE implementar validação de campos obrigatórios (email, nome, perfil)
- **FR-010**: Sistema DEVE implementar política mínima de senha (conforme constitution.md)
- **FR-011**: Sistema DEVE armazenar hash de senha, nunca em texto plano
- **FR-012**: Sistema DEVE registrar auditoria de todas as alterações de usuário (quem, quando, o quê)
- **FR-013**: Sistema DEVE garantir que apenas administradores podem gerenciar usuários
- **FR-014**: Sistema DEVE impedir exclusão física de usuários (apenas soft delete)
- **FR-015**: Sistema DEVE preservar histórico de usuários desativados para auditoria

### Key Entities *(include if feature involves data)*

- **User (Usuário)**: Representa um usuário do sistema
  - email (string, unique, required): Identificador único do usuário
  - nome (string, required): Nome completo do usuário
  - perfil (string, required): Perfil/Role do usuário (administrador, coletor, etc.)
  - ativo (boolean, default: true): Indica se o usuário está ativo no sistema
  - data_criacao (timestamp): Quando o usuário foi criado
  - data_atualizacao (timestamp): Quando foi feita a última atualização
  - criado_por (string): ID do usuário que criou este registro
  - atualizado_por (string): ID do usuário que fez a última atualização

- **User Audit Log (Auditoria de Usuário)**: Registra todas as alterações em usuários
  - usuario_id (string, required): ID do usuário alterado
  - tipo_alteracao (string, required): tipo de alteração (criado, editado, desativado, etc.)
  - dados_anteriores (json): Snapshot dos dados antes da alteração
  - dados_novos (json): Snapshot dos dados após a alteração
  - usuario_responsavel (string): ID do usuário que fez a ação
  - data_alteracao (timestamp): Quando a alteração ocorreu
  - motivo (string, optional): Motivo ou descrição da alteração

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrador consegue cadastrar novo usuário em menos de 1 minuto
- **SC-002**: Validação de email duplicado ocorre em tempo real (< 500ms)
- **SC-003**: Listagem de até 1000 usuários carrega em menos de 3 segundos
- **SC-004**: Busca de usuários retorna resultados em menos de 1 segundo
- **SC-005**: 95% das operações de CRUD completam sem erro
- **SC-006**: 100% das alterações de usuário são registradas em auditoria
- **SC-007**: Usuários desativados são removidos da listagem de usuários ativos após 5 segundos
- **SC-008**: Interface responsiva funciona em desktop, tablet e mobile

## Assumptions

- Autenticação já está implementada (Feature 1.1 - Login)
- Sistema de perfis/roles já está definido (Feature 1.2 - RBAC)
- Base de dados Supabase já está configurada e acessível
- Middleware de autorização já valida que apenas administradores podem acessar endpoints de gestão de usuários
- Email é o campo único identificador para usuários
- Password hashing já está implementado no sistema
- Política de senha mínima será definida no arquivo constitution.md
- Timezone do sistema é UTC
- Soft delete é preferido para manter auditoria histórica
