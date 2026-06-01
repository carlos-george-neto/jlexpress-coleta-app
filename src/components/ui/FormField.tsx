import React from "react";

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className = "" }: FormFieldProps) {
  return <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
}
