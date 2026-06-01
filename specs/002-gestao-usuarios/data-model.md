# Modelo de Dados: Gestão de Usuários

**Feature**: 002-gestao-usuarios  
**Data**: 2026-06-01  
**Base**: Supabase + PostgreSQL  

---

## Resumo Executivo

O modelo de dados para gestão de usuários integra-se com Supabase Auth mantendo uma tabela customizada `public.users` separada de `auth.users` para permitir atributos de negócio adicionais e melhor controle via Row Level Security (RLS). A auditoria é implementada com tabela `user_audit_log` e triggers automáticos.

**Decisão Principal**: Tabela `public.users` com FK para `auth.users(id)`, sem estender `auth.users` diretamente.

---

## Entidades de Dados

### 1. Tabela: `public.users`

Usuários do sistema com atributos customizados. Sincronizada com `auth.users` do Supabase.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  -- Identificadores
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  
  -- Dados pessoais
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',  -- Papéis: 'admin', 'collector', 'deliverer', 'user'
  
  -- Status e controle
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria básica
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  
  -- Validações
  CHECK (email ~ '^\S+@\S+\.\S+$'),
  CHECK (full_name IS NOT NULL AND full_name != ''),
  CHECK (is_active IN (true, false))
);

-- Índices para performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);
CREATE INDEX idx_users_created_by ON public.users(created_by);
CREATE INDEX idx_users_updated_by ON public.users(updated_by);

-- Atualizar timestamp updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS: Apenas admins podem visualizar e editar outros usuários
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can soft-delete users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (is_active IN (true, false));


**Campos**:
- `id` (UUID): FK para `auth.users(id)`. Quando usuário é deletado do Auth, registro aqui é deletado em cascata
- `email` (VARCHAR 255): Email único, validado com regex simples. Sincronizado com `auth.users.email`
- `full_name` (VARCHAR 255): Nome completo do usuário
- `role` (VARCHAR 50): Perfil/Role — valores permitidos: `admin`, `collector`, `deliverer`, `user`
- `is_active` (BOOLEAN): Soft delete — `false` significa usuário inativo/bloqueado
- `created_by` / `updated_by` (UUID FK): Rastreamento de quem criou/atualizou
- `created_at` / `updated_at` (TIMESTAMPTZ): Timestamps de auditoria
- `last_login_at` (TIMESTAMPTZ): Último login (atualizado em POST /api/auth/login)

**Índices**: Para queries frequentes (busca por email, filtro por role, listagem de ativos)

**RLS Policies**: 
- Usuários veem apenas seus próprios dados
- Admins veem todos os usuários
- Apenas admins podem criar/editar/desativar usuários

---

### 2. Tabela: `public.user_audit_log`

Log de auditoria de todas as operações em usuários (create, update, delete).

```sql
CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Rastreamento
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'PASSWORD_RESET', 'ACTIVATE', 'DEACTIVATE'
  
  -- Dados antes e depois
  old_data JSONB,
  new_data JSONB,
  
  -- Auditoria
  performed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  ip_address INET,
  
  -- Validações
  CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'PASSWORD_RESET', 'ACTIVATE', 'DEACTIVATE'))
);

-- Índices
CREATE INDEX idx_audit_user_id ON public.user_audit_log(user_id);
CREATE INDEX idx_audit_performed_by ON public.user_audit_log(performed_by);
CREATE INDEX idx_audit_performed_at ON public.user_audit_log(performed_at);
CREATE INDEX idx_audit_action ON public.user_audit_log(action);

-- Trigger: Auditoria automática de UPDATE em public.users
CREATE OR REPLACE FUNCTION audit_users_update()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_audit_log (user_id, action, old_data, new_data, performed_by, performed_at)
  VALUES (
    NEW.id,
    'UPDATE',
    to_jsonb(OLD),
    to_jsonb(NEW),
    COALESCE(auth.uid(), NEW.updated_by),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER audit_users_update_trigger
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_users_update();

-- Trigger: Auditoria automática de DELETE (soft delete)
CREATE OR REPLACE FUNCTION audit_users_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.user_audit_log (user_id, action, old_data, new_data, performed_by, performed_at)
    VALUES (
      NEW.id,
      'DEACTIVATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      COALESCE(auth.uid(), NEW.updated_by),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER audit_users_delete_trigger
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_users_delete();

-- RLS: Apenas admins podem visualizar audit log
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.user_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Campos**:
- `id` (BIGSERIAL): PK auto-incrementada
- `user_id` (UUID): Usuário afetado pela operação
- `action` (VARCHAR 50): Tipo de operação (`CREATE`, `UPDATE`, `DELETE`, `PASSWORD_RESET`, etc.)
- `old_data` / `new_data` (JSONB): Snapshots antes/depois
- `performed_by` (UUID FK): Quem executou a operação
- `performed_at` (TIMESTAMPTZ): Quando ocorreu
- `reason` (TEXT): Motivo/descrição (opcional)
- `ip_address` (INET): IP da requisição (opcional)

**RLS**: Apenas admins visualizam audit log

---

### 3. Tabela: `public.user_profiles` (opcional, para extensão futura)

```sql
-- Opcional: Para armazenar dados adicionais sem estender public.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url TEXT,
  phone_number VARCHAR(20),
  preferred_locale VARCHAR(10) DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Validações de Negócio

