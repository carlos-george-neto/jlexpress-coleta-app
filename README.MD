# JLExpress Coleta

Sistema interno de gestão operacional de encomendas para a JLExpress. Permite que administradores cadastrem encomendas, gerenciem usuários e acompanhem atividades de coleta; e que coletores visualizem suas tarefas diárias e registrem o resultado das coletas.

## Funcionalidades

| Módulo | Admin | Coletor |
|---|---|---|
| Autenticação (login, logout, recuperação de senha) | ✅ | ✅ |
| Dashboard operacional de coletas | ✅ (painel de atividades) | ✅ (encomendas pendentes/atribuídas) |
| Gestão de encomendas (CRUD completo) | ✅ | leitura + edição parcial |
| Gestão de usuários | ✅ | — |
| Gestão de status de encomenda | ✅ | — |

## Stack

- **Framework**: [Next.js 16](https://nextjs.org/) com App Router
- **Linguagem**: TypeScript (modo strict)
- **Estilo**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend / Auth / DB**: [Supabase](https://supabase.com/) (PostgreSQL + Auth)
- **Formulários e validação**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/)

## Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Supabase](https://supabase.com/) com um projeto criado

## Instalação

```bash
# 1. Clone o repositório
git clone <url-do-repositorio>
cd jlexpress-coleta-app

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais do seu projeto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-key-aqui
```

> As chaves estão disponíveis em **Project Settings → API** no painel do Supabase.

## Banco de dados

Execute as migrações na ordem encontrada em `supabase/migrations/` pelo SQL Editor do Supabase ou via Supabase CLI:

```bash
supabase db push
```

As migrações criam as tabelas `users`, `shipments` e `shipment_status`, além das políticas de Row Level Security (RLS) baseadas em JWT.

## Rodando o projeto

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start

# Linting
npm run lint
```

O servidor de desenvolvimento sobe em `http://localhost:3000`.

## Estrutura de pastas

```
src/
├── app/
│   ├── (auth)/              # Rotas públicas: login, recuperação de senha
│   ├── (admin)/             # Rotas exclusivas do admin: usuários, status
│   ├── (protected)/         # Rotas autenticadas: dashboard, encomendas
│   └── api/                 # API Routes do Next.js
├── components/
│   ├── auth/                # Formulários de autenticação
│   ├── dashboard/           # Painéis do coletor e do admin
│   ├── shipments/           # Listagem, formulário e log de auditoria de encomendas
│   ├── admin/               # Formulários e listagens de usuários e status
│   ├── layout/              # Header e navegação principal
│   └── ui/                  # Componentes reutilizáveis (Button, Input, Card, etc.)
├── lib/
│   ├── api/                 # Funções de acesso a dados e helpers de autenticação
│   ├── supabase/            # Clientes Supabase (browser e admin)
│   └── types/               # Interfaces e tipos TypeScript do domínio
└── middleware.ts             # Proteção de rotas via sessão Supabase
```

## Perfis de acesso

### Admin
Acesso completo ao sistema. Pode criar e editar usuários, definir status de encomenda (nome e cor indicativa), cadastrar e alterar qualquer campo de qualquer encomenda e visualizar o painel de atividades dos coletores.

### Coletor
Acesso restrito. No dashboard, vê todas as encomendas com status "Pendente de Coleta" e aquelas em que está designado como responsável. Na tela de edição, apenas os campos **Status**, **Observações** e **Quantidade coletada** estão disponíveis; os demais ficam somente leitura.

## Rotas da aplicação

| Rota | Acesso | Descrição |
|---|---|---|
| `/login` | Público | Tela de autenticação |
| `/forgot-password` | Público | Solicitação de redefinição de senha |
| `/reset-password` | Público | Criação de nova senha via link do e-mail |
| `/dashboard` | Autenticado | Dashboard (visão varia por perfil) |
| `/encomendas` | Autenticado | Listagem, busca e filtros de encomendas |
| `/encomendas/nova` | Admin | Cadastro de nova encomenda |
| `/encomendas/[id]` | Autenticado | Visualização e edição de encomenda |
| `/users` | Admin | Gestão de usuários |
| `/users/new` | Admin | Cadastro de novo usuário |
| `/users/[userId]` | Admin | Edição de usuário |
| `/shipment-status` | Admin | Gestão de status de encomenda |
| `/shipment-status/new` | Admin | Criação de novo status |
| `/shipment-status/[statusId]` | Admin | Edição de status |

## Convenções do projeto

- **Idioma**: toda documentação, comentários, commits e PRs em **português brasileiro**; apenas sintaxe de código em inglês
- **TypeScript strict**: nenhum `any` implícito; props sempre tipadas com interfaces
- **Componentes**: funcionais apenas; sem lógica de negócio em componentes de UI
- **Mobile-first**: largura mínima suportada de 320px
- **Acessibilidade**: WCAG AA — `aria-label` em links/botões, `alt` em imagens, contraste adequado
- **Dependências**: zero adições além da stack declarada acima
- **Testes**: não há testes automatizados (diretiva de projeto)

## Licença

Uso interno — JLExpress. Todos os direitos reservados.
