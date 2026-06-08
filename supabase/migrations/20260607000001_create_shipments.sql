-- Migration: Criação das tabelas shipments e shipment_audit_log
-- Feature: 006-cadastro-encomendas
-- Pré-requisito: migrations 001 (users + função update_updated_at_column),
--                006000001 (shipment_status)

-- ── Tabela principal de encomendas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT        NOT NULL,
  carrier         TEXT        NOT NULL,
  volume_count    INTEGER     NOT NULL CHECK (volume_count >= 1),
  arrival_date    DATE        NOT NULL,
  pickup_date     DATE,
  destination     TEXT        NOT NULL,
  responsible     TEXT        NOT NULL,
  status_id       UUID        NOT NULL REFERENCES public.shipment_status(id),
  observations    TEXT,
  collected_count INTEGER     CHECK (collected_count >= 0),
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_shipment_code_carrier UNIQUE (code, carrier)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_shipments_status_id    ON public.shipments(status_id);
CREATE INDEX IF NOT EXISTS idx_shipments_is_active    ON public.shipments(is_active);
CREATE INDEX IF NOT EXISTS idx_shipments_arrival_date ON public.shipments(arrival_date DESC);
CREATE INDEX IF NOT EXISTS idx_shipments_carrier      ON public.shipments(carrier);

-- Trigger: atualiza updated_at automaticamente (reutiliza função da migration 001)
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Tabela de auditoria imutável de encomendas ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.shipment_audit_log (
  id           BIGSERIAL   PRIMARY KEY,
  shipment_id  UUID        NOT NULL REFERENCES public.shipments(id),
  action       TEXT        NOT NULL,
  old_data     JSONB,
  new_data     JSONB,
  performed_by UUID        NOT NULL REFERENCES public.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT shipment_audit_action_check CHECK (
    action IN ('CREATE', 'FULL_UPDATE', 'STATUS_UPDATE', 'DELETE')
  )
);

-- Índices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_shipment_audit_shipment_id  ON public.shipment_audit_log(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_audit_performed_at ON public.shipment_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_audit_action       ON public.shipment_audit_log(action);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_audit_log ENABLE ROW LEVEL SECURITY;

-- shipments: admin gerencia tudo (criação, leitura, edição, soft delete)
CREATE POLICY "Admin gerencia encomendas"
  ON public.shipments
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

-- shipments: coletor lê apenas encomendas ativas
CREATE POLICY "Coletor lê encomendas ativas"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'collector' AND u.is_active = TRUE
    )
  );

-- shipments: coletor atualiza status de encomendas ativas
-- (restrição de campos específicos é aplicada na service layer)
CREATE POLICY "Coletor atualiza encomendas ativas"
  ON public.shipments
  FOR UPDATE
  TO authenticated
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'collector' AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'collector' AND u.is_active = TRUE
    )
  );

-- shipment_audit_log: qualquer usuário autenticado ativo lê a auditoria
-- inserções são realizadas exclusivamente via supabaseAdmin (service layer),
-- que contorna o RLS — portanto nenhuma policy de INSERT é necessária aqui
CREATE POLICY "Usuários autenticados leem auditoria de encomendas"
  ON public.shipment_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_active = TRUE
    )
  );
