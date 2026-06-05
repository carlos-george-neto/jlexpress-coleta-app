"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UserSearch({
  value,
  onChange,
  placeholder = "Buscar por nome ou email...",
}: Props) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }

  return (
    <Input
      type="search"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="max-w-sm"
    />
  );
}
