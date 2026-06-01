# Plano de Implementação — Feature 001: Tela de Login e Autenticação

**Data de Criação**: 2026-05-31
**Status**: Em Desenvolvimento
**Feature**: Feature 1.1 — Tela de Login (Autenticação com E-mail e Senha)

---

## Contexto Técnico

### Pilha Tecnológica Confirmada
- **Linguagem**: TypeScript (latest)
- **Framework**: Next.js (App Router)
- **Estilização**: Tailwind CSS (latest)
- **Ícones**: lucide-react
- **Backend/Auth**: Supabase (autenticação via e-mail e senha)
- **Animações**: Framer Motion
- **Sem estado global**: Sem Redux, Zustand ou Context API
- **Design Reference**: design-system.md

### Dependências do Projeto
- TypeScript estrito (strict: true)
- Componentes funcionais apenas
- Props sempre tipadas
- Separação clara entre regras de negócio e UI

---

## Verificação de Conformidade com Constituição

✓ Idioma: Todas as respostas, comentários e documentação em pt-BR
✓ Qualidade: Sem testes automatizados (conforme constituição)
✓ Simplicidade: Código limpo, YAGNI, sem otimizações prematuras
✓ Padrões: TypeScript estrito, zero `any` implícito
✓ Mobile-First: Responsivo a partir de 320px
✓ Acessibilidade: WCAG AA mínimo
✓ Design System: Seguir design-system.md

---

## Portões de Qualidade

### Portão 1: Especificação Completa
✓ **APROVADO** — spec.md completa com 5 user stories definidas (P1 e P2)
- Story 1: Autenticação com E-mail e Senha (P1)
- Story 2: Validação de Credenciais (P1)
- Story 3: Recuperação de Senha (P2)
- Story 4: Logout (P2)
- Story 5: Layout Responsivo (P2)

### Portão 2: Tecnologia Conhecida
✓ **APROVADO** — Stack completamente definido e familiar

### Portão 3: Conformidade com Constituição
✓ **APROVADO** — Nenhuma violação identificada

---

## Fases de Implementação

### Fase 0: Pesquisa e Resolução de Incógnitas

#### Tarefas de Pesquisa
1. **Integração Supabase com Next.js App Router**
   - Melhor prática para setup de autenticação
   - Estrutura de sessão com Next.js
   - Middleware de proteção de rotas

2. **Padrões de validação com React**
   - Validação em tempo real com React Hook Form (alternativa leve a Zod)
   - Padrões de erro inline no Tailwind

3. **Design System - Componentes Base**
   - Confirmar componentes necessários do design-system.md
   - Componentes de formulário, botões, inputs

---

### Fase 1: Design e Contratos

#### 1.1 Modelo de Dados (data-model.md)

**Entidades Principais**:
- `User` — Usuário do sistema
  - `id`: UUID (PK)
  - `email`: string (unique)
  - `password_hash`: string
  - `full_name`: string
  - `profile`: enum ('admin' | 'coletor')
  - `is_active`: boolean
  - `created_at`: timestamp
  - `updated_at`: timestamp
  - `last_login`: timestamp

- `Session` — Sessão do usuário
  - `id`: string (JWT)
  - `user_id`: UUID (FK)
  - `expires_at`: timestamp
  - `created_at`: timestamp

#### 1.2 Contratos de Interface (contracts/)

**AuthAPI Contract**:
- `POST /api/auth/login` — Autenticação
- `POST /api/auth/logout` — Encerramento de sessão
- `POST /api/auth/refresh` — Renovação de sessão
- `POST /api/auth/reset-password` — Recuperação de senha
- `GET /api/auth/me` — Obter usuário autenticado

#### 1.3 Quickstart (quickstart.md)

Guia de setup rápido para desenvolvimento local com Supabase e autenticação.

---

### Fase 2: Implementação

#### Sprint 1: Autenticação Básica (P1)
1. Setup Supabase + Next.js autenticação
2. Criar componentes de formulário (email, password)
3. Implementar validação inline
4. Integrar login com Supabase
5. Criar middleware de proteção de rotas
6. Tela inicial pós-login

#### Sprint 2: UX e Recuperação (P2)
1. Implementar recuperação de senha
2. Implementar logout
3. Melhorar responsividade mobile
4. Adicionar tratamento de erros visual
5. Testes manuais (sem testes automatizados)

---

## Próximos Passos

1. ✅ Executar Fase 0 — Pesquisa (este documento)
2. ⏳ Executar Fase 1 — Design (data-model.md, contracts/, quickstart.md)
3. ⏳ Atualizar contexto do agente
4. ⏳ Gerar tasks.md com detalhamento de implementação
5. ⏳ Executar Fase 2 — Implementação
