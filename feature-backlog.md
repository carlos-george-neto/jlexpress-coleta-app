# Backlog do Produto — Sistema de Gestão e Coleta de Encomendas

## Visão Geral do Produto

Aplicação web responsiva para gerenciamento operacional de encomendas aéreas, permitindo:

- Cadastro e gerenciamento de cargas
- Controle operacional de coletas
- Atualização de status
- Gestão de exceções
- Controle de usuários e permissões
- Auditoria operacional
- Funcionamento em web e mobile

---

# Perfis de Usuário

## Administrador

Permissão total no sistema:

- Gestão de usuários
- Gestão de encomendas
- Gestão de status
- Visualização completa
- Auditoria
- Configurações

## Coletor/Entregador

Permissões restritas:

- Consultar encomendas
- Atualizar status
- Inserir observações
- Registrar exceções

---

# ÉPICO 1 — Autenticação e Controle de Acesso

## Objetivo

Garantir acesso seguro ao sistema com segregação de permissões.

## Feature 1.1 — Tela de Login

### Tasks

- Criar layout responsivo da tela de login
- Implementar autenticação via e-mail e senha com Supabase
- Implementar JWT/Auth Session
- Criar funcionalidade de logout
- Validar credenciais inválidas
- Implementar recuperação de senha
- Criar política mínima de senha
- Criar tela de redefinição de senha

## Feature 1.2 — Controle de Permissões (RBAC)

### Tasks

- Criar modelagem de perfis
- Implementar RBAC
- Restringir endpoints por perfil
- Restringir menus e telas no frontend
- Criar middleware de autorização

---

# ÉPICO 2 — Gestão de Usuários

## Objetivo

Permitir administração de usuários do sistema.

## Feature 2.1 — Cadastro de Usuários

### Tasks

- Criar script de insert usuário root (admin) para ser executado no Supabase
- Criar tabela de usuários
- Criar endpoint de cadastro
- Criar tela administrativa de cadastro
- Validar e-mail duplicado
- Implementar hash de senha
- Criar paginação
- Criar ordenação
- Criar busca por nome/e-mail

## Feature 2.2 — Edição de Usuários

### Tasks

- Editar dados cadastrais
- Alterar perfil
- Resetar senha
- Ativar/Inativar usuário
- Criar auditoria de alteração

---

# ÉPICO 3 - Gestão de Status da Encomenda

### Objetivo

Permitir parametrização dinâmica dos status operacionais.

## Feature 3.1 — Criar entidade Status da Encomenda

  - Criar tabela `shipment_status`
  - Criar migrations

### Campos do Status

| Campo | Tipo |
|---------|---------|
| Nome | Texto |
| Descrição | Texto |
| Ativo | Boolean |
| Exige Observação | Boolean |
| Status de Exceção | Boolean |
| Status Finalizador | Boolean |
| Ordem do Fluxo | Número |
| Cor Indicativa | Texto |

# Sugestão de Status Iniciais

| Status | Exceção | Exige Observação |
|----------|----------|----------|
| Pendente de Coleta | Não | Não |
| Em Coleta | Não | Não |
| Coletado | Não | Não |
| Coleta Parcial | Sim | Sim |
| Não Coletado | Sim | Sim |
| Cancelado | Sim | Sim |
| Aguardando Validação | Não | Não |

### Feature 3.2 — Cadastro de Status

#### Tasks

- Criar endpoint POST
- Criar tela administrativa
- Criar roteamento na pagina Dashboard
- Validar duplicidade de nome
- Validar campos obrigatórios
- Criar auditoria

### Feature 3.3 — Listagem de Status

#### Tasks

- Criar paginação
- Criar filtros:
  - ativos
  - inativos
  - exceção
  - finalizadores
- Criar ordenação por fluxo
- Criar busca textual

### Feature 3.4 — Edição de Status

#### Tasks

- Criar endpoint PUT/PATCH
- Permitir alteração de:
  - nome
  - descrição
  - flags
  - ordenação
  - cor
- Criar auditoria

### Feature 3.5 — Desativação de Status

#### Tasks

- Implementar soft delete
- Bloquear uso de status inativos
- Exibir indicador visual de inativo
- Validar impacto histórico

### Regras de Negócio dos Status

| Código | Regra |
|----------|----------|
| RN010 | Apenas administradores podem gerenciar status |
| RN011 | Status podem ser ativados/inativados |
| RN012 | Status inativos não podem ser utilizados |
| RN013 | Não permitir exclusão física |
| RN014 | Status possuem ordenação de fluxo |
| RN015 | Alguns status exigem observação |
| RN016 | Alguns status representam exceção |
| RN017 | Alguns status encerram fluxo |


