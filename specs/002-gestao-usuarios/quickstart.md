# Guia de Início Rápido: Gestão de Usuários

**Feature**: 002-gestao-usuarios  
**Data**: 2026-06-01  
**Público**: Desenvolvedores e DevOps  

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Setup do Banco de Dados](#setup-do-banco-de-dados)
4. [🔴 Script de Inserção do Usuário Root](#-script-de-inserção-do-usuário-root)
5. [Rodar a Aplicação](#rodar-a-aplicação)
6. [Testes Manuais](#testes-manuais)
7. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Feature 002 adiciona capacidade de gerenciar usuários do sistema:
- Criar, editar, listar usuários
- Reset de senha
- Soft delete (desativação)
- Auditoria completa

**Dependências**: Feature 001 (Login) deve estar funcional.

---

## Pré-requisitos

- ✅ Node.js 18+ instalado (`node -v`)
- ✅ Projeto clonado e `npm install` executado
- ✅ `.env.local` configurado com credenciais Supabase:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
  SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
  ```
- ✅ Acesso ao [Dashboard do Supabase](https://supabase.com) (navegador)
- ✅ **Sem necessidade de Supabase CLI** — Tudo será executado via Dashboard

---

## Setup do Banco de Dados

### Passo 1: Criar Tabelas via Dashboard Supabase

Você executará os scripts SQL diretamente no Dashboard, sem usar CLI.

**Procedimento**:

1. Ir para [supabase.com](https://supabase.com) e fazer login
2. Entrar no seu projeto
3. Ir em **SQL Editor** (menu esquerdo)
4. Clicar em **New Query** (botão superior direito)
5. **Copiar TODO o script SQL abaixo** (continua neste guia)
6. **Colar** na janela de query do Dashboard
7. Clicar **Run** (ou `Ctrl+Enter`)
8. Verificar se aparece "Successfully executed" (sem erros)

**SQL Script Completo** (copiar e colar no Dashboard):

Copie todo o conteúdo da seção **"Entidades de Dados"** em [data-model.md](data-model.md). Ele contém:
- Criação de tabela `public.users`
- Criação de tabela `public.user_audit_log`
- Índices
- RLS Policies
- Triggers automáticos

⚠️ **Importante**: O script é longo (~200+ linhas). Você pode copiar em partes se preferir:

1. **Primeira parte**: Tabela `users` + índices + trigger para `updated_at`
2. **Segunda parte**: Tabela `user_audit_log` + índices
3. **Terceira parte**: RLS policies (CREATE POLICY ...)

Ou copie tudo de uma vez — o Supabase executa a transação completa.

### Passo 2: Verificar Schema no Dashboard

1. No Dashboard, ir em **Table Editor** (menu esquerdo)
2. Você deve ver duas tabelas novas:
   - `users` (com campos: id, email, full_name, role, is_active, etc.)
   - `user_audit_log` (com campos: id, user_id, action, old_data, etc.)
3. Clicar em cada tabela e verificar campos e índices
4. **RLS verificação**: Clicar em tabela `users` → aba **RLS** (debe estar "Enabled")

---

## 🔴 Script de Inserção do Usuário Root

### Por que é necessário?

O usuário root é o **primeiro administrador** que pode usar a aplicação. Sem ele, nenhum admin existe e a UI de gestão de usuários não pode ser acessada (RBAC bloquearia).

**Importante**: Este script é executado **uma única vez** durante o setup inicial.

### 📋 Resumo dos 5 Passos (Tudo via Dashboard, Zero CLI)

| Passo | O que fazer | Onde |
|-------|-----------|-------|
| 1 | Criar usuário root em auth.users | Dashboard → Authentication → Users |
| 2 | Anotar UUID gerado | Dashboard (copiar UUID) |
| 3 | Executar script SQL em public.users | Dashboard → SQL Editor (substituir UUID no script) |
| 4 | Verificar inserção | Dashboard → Table Editor ou SQL Query |
| 5 | Teste de login | http://localhost:3000/login |

---

## Procedimento Completo (5 Passos)

### ✅ Passo 1: Criar Usuário Root em `auth.users` (Dashboard)

1. No Dashboard Supabase, ir em **Authentication** (menu esquerdo)
2. Clicar em **Users** (submenu)
3. Clicar botão **Add User** (superior direito)
4. Preencher formulário:
   - **Email**: `root@jlexpress.local` (ou seu email preferido)
   - **Password**: Digite uma senha forte como `Root@123456!`
   - Clicar **Save**
5. **ANOTAR o UUID** exibido (exemplo: `550e8400-e29b-41d4-a716-446655440000`)
   - Este UUID será usado no Passo 2

**Resultado esperado**: Usuário criado em `auth.users` do Supabase

---

### ✅ Passo 2: Executar Script SQL para Inserir em `public.users` (Dashboard)

Agora você vai criar o registro correspondente em `public.users`.

**Procedimento**:

1. No Dashboard, ir em **SQL Editor** → **New Query**
2. **Copiar e colar este script SQL**:

```sql
-- ===============================================
-- Script de Seed: Inserir Usuário Root
-- Executar UMA VEZ após criar user em auth.users
-- ===============================================

INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at,
  last_login_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- ← SUBSTITUIR pelo UUID do Passo 1
  'root@jlexpress.local',
  'Administrador Root',
  'admin',
  true,
  NOW(),
  NOW(),
  NULL
) ON CONFLICT (email) DO NOTHING;

-- Confirmar inserção
SELECT id, email, full_name, role, is_active FROM public.users 
WHERE email = 'root@jlexpress.local';
```

3. **IMPORTANTE**: Substituir `'550e8400-e29b-41d4-a716-446655440000'` pelo UUID anotado no Passo 1
4. Clicar **Run** (ou `Ctrl+Enter`)
5. Verificar resultado: Deve aparecer 1 linha com dados do root

**Proteção contra re-execução**:
- O script usa `ON CONFLICT (email) DO NOTHING`
- ✅ Primeira execução: Insere o root
- ⚠️ Segunda execução: Ignora silenciosamente (não causa erro)
- ✅ Seguro para rodar em CI/CD (idempotente)

---

### ✅ Passo 3: Verificar Inserção (Opcional)

No Dashboard, ir em **Table Editor** → selecionar tabela `users`:

1. Procurar pela linha com email `root@jlexpress.local`
2. Verificar se:
   - `role` = `admin`
   - `is_active` = `true`
   - `id` = UUID do Passo 1

---

### ✅ Passo 4: Salvar Credenciais com Segurança

Guardar com segurança (não fazer commit):

```
Email: root@jlexpress.local
Senha: (a senha que você usou no Passo 1)
UUID: 550e8400-e29b-41d4-a716-446655440000
```

**Sugestão**: Usar um gerenciador de senhas (LastPass, 1Password, etc.)

---

### ✅ Passo 5: Teste de Login

1. Ir para http://localhost:3000/login
2. Email: `root@jlexpress.local`
3. Senha: (aquela do Passo 1)
4. Esperado: Login bem-sucedido → dashboard

Se falhar, ver seção **Troubleshooting** abaixo.

---

## Alternativa (Se Executou Errado)

Se precisa deletar e recriar o root:

**No Dashboard SQL Editor**:

```sql
-- DELETAR (apenas em desenvolvimento)
DELETE FROM public.users WHERE email = 'root@jlexpress.local';

-- Depois: Voltar ao Passo 1 e recriar
```

---

## Rodar a Aplicação

### Desenvolvimento Local

```bash
# 1. Instalar dependências (se não feito)
npm install

# 2. Configurar variáveis de ambiente
# Copiar .env.example → .env.local e preencher com credenciais Supabase

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Abrir navegador
# http://localhost:3000

# 5. Fazer login com credenciais de qualquer usuário
# Após Feature 001, usar credenciais criadas na autenticação
```

### Produção

```bash
# 1. Build
npm run build

# 2. Verificar compilação
# Deve terminar sem erros

# 3. Iniciar
npm start

# Ou usar Docker/Vercel para deploy
```

---

## Testes Manuais

### Test 1: Login com Usuário Root

```
1. Ir para http://localhost:3000/login
2. Email: root@jlexpress.local
3. Senha: (a senha que você usou no Passo 2 acima)
4. Esperado: Login bem-sucedido → dashboard
5. Verificar se nome "Administrador Root" aparece na UI
```

### Test 2: Acessar Gestão de Usuários

```
1. Fazer login com root
2. Clicar em "Usuários" (menu administrativo, deve aparecer para admin)
3. Esperado: Página de listagem de usuários carrega
4. Ver root listado como administrador
```

### Test 3: Criar Novo Usuário

```
1. Em "Usuários", clicar "Novo Usuário"
2. Preencher:
   - Email: collector1@jlexpress.local
   - Nome: João Coletor
   - Perfil: Collector
   - Senha: Collector123!@
3. Clicar "Criar"
4. Esperado: Usuário inserido, aparece na listagem
5. No banco, verificar:
   - Novo registro em public.users
   - Entrada em user_audit_log com action CREATE
```

### Test 4: Validação de Email Duplicado

```
1. Tentar criar usuário com email que já existe
2. Esperado: Erro "Email já cadastrado"
3. Não deve permitir duplicação
```

### Test 5: Reset de Senha

```
1. Listar usuários
2. Clicar "Reset Senha" em um usuário
3. Esperado:
   - Mensagem "Link enviado por e-mail"
   - Entrada em user_audit_log com action PASSWORD_RESET
   - (Se configurado) Receberá e-mail com link
```

### Test 6: Visualizar Auditoria

```
1. Clicar em usuário → "Histórico"
2. Esperado: Mostrar lista de operações (CREATE, UPDATE, PASSWORD_RESET)
3. Cada entrada deve ter:
   - Tipo de ação
   - Quem fez
   - Quando
   - Dados antigos vs novos (para UPDATE)
```

### Test 7: Desativar Usuário

```
1. Listar usuários → Clicar em usuário
2. Clicar "Desativar"
3. Esperado:
   - Campo is_active → false
   - Usuário não consegue fazer login
   - Dados persistem no banco
   - Auditoria registra ação
```

---

## Troubleshooting

### ❌ Erro: "Email já cadastrado" após limpar banco

**Causa**: Remanescente em `auth.users` (Supabase Auth)

**Solução**:
1. No Dashboard, ir em **Authentication** → **Users**
2. Procurar o usuário com o email (ex: `root@jlexpress.local`)
3. Clicar no menu (⋮) → **Delete user**
4. Confirmar
5. Depois: Voltar ao Passo 1 e recriar o usuário root

### ❌ Erro: "RLS policy violates insert"

**Causa**: Policies de RLS estão bloqueando inserção

**Solução** (via Dashboard SQL Editor):
```sql
-- Verificar policies ativas
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Se necessário, desativar RLS temporariamente (apenas desenvolvimento)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Inserir dados / Re-executar script

-- Reativar depois
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### ❌ Erro: "auth.users.id does not exist"

**Causa**: Usuário não existe em `auth.users` quando tentando inserir em `public.users`

**Solução**:
1. **Verificar**: Dashboard → **Authentication** → **Users**
2. Confirmar que o usuário foi criado (deve ter UUID)
3. Se não existe: Voltar ao **Passo 1** (criar usuário em auth.users)
4. Se existe: Copiar UUID correto e usar no Passo 2

### ❌ Erro: "Conflito ao inserir tabelas (script não executou)"

**Causa**: SQL tem erro de sintaxe ou tabelas já existem

**Solução**:
1. Dashboard → **SQL Editor** → **New Query**
2. Executar:
   ```sql
   -- Verificar se tabelas já existem
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'user_audit_log');
   ```
3. Se retornar resultados: Tabelas já existem (não executar script novamente)
4. Se vazio: Erro no script — copiar novamente de data-model.md

### ❌ Usuário root não consegue fazer login

**Checklist**:
- [ ] Usuário existe em `auth.users` (verificar no Dashboard)
- [ ] Usuário existe em `public.users` (verificar com SELECT)
- [ ] Email e senha estão corretos
- [ ] Usuário não está desativado (`is_active = true`)
- [ ] RLS policies permitem o login (checar middleware)

**Debug**:
```sql
SELECT * FROM public.users WHERE email = 'root@jlexpress.local';
-- Verificar se id, role, is_active estão corretos

-- Verificar último erro em logs
SELECT * FROM public.user_audit_log 
WHERE user_id = 'UUID_DO_ROOT' 
ORDER BY performed_at DESC;
```

---

## Próximas Etapas

✅ **Pronto para implementar!**

Após completar todos os passos acima:

1. ✅ Banco de dados configurado (tabelas `users` e `user_audit_log` criadas)
2. ✅ Usuário root criado e testado
3. ⏭️ Executar `/speckit.tasks` para gerar tarefas de implementação
4. ⏭️ Começar implementação (criar endpoints, componentes UI, páginas)

**Comando para próxima fase**:
```
/speckit.tasks
```

---

## Recursos Adicionais

- **Feature Spec**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/api-contracts.md](contracts/api-contracts.md)
- **Supabase Docs**: https://supabase.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app

---

**Status**: ✅ Quickstart finalizado

**Última Atualização**: 2026-06-01 11:30 UTC

**Avisos Críticos**:
- 🔴 Script de seed root deve ser executado UMA VEZ
- 🔴 Guardar credenciais de root com segurança
- 🔴 Não fazer commit de senhas em código
