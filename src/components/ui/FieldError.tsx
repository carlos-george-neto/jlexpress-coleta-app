import React from "react";

interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-2 mt-1 text-sm text-red-500">
      <span className="text-lg">⚠️</span>
      <span>{message}</span>
    </div>
  );
}
