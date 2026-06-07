"use client";

import { ShipmentStatus } from "@/lib/types/status";

interface Props {
  status: Pick<ShipmentStatus, "is_active" | "is_exception" | "indicative_color">;
}

export function StatusBadge({ status }: Props) {
  if (!status.is_active) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Inativo
      </span>
    );
  }

  if (status.is_exception) {
    const bg = status.indicative_color ? `${status.indicative_color}20` : undefined;
    const text = status.indicative_color ?? "#EF4444";
    return (
      <span
        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
        style={bg ? { backgroundColor: bg, color: text } : { backgroundColor: "#FEE2E2", color: "#DC2626" }}
      >
        Exceção
      </span>
    );
  }

  const bg = status.indicative_color ? `${status.indicative_color}20` : undefined;
  const text = status.indicative_color ?? "#16A34A";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
      style={bg ? { backgroundColor: bg, color: text } : { backgroundColor: "#DCFCE7", color: "#16A34A" }}
    >
      Ativo
    </span>
  );
}
