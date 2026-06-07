-- Migration: Corrige recursão infinita nas RLS policies via JWT custom claims
-- Feature: 002-gestao-usuarios
--
-- Problema: As policies de admin consultavam public.users para verificar
-- role = 'admin', o que disparava as próprias policies novamente (recursão infinita).
--
-- Solução em 3 etapas:
--   1. Trigger SECURITY DEFINER sincroniza public.users.role → auth.users.raw_app_meta_data
--   2. Custom Access Token Hook injeta user_role no JWT via raw_app_meta_data
--   3. Policies usam (auth.jwt() ->> 'user_role') = 'admin' — sem consultar a tabela
--
-- AÇÃO NECESSÁRIA APÓS APLICAR: Registrar o hook no Supabase
--   Dashboard: Authentication > Hooks > Custom Access Token Hook
--     URI: pg-functions://postgres/public/custom_access_token_hook
--   Local (supabase/config.toml):
--     [auth.hook.custom_access_token]
--     enabled = true
--     uri = "pg-functions://postgres/public/custom_access_token_hook"


-- ============================================================
-- 1. Trigger: Sincronizar role → auth.users.raw_app_meta_data
-- ============================================================
-- Executado com SECURITY DEFINER para poder escrever em auth.users sem RLS.
-- Disparado em INSERT e UPDATE de role para manter sincronia.

CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('user_role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE OF role ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_auth();

-- Backfill: sincronizar usuários já existentes
-- Auditoria é desabilitada durante o backfill porque migrations rodam sem sessão
-- autenticada (auth.uid() = NULL) e performed_by tem constraint NOT NULL.
ALTER TABLE public.users DISABLE TRIGGER audit_users_update_trigger;
ALTER TABLE public.users DISABLE TRIGGER audit_users_delete_trigger;

UPDATE public.users SET role = role WHERE true;

ALTER TABLE public.users ENABLE TRIGGER audit_users_update_trigger;
ALTER TABLE public.users ENABLE TRIGGER audit_users_delete_trigger;


-- ============================================================
-- 2. Custom Access Token Hook
-- ============================================================
-- Supabase Auth chama esta função ao gerar JWTs.
-- Lê user_role de raw_app_meta_data e o injeta nos claims do token.
-- SECURITY DEFINER: lê auth.users sem restrição de RLS.
-- Somente supabase_auth_admin pode executar — usuários não têm acesso.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims    jsonb;
  user_role text;
BEGIN
  SELECT raw_app_meta_data ->> 'user_role'
    INTO user_role
    FROM auth.users
   WHERE id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(COALESCE(user_role, 'user'))
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT USAGE  ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;


-- ============================================================
-- 3. Drop das policies recursivas
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all users"      ON public.users;
DROP POLICY IF EXISTS "Admins can create users"        ON public.users;
DROP POLICY IF EXISTS "Admins can update users"        ON public.users;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.user_audit_log;


-- ============================================================
-- 4. Novas policies sem recursão (via JWT claim)
-- ============================================================
-- auth.jwt() é resolvido diretamente do token em memória —
-- não faz nenhuma consulta adicional ao banco.

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

CREATE POLICY "Admins can view all audit logs" ON public.user_audit_log
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
