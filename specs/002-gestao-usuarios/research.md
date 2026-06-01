# Pesquisa Técnica: Gestão de Usuários com Supabase + Next.js + TypeScript

**Data**: 2026-06-01  
**Contexto**: Feature 002 - Gestão de Usuários  
**Stack**: Next.js 15 + TypeScript + Supabase + PostgreSQL  

---

## 1. Supabase Admin API para Reset de Senha

### Decisão Recomendada
Usar `admin.auth.adminResetUserPassword()` com token de reset enviado por e-mail, em vez de gerar senha temporária no backend.

### Justificativa Técnica
- **Segurança**: Supabase controla link de reset com TTL configurável (padrão 1 hora)
- **Conformidade**: Padrão OAuth 2.0 + OIDC (melhor prática OWASP)
- **User Experience**: Usuário recebe link na caixa de entrada familiar (não tem que copiar senha)
- **Auditoria**: Supabase registra todas as tentativas de reset automaticamente

### Exemplo de Código

```typescript
// Server Action ou API Route (/api/auth/admin/reset-password)
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key apenas no servidor
);

export async function adminResetUserPassword(userId: string, email: string) {
  try {
    // Opção 1: Trigger reset flow (enviar link por e-mail)
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      },
    });

    if (error) throw error;

    return { success: true, message: "Link de reset enviado para o e-mail" };
  } catch (error) {
    console.error("Erro ao resetar senha:", error);
    throw error;
  }
}

// Resposta esperada: 200 OK
// Supabase envia e-mail com link contendo token de reset
// Link válido por 1 hora por padrão
```

### Alternativas Consideradas

| Alternativa | Por que não foi escolhida |
|------------|---------------------------|
| **Gerar senha temporária** | Menos seguro; requer comunicação 2ª via (SMS); carga de UX no usuário |
| **adminResetUserPassword() direto** | Não há envio de e-mail automático; requer implementação manual do template |
| **usar `rpc()` do PostgreSQL** | Possível mas reinventa a roda; Supabase Auth já tem tudo pronto |

---

## 2. Integração com Supabase Auth: Extensão vs. Tabela Separada

### Decisão Recomendada
Usar **tabela `public.users` separada com FK para `auth.users`** (não estender `auth.users` diretamente).

### Justificativa Técnica

**Por que tabela separada é melhor:**
- `auth.users` é gerenciado exclusivamente por Supabase Auth (riscos de sincronização)
- `public.users` permite atributos customizados: `role`, `department`, `is_active`, `created_at`
- Row Level Security (RLS) funciona melhor com tabela em `public`
- Migrações customizadas não conflitam com atualizações do Supabase

**Schema recomendado:**

```sql
-- Tabela de usuários customizada
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'user', 'viewer'
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- Trigger para manter sincronização
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET email = NEW.email, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_email
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();
```

### Comparação: Extensão vs. Tabela Separada

| Aspecto | Estender auth.users | Tabela Separada |
|--------|-------------------|-----------------|
| **Segurança** | ⚠️ Risco de sincronização | ✅ Isolado, controlado |
| **RLS** | Difícil de configurar | ✅ Nativo, fácil |
| **Atributos customizados** | Limitado | ✅ Flexível |
| **Migrações** | Conflita com updates Supabase | ✅ Independente |
| **Conformidade** | Quebra padrões Auth | ✅ Padrão OIDC |

---

## 3. Estratégias de Seed de Banco de Dados

### Decisão Recomendada
Usar **combinação: (a) SQL Migration + (c) Node.js Seed Script** para ambiente de desenvolvimento.

### Justificativa Técnica
- **Production**: SQL migration garante dados iniciais consistentes
- **Development**: Node.js seed script oferece flexibilidade e re-executabilidade
- **Supabase CLI**: Funciona bem para seeds de desenvolvimento, não para produção

### Exemplo de Código

**1. SQL Migration (produção - criado uma vez)**

```sql
-- migrations/20260601000000_initial_root_user.sql
BEGIN;

-- 1. Criar usuário root em auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'root@jlexpress.local',
  crypt('AdminRoot123!', gen_salt('bf')), -- Usar bcrypt
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Criar registro em public.users
INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'root@jlexpress.local',
  'Administrador Root',
  'admin',
  true
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
```

**2. Node.js Seed Script (desenvolvimento)**

```typescript
// scripts/seed-dev.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedUsers() {
  const users = [
    {
      email: "admin@dev.local",
      password: "DevAdmin123!",
      full_name: "Admin Dev",
      role: "admin",
    },
    {
      email: "user@dev.local",
      password: "DevUser123!",
      full_name: "User Dev",
      role: "user",
    },
  ];

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (error) {
      console.error(`Erro ao criar ${user.email}:`, error);
      continue;
    }

    await supabase.from("users").insert({
      id: data.user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: true,
    });

    console.log(`✓ ${user.email} criado com sucesso`);
  }
}

seedUsers().catch(console.error);
```

### Comparação de Estratégias

