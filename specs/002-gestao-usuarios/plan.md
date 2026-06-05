# Plano de Implementação: Gestão de Usuários

**Branch**: `002-gestao-usuarios` | **Data**: 2026-06-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-gestao-usuarios/spec.md`

## Resumo Executivo

Feature de gestão administrativa de usuários que permite criar, editar, listar, buscar e gerenciar usuários do sistema com capacidades de controle de acesso, reset de senha e auditoria completa. Esta feature é essencial para onboarding de novos usuários (coletores, entregadores e administradores) após o sistema de autenticação estar funcional (Feature 001).

**Abordagem Técnica**: Implementar endpoints REST na API Next.js que gerenciam usuários via Supabase, com middlewares de autenticação para proteger operações administrativas. Criar interface administrativa usando React com React Hook Form e Zod para validação.

## Contexto Técnico

**Linguagem/Versão**: TypeScript 5.7, Next.js 15+ (App Router)

**Dependências Principais**: 
- Supabase (autenticação + storage de usuários)
- React Hook Form 7.x (formulários)
- Zod 3.x (validação)
- TailwindCSS 3.x (estilização)

**Armazenamento**: PostgreSQL via Supabase
  - Tabela `users` (dados de usuários com referência a auth.users do Supabase)
  - Tabela `user_audit_log` (log de todas as alterações)
  - NEEDS CLARIFICATION: Estratégia de integração com Supabase Auth

**Testes**: Nenhum (conforme constituição do projeto)

**Plataforma Alvo**: Navegador web (desktop, tablet, mobile)

**Tipo de Projeto**: Web application full-stack (Next.js)

**Objetivos de Performance**:
- SC-002: Validação de email duplicado < 500ms
- SC-003: Listagem de até 1000 usuários < 3 segundos
- SC-004: Busca de usuários < 1 segundo

**Restrições**:
- Zero testes automatizados
- Apenas administradores (RBAC) podem gerenciar usuários
- Soft delete obrigatório (nunca exclusão física)
- Auditoria 100% para todas as operações

**Escopo/Escala**: 
- 5 user stories (US1-US5)
- ~15 endpoints REST
- ~8-10 componentes React
- ~5-8 páginas/rotas
- ~2-3 tabelas de banco de dados

## Verificação de Conformidade (Constitution Check)

**GATE**: Deve passar antes de Phase 0 research. Será re-avaliada após Phase 1 design.

| Princípio | Status | Observação |
|-----------|--------|-----------|
| **Idioma Português** | ✅ Passa | Toda a documentação e comentários em PT-BR |
| **Sem Testes** | ✅ Passa | Zero testes conforme constituição |
| **TypeScript Strict** | ✅ Passa | `strict: true` em tsconfig.json |
| **Componentes Funcionais** | ✅ Passa | Será usado apenas functional components |
| **Props Tipadas** | ✅ Passa | Interfaces nomeadas em types.ts |
| **Separação de Responsabilidades** | ✅ Passa | Lógica de negócio em services/, UI em components/ |
| **Mobile-First** | ✅ Passa | TailwindCSS com responsive design |
| **Zero Dependências Desnecessárias** | ✅ Passa | Apenas dependências essenciais listadas |
| **LGPD/GDPR** | ✅ Passes | Auditoria completa de todas as operações |

**Resultado**: ✅ **PASSA** — Feature alinhada com constituição. 

## Estrutura do Projeto

### Documentação (esta feature)

```text
specs/002-gestao-usuarios/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 output - Pesquisa e clarificações
├── data-model.md        # Phase 1 output - Modelo de dados
├── contracts/           # Phase 1 output - Contratos de API
│   └── api-contracts.md
├── quickstart.md        # Phase 1 output - Guia de início rápido
├── tasks.md             # Phase 2 output - Tarefas (via /speckit.tasks)
└── checklists/
    └── requirements.md
