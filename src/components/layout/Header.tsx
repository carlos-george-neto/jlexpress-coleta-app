"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface Props {
  role?: string;
}

export function Header({ role }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  function desktopNavLink(href: string, label: string) {
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

  function mobileNavLink(href: string, label: string) {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMenuOpen(false)}
        className={`block px-4 py-3 text-base font-medium border-l-4 transition-colors ${
          active
            ? "text-blue-600 border-blue-600 bg-blue-50"
            : "text-gray-700 border-transparent hover:text-blue-600 hover:border-blue-300 hover:bg-gray-50"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {label}
      </Link>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="font-semibold text-gray-900 text-base shrink-0"
          aria-label="Ir para o Dashboard"
        >
          JLExpress Coleta
        </Link>

        {/* Navegação desktop */}
        <div className="hidden sm:flex items-center gap-6 flex-1 ml-6">
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <nav className="flex items-center gap-5 flex-1" aria-label="Navegação principal">
            {desktopNavLink("/dashboard", "Dashboard")}
            {(role === "admin" || role === "collector") &&
              desktopNavLink("/encomendas", "Encomendas")}
            {role === "admin" && (
              <>
                {desktopNavLink("/users", "Usuários")}
                {desktopNavLink("/shipment-status", "Status")}
              </>
            )}
          </nav>
          <LogoutButton />
        </div>

        {/* Botão hamburguer — visível apenas em mobile */}
        <button
          className="sm:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Painel do menu mobile */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden border-t border-gray-200 bg-white"
          role="navigation"
          aria-label="Menu de navegação"
        >
          <div className="py-2">
            {mobileNavLink("/dashboard", "Dashboard")}
            {(role === "admin" || role === "collector") &&
              mobileNavLink("/encomendas", "Encomendas")}
            {role === "admin" && (
              <>
                {mobileNavLink("/users", "Usuários")}
                {mobileNavLink("/shipment-status", "Status")}
              </>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <LogoutButton />
          </div>
        </div>
      )}
    </header>
  );
}