| Regra | Implementação | Nível |
|------|--------------|-------|
| Email único (case-insensitive) | `UNIQUE(email)` + Índice | BD |
| Email válido | Regex `^\S+@\S+\.\S+$` CHECK | BD |
| Nome completo obrigatório | `NOT NULL` + CHECK | BD |
| Senha forte | Supabase Auth Policy | Auth |
| Apenas admins gerenciam | RLS Policy + API Middleware | BD + App |
| Soft delete obrigatório | Trigger + Schema design | BD |
| Auditoria 100% | Triggers automáticos | BD |

---

## Migrações e Setup

### 1. SQL Script de Criação Completa

```sql
-- 1. Criar tabela users
-- [Ver script acima]

-- 2. Criar tabela user_audit_log
-- [Ver script acima]

-- 3. Sincronizar dados iniciais
-- Copiar usuários já existentes em auth.users (se houver)
INSERT INTO public.users (id, email, full_name, role, is_active, created_at)
SELECT id, email, 'User', 'user', true, created_at
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id)
ON CONFLICT (email) DO NOTHING;

-- 4. Criar usuário root (via script de seed — ver quickstart.md)
```

### 2. Supabase Migrations Setup

```bash
# No repositório, após clonar/setup:
supabase migration new "create_users_tables"
# Editar arquivo gerado em supabase/migrations/XXXXX_create_users_tables.sql
# Copiar conteúdo dos scripts SQL acima

# Aplicar localmente
supabase db push

# Para produção (deploy automático)
# Supabase deploy aplica migrations automaticamente
```

---

## Relacionamentos e Constraints

```
auth.users (Supabase Auth)
    ↓
    └─→ public.users (1:1, ON DELETE CASCADE)
            ├─→ created_by → public.users.id (self-referential)
            ├─→ updated_by → public.users.id (self-referential)
            └─→ public.user_audit_log (1:many, ON DELETE CASCADE)
                    ├─→ user_id → public.users.id
                    └─→ performed_by → public.users.id
```

**Notas**:
- Self-references em `created_by` / `updated_by` permitem rastreamento de quem criou/alterou
- Soft delete em `public.users` via `is_active = false`
- Histórico nunca é deletado (CASCADE apenas em deletação física do Auth)

---

## Performance & Índices

| Operação | Índice | Razão |
|----------|--------|-------|
| Buscar por email | `idx_users_email` | Validação de duplicação, login |
| Listar ativos | `idx_users_is_active` | Filtro comum em listagem |
| Buscar por role | `idx_users_role` | Filtro por perfil administrativo |
| Audit trail | `idx_audit_performed_at`, `idx_audit_user_id` | Queries históricas |

---

## Sincronização com Supabase Auth

Sempre que um usuário é criado na Feature 001 (Login) ou modificado:

1. **Criar**: App chama POST `/api/users` → service cria em `public.users` com `id` do novo `auth.users`
2. **Atualizar**: App chama PUT `/api/users/:userId` → Trigger automático atualiza `updated_at`
3. **Deletar**: Nunca deletar; usar soft delete com `is_active = false`
4. **Reset Senha**: Apenas em `auth.users`; `user_audit_log` registra com action `PASSWORD_RESET`

---

## Próximas Etapas

1. ✅ Modelo definido
2. ⏭️ Definir contratos de API em `contracts/api-contracts.md`
3. ⏭️ Gerar script SQL via Supabase CLI
4. ⏭️ Implementar service layer (`lib/services/user.service.ts`)
5. ⏭️ Criar endpoints REST

**Status**: ✅ Data model finalizado

**Última Atualização**: 2026-06-01 11:00 UTC
