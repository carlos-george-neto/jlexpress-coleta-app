"use client";

import { ShipmentStatus } from "@/lib/types/status";

interface Props {
  status: Pick<ShipmentStatus, "is_active">;
}

export function StatusBadge({ status }: Props) {
  if (!status.is_active) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Inativo
      </span>
    );
  }

  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      Ativo
    </span>
  );
}
