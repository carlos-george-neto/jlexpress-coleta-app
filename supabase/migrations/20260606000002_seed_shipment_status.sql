-- Seed idempotente: 7 status operacionais iniciais
-- ON CONFLICT (name) DO NOTHING garante que re-execuções não duplicam dados

INSERT INTO public.shipment_status
  (name, description, is_active, requires_observation, is_exception, is_finalizer, flow_order, indicative_color)
VALUES
  ('Pendente de Coleta',   'Encomenda aguardando coleta',                          TRUE, FALSE, FALSE, FALSE, 1, '#6B7280'),
  ('Em Coleta',            'Encomenda em processo de coleta',                      TRUE, FALSE, FALSE, FALSE, 2, '#3B82F6'),
  ('Coletado',             'Encomenda coletada com sucesso',                       TRUE, FALSE, FALSE, TRUE,  3, '#22C55E'),
  ('Coleta Parcial',       'Apenas parte dos itens foi coletada',                  TRUE, TRUE,  TRUE,  FALSE, 4, '#F59E0B'),
  ('Não Coletado',         'Encomenda não coletada; requer observação',            TRUE, TRUE,  TRUE,  FALSE, 5, '#EF4444'),
  ('Cancelado',            'Encomenda cancelada; encerra o fluxo',                 TRUE, TRUE,  TRUE,  TRUE,  6, '#991B1B'),
  ('Aguardando Validação', 'Encomenda aguardando validação administrativa',        TRUE, FALSE, FALSE, FALSE, 7, '#8B5CF6')
ON CONFLICT (name) DO NOTHING;