```

### Código-fonte (estrutura do projeto)

```text
src/
├── app/
│   ├── (admin)/                          # Novo: Seção administrativa
│   │   ├── layout.tsx                    # Layout para admin
│   │   └── users/
│   │       ├── page.tsx                  # Listagem/busca de usuários
│   │       ├── [userId]/
│   │       │   └── page.tsx              # Edição de usuário
│   │       └── new/
│   │           └── page.tsx              # Cadastro novo usuário
│   └── api/
│       └── users/                        # Novo: Endpoints de usuários
│           ├── route.ts                  # GET (listar, filtrar), POST (criar)
│           ├── [userId]/route.ts         # GET, PUT, DELETE (soft delete)
│           ├── [userId]/reset-password/route.ts  # POST reset
│           └── validate-email/route.ts   # GET validação
├── components/
│   ├── admin/                            # Novo: Componentes administrativos
│   │   └── users/
│   │       ├── UserList.tsx              # Tabela de usuários
│   │       ├── UserForm.tsx              # Formulário criar/editar
│   │       ├── UserSearch.tsx            # Filtro/busca
│   │       └── UserPagination.tsx        # Paginação
│   └── [estrutura existente]
├── lib/
│   ├── services/                         # Novo: Lógica de negócio
│   │   └── user.service.ts               # Operações CRUD e auditoria
│   ├── schemas/
│   │   └── user.ts                       # Novo: Zod schemas
│   ├── types/
│   │   └── user.ts                       # Novo: Tipos TypeScript
│   └── [estrutura existente]
└── middleware.ts                         # Será estendido para admin
```

**Decisão Estrutural**: Single project Next.js com separação clara entre camadas:
- **API** (`src/app/api/users/`) — endpoints REST com serviços reutilizáveis
- **UI** (`src/app/(admin)/users/`) — páginas e componentes React
- **Negócio** (`src/lib/services/`) — lógica independente de framework

## Necessidades de Clarificação (Phase 0: Research)

**Identificadas as seguintes clarificações que devem ser resolvidas em `research.md`**:

1. **NEEDS CLARIFICATION**: Geração de senha temporária
   - Usar `crypto.randomBytes()` + base64?  
   - Usar `generate-password` package?  
   - Enviar via email ou exibir na tela?  

2. **NEEDS CLARIFICATION**: Integração com Supabase Auth
   - Estender `auth.users` do Supabase?  
   - Manter tabela `users` separada com FK?  
   - Usar Admin API para reset?  

3. **NEEDS CLARIFICATION**: Política de senha mínima
   - Requisitos de complexidade?  
   - Comprimento mínimo?  
   - Já definida?  

4. **🔴 CRITICO - NEEDS CLARIFICATION**: **Script de seed de usuário root**
   - Formato: SQL puro vs CLI vs Node.js?  
   - Momento: setup inicial, CI/CD ou manual?  
   - Valores: email fixo, senha hashed, perfil?  
   - Proteção: como evitar execução duplicada?  
   - **Integração em quickstart.md com instruções passo a passo**

5. **NEEDS CLARIFICATION**: Triggers de auditoria
   - PostgreSQL triggers automáticos?  
   - Application-level logging?  
   - Combinação?  

**Research Output**: Arquivo `research.md` com decisões justificadas.

## Fases de Implementação

### Phase 0: Pesquisa & Clarificação

- Investigar Supabase Admin API para reset de senha
- Comparar estratégias de seed de banco (SQL, migrations, fixtures)
- Definir política de senha mínima do projeto
- Explorar padrões de auditoria em Next.js + Supabase
- **Planejar script de inserção do usuário root com proteções**

**Entrega**: `research.md`

### Phase 1: Design & Contratos

- **`data-model.md`**: Schema PostgreSQL completo (`users`, `user_audit_log`)
- **`contracts/api-contracts.md`**: Contratos REST para todos os 7+ endpoints
- **`quickstart.md`**: Setup completo incluindo:
  - SQL migrations
  - **Instruções detalhadas para executar script de seed do usuário root**
  - Como rodar aplicação
  - Testes manuais

**Entrega**: `data-model.md`, `contracts/`, `quickstart.md` + atualização do agent context

### Phase 2: Tarefas (via `/speckit.tasks`)

- Geração de `tasks.md` com tarefas ordenadas por dependência
- Agrupadas em 8 fases:
  - Phase 1: Setup (migrations, tipos, schemas)
  - Phase 2: API CRUD (endpoints básicos)
  - Phase 3: Validações (email único, campos obrigatórios)
  - Phase 4: Auditoria (logging de operações)
  - Phase 5: UI (componentes e páginas)
  - Phase 6: Funcionalidades avançadas (busca, paginação, filtros)
  - Phase 7: Tratamento de erros e edge cases
  - Phase 8: Polimento e documentação

## Rastreamento de Complexidade

Nenhuma violação inicial da constituição. Feature segue padrões de Feature 001.

| Aspecto | Abordagem |
|--------|----------|
| **Auditoria 100%** | Trigger PostgreSQL + application-level logging em service layer |
| **Validação email único** | Índice unique na coluna + endpoint dedicado de validação |
| **Reset de senha seguro** | Supabase Admin API ou token ephemeral |
| **Soft delete com histórico** | Campo `ativo` (boolean) + timestamp, nunca remoção física |
| **Script de seed root** | SQL com hash bcrypt, proteção via constraint unique ou via flag no app |

## Status Atual

🔄 **Phase 0: Research** — Planejado, aguardando investigação das clarificações

**Próximo**: Gerar `research.md` com respostas às 5 clarificações, especialmente o script de seed do usuário root

**Atualizado**: 2026-06-01 10:45 UTC

