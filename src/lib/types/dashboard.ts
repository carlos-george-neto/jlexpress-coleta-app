export interface ActivityEntry {
  collector: string;
  shipments: ShipmentSummary[];
}

export interface ShipmentSummary {
  id: string;
  code: string;
  carrier: string;
  destination: string;
  status_name: string;
  indicative_color: string | null;
  observations: string | null;
  arrival_date: string;
  pickup_date: string | null;
}

export interface ActivityByDate {
  arrival_date: string;
  entries: ActivityEntry[];
}