---

# ÉPICO 4 — Gestão de Encomendas

## Objetivo

Controlar encomendas disponíveis para coleta.

## Feature 4.1 — Cadastro de Encomendas

### Campos

| Campo | Tipo |
|---------|---------|
| Código da encomenda | Texto |
| Transportadora | Texto |
| Quantidade de volumes | Número |
| Data de chegada | Data |
| Data de coleta | Data |
| Destino | Texto |
| Responsável | Texto |
| Status | Status |
| Observações | Texto |

### Tasks

- Criar modelagem de encomendas
- Criar CRUD de encomendas
- Criar validações obrigatórias
- Criar máscaras de campos
- Criar paginação
- Criar ordenação
- Criar busca textual
- Criar filtros
- Implementar soft delete
- Criar auditoria

---

# ÉPICO 5 — Consulta Operacional de Coletas

## Objetivo

Permitir que coletores consultem cargas disponíveis.

## Feature 5.1 — Consulta de Encomendas

### Filtros

- Transportadora
- Data início chegada
- Data fim chegada
- Status coleta

### Tasks

- Criar tela de listagem
- Criar paginação
- Implementar filtros
- Implementar ordenação
- Criar indicadores visuais
- Criar busca textual
- Criar cards responsivos mobile

## Feature 5.2 — Visualização Detalhada

### Tasks

- Exibir detalhes da encomenda
- Exibir histórico
- Exibir observações
- Exibir data da coleta
- Exibir timeline operacional

---

# ÉPICO 6 — Processo de Coleta

## Objetivo

Permitir atualização operacional das encomendas.

## Feature 6.1 — Atualização de Status

### Tasks

- Criar endpoint atualização status
- Atualizar data coleta automaticamente
- Registrar usuário responsável
- Criar auditoria
- Validar permissões
- Validar regras de transição

### Regras de Negócio

| Código | Regra |
|----------|----------|
| RN001 | Apenas administradores cadastram encomendas |
| RN002 | Apenas administradores cadastram usuários |
| RN003 | Coletor altera apenas status/observação |
| RN004 | Status "Coletado" preenche data de coleta automaticamente |
| RN005 | Status que exigem observação tornam campo obrigatório |
| RN006 | Coleta parcial exige quantidade coletada |
| RN007 | Usuário deve autenticar |
| RN008 | Sistema deve funcionar mobile/web |
| RN009 | Todas alterações devem ser auditáveis |

## Feature 6.2 — Tratativa de Exceções

### Cenários

- Não coletado
- Coleta parcial

### Tasks

- Criar formulário de exceção
- Criar campo observação obrigatório
- Criar campo quantidade coletada
- Registrar logs
- Registrar auditoria
- Destacar visualmente exceções

---

# ÉPICO 7 — Responsividade e UX

## Objetivo

Garantir experiência fluida em web e mobile.

## Feature 7.1 — Responsividade

### Tasks

- Adaptar layout web/mobile
- Criar menu responsivo
- Criar tabelas responsivas
- Validar usabilidade touch
- Ajustar breakpoints

## Feature 7.2 — Experiência do Usuário

### Tasks

- Criar loading states
- Criar feedback visual
- Criar mensagens amigáveis
- Padronizar componentes
- Criar estados vazios
- Criar tratamento visual de erro

---

# ÉPICO 8 — Auditoria e Rastreabilidade

## Objetivo

Garantir rastreabilidade operacional.

## Feature 8.1 — Histórico de Alterações

### Tasks

Registrar:

- usuário
- data/hora
- alteração
- status anterior
- novo status

Além disso:

- Criar tela de auditoria
- Criar filtros
- Criar exportação

---

# Sugestão de Estrutura Técnica (Tech Stack)

- **Linguagem**: TypeScript (latest)
- **Framework**: Next.js (App Router)
- **Estilização**: Tailwind CSS
- **Banco de Dados & Autenticação**: Supabase (login com e-mail e senha)
- **Ícones**: Uma única biblioteca de ícones
- **Zero dependências desnecessárias**: Apenas React, TypeScript, Supabase e biblioteca de ícones

## Infraestrutura

- Vercel
- Docker
- CI/CD
- Monitoramento
- Logs centralizados

---

# Sugestão de MVP Inicial

## Sprint 1

- Login
- Controle de acesso
- Cadastro de usuários
- Cadastro de status
- Cadastro de encomendas

## Sprint 2

- Consulta operacional
- Atualização de status
- Tratativa de exceções

## Sprint 3

- E-mails automáticos
- Auditoria
- Responsividade
- Melhorias UX

---

