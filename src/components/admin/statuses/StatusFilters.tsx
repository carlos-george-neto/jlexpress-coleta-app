"use client";

interface Filters {
  search: string;
  is_active: "" | "true" | "false";
  is_exception: "" | "true";
  is_finalizer: "" | "true";
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function StatusFilters({ filters, onChange }: Props) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleBool(key: "is_exception" | "is_finalizer") {
    set(key, filters[key] === "true" ? "" : "true");
  }

  function toggleActive(value: "true" | "false") {
    set("is_active", filters.is_active === value ? "" : value);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => set("search", e.target.value)}
        placeholder="Buscar por nome ou descrição..."
        aria-label="Buscar status"
        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Disponibilidade</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleActive("true")}
              aria-pressed={filters.is_active === "true"}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.is_active === "true"
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => toggleActive("false")}
              aria-pressed={filters.is_active === "false"}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.is_active === "false"
                  ? "bg-gray-200 text-gray-700 border-gray-400"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Inativos
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleBool("is_exception")}
              aria-pressed={filters.is_exception === "true"}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.is_exception === "true"
                  ? "bg-red-100 text-red-700 border-red-300"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Exceção
            </button>
            <button
              type="button"
              onClick={() => toggleBool("is_finalizer")}
              aria-pressed={filters.is_finalizer === "true"}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.is_finalizer === "true"
                  ? "bg-purple-100 text-purple-700 border-purple-300"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Finalizadores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
