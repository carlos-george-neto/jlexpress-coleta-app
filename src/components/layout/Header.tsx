"use client";

import { ReactNode } from "react";
import { Typography } from "@/components/ui/Typography";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Typography variant="h2">JLExpress Coleta</Typography>
        <div className="flex items-center gap-4">
          {children}
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
