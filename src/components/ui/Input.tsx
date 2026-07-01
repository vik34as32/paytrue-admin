"use client";

import * as React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "dark";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      className,
      variant = "default",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-white">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            {...props}
            className={clsx(
              "h-11 w-full rounded-lg border px-4 text-sm outline-none transition-all",
              icon && "pl-10",
              variant === "dark"
                ? "border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                : "border-gray-300 bg-white text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
              error && "border-red-500",
              className
            )}
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";