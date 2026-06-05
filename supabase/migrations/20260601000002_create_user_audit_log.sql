-- Migration: Criação da tabela public.user_audit_log
-- Feature: 002-gestao-usuarios

CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id BIGSERIAL PRIMARY KEY,

  -- Rastreamento
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_performed_by ON public.user_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_performed_at ON public.user_audit_log(performed_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.user_audit_log(action);

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
    COALESCE(NEW.updated_by, auth.uid()),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_update_trigger
AFTER UPDATE ON public.users
FOR EACH ROW
WHEN (OLD IS DISTINCT FROM NEW)
EXECUTE FUNCTION audit_users_update();

-- Trigger: Auditoria automática de DEACTIVATE (is_active: true → false)
CREATE OR REPLACE FUNCTION audit_users_deactivate()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = true AND NEW.is_active = false THEN
    INSERT INTO public.user_audit_log (user_id, action, old_data, new_data, performed_by, performed_at)
    VALUES (
      NEW.id,
      'DEACTIVATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      COALESCE(NEW.updated_by, auth.uid()),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_deactivate_trigger
AFTER UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION audit_users_deactivate();

-- RLS: Apenas admins podem visualizar audit log
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.user_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs" ON public.user_audit_log
  FOR INSERT WITH CHECK (true);
