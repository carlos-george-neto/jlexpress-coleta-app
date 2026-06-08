"use client";

import { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";

interface Collector {
  id: string;
  full_name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function CollectorCombobox({ value, onChange, disabled, error }: Props) {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch(
      "/api/users?role=collector&is_active=true&limit=100&sort_by=full_name&sort_order=asc"
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCollectors(data.data.items as Collector[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = value.trim()
    ? collectors.filter((c) => c.full_name.toLowerCase().includes(value.toLowerCase()))
    : collectors;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Responsável pela Coleta <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Digite ou selecione um coletor..."
        disabled={disabled}
        aria-label="Responsável pela coleta"
        autoComplete="off"
        className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && filtered.length > 0 && (
        <ul className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <li
              key={c.id}
              onMouseDown={() => {
                onChange(c.full_name);
                setOpen(false);
              }}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 active:bg-blue-100"
            >
              {c.full_name}
            </li>
          ))}
        </ul>
      )}

      {open && value.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-20 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
          Nenhum coletor encontrado
        </div>
      )}
    </div>
  );
}
