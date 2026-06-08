import { supabaseAdmin } from "@/lib/supabase/admin";
import { ShipmentWithStatus } from "@/lib/types/shipment";
import { ActivityByDate, ShipmentSummary } from "@/lib/types/dashboard";

export async function getCollectorDashboardShipments(
  userFullName: string
): Promise<ShipmentWithStatus[]> {
  const { data: pendingStatuses } = await supabaseAdmin
    .from("shipment_status")
    .select("id")
    .ilike("name", "pendente de coleta");

  const pendingIds = (pendingStatuses ?? []).map((s: { id: string }) => s.id);

  const orFilter =
    pendingIds.length > 0
      ? `status_id.in.(${pendingIds.join(",")}),responsible.ilike.${userFullName}`
      : `responsible.ilike.${userFullName}`;

  const { data, error } = await supabaseAdmin
    .from("shipments")
    .select(
      "*, shipment_status(id, name, indicative_color, is_exception, requires_observation, is_finalizer)"
    )
    .eq("is_active", true)
    .or(orFilter)
    .order("arrival_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ShipmentWithStatus[];
}

interface RawShipmentRow {
  id: string;
  code: string;
  carrier: string;
  destination: string;
  responsible: string;
  arrival_date: string;
  pickup_date: string | null;
  observations: string | null;
  shipment_status: { name: string; indicative_color: string | null } | null;
}

export async function getAdminDashboardActivities(): Promise<ActivityByDate[]> {
  const { data, error } = await supabaseAdmin
    .from("shipments")
    .select(
      "id, code, carrier, destination, responsible, arrival_date, pickup_date, observations, shipment_status(name, indicative_color)"
    )
    .eq("is_active", true)
    .order("arrival_date", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as RawShipmentRow[];
  const byDate = new Map<string, Map<string, ShipmentSummary[]>>();

  for (const row of rows) {
    const summary: ShipmentSummary = {
      id: row.id,
      code: row.code,
      carrier: row.carrier,
      destination: row.destination,
      status_name: row.shipment_status?.name ?? "",
      indicative_color: row.shipment_status?.indicative_color ?? null,
      observations: row.observations ?? null,
      arrival_date: row.arrival_date,
      pickup_date: row.pickup_date ?? null,
    };

    if (!byDate.has(row.arrival_date)) byDate.set(row.arrival_date, new Map());
    const byCollector = byDate.get(row.arrival_date)!;
    if (!byCollector.has(row.responsible)) byCollector.set(row.responsible, []);
    byCollector.get(row.responsible)!.push(summary);
  }

  return Array.from(byDate.entries()).map(([arrivalDate, byCollector]) => ({
    arrival_date: arrivalDate,
    entries: Array.from(byCollector.entries()).map(([collector, shipments]) => ({
      collector,
      shipments,
    })),
  }));
}
