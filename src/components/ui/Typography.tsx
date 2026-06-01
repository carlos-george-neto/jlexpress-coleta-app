import React from "react";

interface TypographyProps {
  variant?: "h1" | "h2" | "h3" | "body" | "small";
  children: React.ReactNode;
  className?: string;
}

export function Typography({
  variant = "body",
  children,
  className = "",
}: TypographyProps) {
  const variants = {
    h1: "text-3xl font-bold text-gray-900",
    h2: "text-2xl font-bold text-gray-900",
    h3: "text-xl font-semibold text-gray-900",
    body: "text-base text-gray-700",
    small: "text-sm text-gray-600",
  };

  const Element = variant.startsWith("h") ? (variant as "h1" | "h2" | "h3") : "p";

  return React.createElement(Element, {
    className: `${variants[variant]} ${className}`,
    children,
  });
}
