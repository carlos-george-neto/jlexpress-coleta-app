-- Migration: Corrige policies RLS de shipments para usar JWT claims
-- Feature: 006-cadastro-encomendas
--
-- Problema: As policies de shipments consultavam public.users via EXISTS para
-- verificar role e is_active, gerando sub-queries desnecessárias e
-- inconsistência com o padrão estabelecido na migration 003.
--
-- Solução em 3 etapas:
--   1. Atualizar trigger sync_user_role_to_auth para também sincronizar
--      is_active → auth.users.raw_app_meta_data
--   2. Atualizar custom_access_token_hook para injetar user_is_active no JWT
--   3. Recriar policies de shipments e shipment_audit_log via JWT claims


-- ============================================================
-- 1. Atualizar trigger: sincronizar role E is_active → raw_app_meta_data
-- ============================================================

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
    jsonb_build_object(
      'user_role',      NEW.role,
      'user_is_active', NEW.is_active
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Recriar trigger para disparar também em mudanças de is_active
DROP TRIGGER IF EXISTS sync_user_role_trigger ON public.users;

CREATE TRIGGER sync_user_role_trigger
AFTER INSERT OR UPDATE OF role, is_active ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_to_auth();

-- Backfill: propagar is_active para usuários já existentes em raw_app_meta_data
-- Auditoria é desabilitada durante o backfill porque migrations rodam sem sessão
-- autenticada (auth.uid() = NULL) e performed_by tem constraint NOT NULL.
ALTER TABLE public.users DISABLE TRIGGER audit_users_update_trigger;
ALTER TABLE public.users DISABLE TRIGGER audit_users_delete_trigger;

UPDATE public.users SET role = role WHERE true;

ALTER TABLE public.users ENABLE TRIGGER audit_users_update_trigger;
ALTER TABLE public.users ENABLE TRIGGER audit_users_delete_trigger;


-- ============================================================
-- 2. Atualizar Custom Access Token Hook para injetar user_is_active
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims         jsonb;
  user_role      text;
  user_is_active boolean;
BEGIN
  SELECT
    raw_app_meta_data ->> 'user_role',
    (raw_app_meta_data ->> 'user_is_active')::boolean
  INTO user_role, user_is_active
  FROM auth.users
  WHERE id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{user_role}',      to_jsonb(COALESCE(user_role, 'user')));
  claims := jsonb_set(claims, '{user_is_active}', to_jsonb(COALESCE(user_is_active, true)));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;


-- ============================================================
-- 3. Drop das policies antigas (padrão EXISTS em public.users)
-- ============================================================

DROP POLICY IF EXISTS "Admin gerencia encomendas"                          ON public.shipments;
DROP POLICY IF EXISTS "Coletor lê encomendas ativas"                       ON public.shipments;
DROP POLICY IF EXISTS "Coletor atualiza encomendas ativas"                 ON public.shipments;
DROP POLICY IF EXISTS "Usuários autenticados leem auditoria de encomendas" ON public.shipment_audit_log;


-- ============================================================
-- 4. Novas policies via JWT claims (sem sub-queries em public.users)
-- ============================================================
-- auth.jwt() é resolvido do token em memória — nenhuma query adicional ao banco.

CREATE POLICY "Admin gerencia encomendas"
  ON public.shipments
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') = 'admin'
    AND (auth.jwt() ->> 'user_is_active')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'admin'
    AND (auth.jwt() ->> 'user_is_active')::boolean = true
  );

CREATE POLICY "Coletor lê encomendas ativas"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND (auth.jwt() ->> 'user_role') = 'collector'
    AND (auth.jwt() ->> 'user_is_active')::boolean = true
  );

CREATE POLICY "Coletor atualiza encomendas ativas"
  ON public.shipments
  FOR UPDATE
  TO authenticated
  USING (
    is_active = TRUE
    AND (auth.jwt() ->> 'user_role') = 'collector'
    AND (auth.jwt() ->> 'user_is_active')::boolean = true
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'collector'
    AND (auth.jwt() ->> 'user_is_active')::boolean = true
  );

CREATE POLICY "Usuários autenticados leem auditoria de encomendas"
  ON public.shipment_audit_log
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_is_active')::boolean = true
  );
