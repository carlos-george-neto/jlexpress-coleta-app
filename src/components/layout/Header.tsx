"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface Props {
  role?: string;
}

export function Header({ role }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function navLink(href: string, label: string) {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={`text-sm font-medium pb-0.5 border-b-2 transition-colors whitespace-nowrap ${
          active
            ? "text-blue-600 border-blue-600"
            : "text-gray-600 border-transparent hover:text-blue-600 hover:border-blue-300"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link
          href="/dashboard"
          className="font-semibold text-gray-900 text-base shrink-0"
          aria-label="Ir para o Dashboard"
        >
          JLExpress Coleta
        </Link>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        <nav className="flex items-center gap-5 flex-1" aria-label="Navegação principal">
          {navLink("/dashboard", "Dashboard")}
          {(role === "admin" || role === "collector") && navLink("/encomendas", "Encomendas")}
          {role === "admin" && (
            <>
              {navLink("/users", "Usuários")}
              {navLink("/shipment-status", "Status")}
            </>
          )}
        </nav>

        <LogoutButton />
      </div>
    </header>
  );
}