| Estratégia | Melhor Para | Limitações |
|-----------|-----------|-----------|
| **SQL Script** | Produção, dados imutáveis | Pouca flexibilidade, sem validação |
| **Supabase CLI** | Prototipagem rápida | Não replicável em produção |
| **Node.js Script** | Desenvolvimento iterativo | Requer dependências, lógica adicional |
| **Migration** | Versionamento, rollback | Não é idempotente por padrão |

---

## 4. Geração Segura de Senha Temporária

### Decisão Recomendada
Usar **`crypto.randomBytes()` + `Buffer.toString('base64')` para tokens de reset** (não gerar senhas visíveis).

### Justificativa Técnica
- Tokens opacos são mais seguros que senhas visíveis
- `crypto.randomBytes()` usa entropia do SO (criptograficamente seguro)
- Base64 reduz tamanho sem perder segurança (255 bits mínimo)
- Supabase Admin API já gerencia TTL e invalidação

### Exemplo de Código

```typescript
// lib/security/token-generator.ts
import crypto from "crypto";

/**
 * Gera token de reset opaco (não uma senha visível)
 * Recomendação: usar junto com Supabase Admin API
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * ALTERNATIVA (menos recomendada): Gerar senha temporária visível
 * Usar APENAS se não integrar com Supabase Auth
 */
export function generateTemporaryPassword(length: number = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

/**
 * Hash de token para armazenar seguro em DB
 * Usar com: UPDATE reset_tokens SET token_hash = hash(token)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Exemplo de uso
const resetToken = generateSecureToken(32);
const tokenHash = hashToken(resetToken);
// Armazenar apenas tokenHash em DB
// Enviar resetToken por e-mail (válido 1 vez)
```

### Comparação de Métodos

| Método | Segurança | Praticidade | Recomendado |
|--------|----------|-----------|-----------|
| **crypto.randomBytes()** | ⭐⭐⭐⭐⭐ | Média | ✅ Sim |
| **generate-password lib** | ⭐⭐⭐ | Alta | ❌ Para tokens, não |
| **uuid v4** | ⭐⭐⭐⭐ | Alta | ⚠️ Se não usar Supabase Auth |
| **Math.random()** | ⭐ | Altíssima | ❌ Nunca |

---

## 5. Padrões de Auditoria em Supabase + Next.js

### Decisão Recomendada
Usar **PostgreSQL Triggers + Application-Level Logging** (abordagem híbrida).

### Justificativa Técnica

**Por que Triggers + App Logging:**
- **Triggers**: Capturam mudanças no nível BD (nenhuma pode escapar)
- **App Logging**: Fornece contexto de negócio (quem/quando/por quê)
- **Combinação**: Cobertura 100% com flexibilidade e performance
- **Conformidade**: Atende LGPD + regulamentações de auditoria

### Exemplo de Código

**1. PostgreSQL Audit Trigger**

```sql
-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  operation VARCHAR(10), -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET
);

-- Trigger automático em users
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    old_values,
    new_values,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_users
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_user_changes();
```

**2. Application-Level Logging (Next.js)**

```typescript
// lib/audit/logger.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logUserAudit(
  userId: string,
  action: string,
  resource: string,
  details: Record<string, any>,
  ipAddress?: string
) {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action, // "USER_CREATED", "PASSWORD_RESET", etc
      resource, // "users", "permissions", etc
      details: JSON.stringify(details),
      ip_address: ipAddress,
      created_at: new Date(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
    // Não falhar a operação principal por causa de log
  }
}

// Uso em API route
export async function POST(request: Request) {
  const user = await getCurrentUser();
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  try {
    // ... lógica de criar/atualizar usuário ...

    await logUserAudit(user.id, "USER_UPDATED", "users", {
      userId: targetUserId,
      changedFields: ["role", "is_active"],
      newValues: { role: "admin", is_active: true },
    }, ip);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### Comparação de Abordagens

| Abordagem | Cobertura | Flexibilidade | Custo |
|----------|-----------|---------------|-------|
| **Triggers BD only** | ⭐⭐⭐⭐⭐ | Baixa | Baixo |
| **App Logging only** | ⭐⭐⭐ | Alta | Médio |
| **Triggers + App** | ⭐⭐⭐⭐⭐ | Alta | Médio |
| **SaaS Audit** | ⭐⭐⭐⭐⭐ | Nenhuma | Alto |

**Conclusão**: Padrão híbrido (Triggers + App) oferece melhor equilíbrio: captura automática + flexibilidade de negócio.

---

## Resumo Executivo

| # | Questão | Decisão | Justificativa-Chave |
|---|---------|---------|-------------------|
| 1 | Reset Senha | `admin.auth.generateLink()` | Segurança OWASP, UX melhor, TTL automático |
| 2 | Auth Integration | Tabela Separada + FK | RLS nativo, sem conflitos migrações, isolado |
| 3 | Database Seed | Migration + Node.js Script | Produção consistente, desenvolvimento flexível |
| 4 | Senha Temporária | Tokens com `crypto.randomBytes()` | Criptograficamente seguro, flexível, padrão |
| 5 | Auditoria | Triggers + App Logging | 100% cobertura, auditável, conformidade LGPD |

---

## Referências Recomendadas

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/admin-api)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [LGPD Compliance Checklist](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
