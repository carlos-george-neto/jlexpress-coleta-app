import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  label?: string;
  rightElement?: React.ReactNode;
}

export function Input({
  error,
  success,
  label,
  className = "",
  rightElement,
  ...props
}: InputProps) {
  const baseStyles =
    "w-full px-4 py-2 border rounded-lg font-medium transition-colors duration-200 focus:outline-none";

  const stateStyles = error
    ? "border-red-500 focus:ring-2 focus:ring-red-500"
    : success
      ? "border-green-500 focus:ring-2 focus:ring-green-500"
      : "border-gray-300 focus:ring-2 focus:ring-blue-500";

  const paddingRight = rightElement ? "pr-10" : "";

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          <span className="text-red-500 ml-1">*</span>
        </label>
      )}
      <div className="relative">
        <input
          className={`${baseStyles} ${stateStyles} ${paddingRight} ${className}`}
          suppressHydrationWarning
          {...props}
        />
        {rightElement ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        ) : (
          <>
            {error && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-lg">
                ✕
              </span>
            )}
            {success && !error && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">
                ✓
              </span>
            )}
          </>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
