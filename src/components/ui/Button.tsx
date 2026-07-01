"use client";

import * as React from "react";
import clsx from "clsx";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export function Button({
  children,
  size = "md",
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none",
        disabled && "cursor-not-allowed opacity-60",

        size === "sm" && "h-9 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-base",

        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-700",

        variant === "secondary" &&
          "bg-gray-200 text-gray-900 hover:bg-gray-300",

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}