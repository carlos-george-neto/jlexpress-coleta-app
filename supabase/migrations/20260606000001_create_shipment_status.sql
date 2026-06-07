-- Tabela de status operacionais de encomendas
CREATE TABLE IF NOT EXISTS public.shipment_status (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(100) NOT NULL,
  description          TEXT,
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  requires_observation BOOLEAN      NOT NULL DEFAULT FALSE,
  is_exception         BOOLEAN      NOT NULL DEFAULT FALSE,
  is_finalizer         BOOLEAN      NOT NULL DEFAULT FALSE,
  flow_order           INTEGER      NOT NULL,
  indicative_color     VARCHAR(7),
  created_by           UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by           UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT shipment_status_name_unique UNIQUE (name),
  CONSTRAINT shipment_status_color_format CHECK (
    indicative_color IS NULL OR indicative_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_shipment_status_is_active    ON public.shipment_status (is_active);
CREATE INDEX IF NOT EXISTS idx_shipment_status_flow_order   ON public.shipment_status (flow_order);
CREATE INDEX IF NOT EXISTS idx_shipment_status_is_exception ON public.shipment_status (is_exception);
CREATE INDEX IF NOT EXISTS idx_shipment_status_is_finalizer ON public.shipment_status (is_finalizer);
CREATE INDEX IF NOT EXISTS idx_shipment_status_name         ON public.shipment_status (name);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_shipment_status_updated_at
  BEFORE UPDATE ON public.shipment_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela de auditoria de status
CREATE TABLE IF NOT EXISTS public.shipment_status_audit_log (
  id           BIGSERIAL    PRIMARY KEY,
  status_id    UUID         NOT NULL REFERENCES public.shipment_status(id) ON DELETE CASCADE,
  action       VARCHAR(50)  NOT NULL,
  old_data     JSONB,
  new_data     JSONB,
  performed_by UUID         NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT shipment_status_audit_action_check CHECK (
    action IN ('CREATE', 'UPDATE', 'DEACTIVATE', 'REACTIVATE')
  )
);

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_status_audit_status_id    ON public.shipment_status_audit_log (status_id);
CREATE INDEX IF NOT EXISTS idx_status_audit_performed_by ON public.shipment_status_audit_log (performed_by);
CREATE INDEX IF NOT EXISTS idx_status_audit_performed_at ON public.shipment_status_audit_log (performed_at);
CREATE INDEX IF NOT EXISTS idx_status_audit_action       ON public.shipment_status_audit_log (action);

-- RLS: habilitar nas duas tabelas
ALTER TABLE public.shipment_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_status_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas: shipment_status
-- Admin gerencia tudo
CREATE POLICY "Admin gerencia status"
  ON public.shipment_status
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.is_active = TRUE
    )
  );

-- Qualquer usuário autenticado lê status ativos
CREATE POLICY "Usuários autenticados leem status ativos"
  ON public.shipment_status
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Políticas: shipment_status_audit_log
-- Apenas admin lê o log de auditoria
CREATE POLICY "Admin lê auditoria de status"
  ON public.shipment_status_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.is_active = TRUE
    )
  );

-- Apenas admin insere no log de auditoria (via service role no código)
CREATE POLICY "Admin insere auditoria de status"
  ON public.shipment_status_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin' AND u.is_active = TRUE
    )
  );
