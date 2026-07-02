"use client";

import {
  useCallback,
  useEffect,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
  ChangeEvent,
} from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const updateValue = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join("").replace(/\s/g, "").slice(0, length));
    },
    [length, onChange]
  );

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/\D/g, "");
    if (!raw) {
      const next = [...digits];
      next[index] = " ";
      updateValue(next);
      return;
    }

    const next = [...digits];
    let cursor = index;

    for (const char of raw) {
      if (cursor >= length) break;
      next[cursor] = char;
      cursor += 1;
    }

    updateValue(next);
    if (cursor < length) {
      focusInput(cursor);
    } else {
      inputRefs.current[length - 1]?.blur();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...digits];
      if (digits[index]?.trim()) {
        next[index] = " ";
        updateValue(next);
        focusInput(index);
        return;
      }
      if (index > 0) {
        next[index - 1] = " ";
        updateValue(next);
        focusInput(index - 1);
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    const next = Array.from({ length }, (_, i) => pasted[i] ?? " ");
    updateValue(next);

    const focusIndex = Math.min(pasted.length, length - 1);
    focusInput(focusIndex);
  };

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digits[index]?.trim() ? digits[index] : ""}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          className={cn(
            "h-12 w-10 rounded-xl border border-border bg-background text-center text-lg font-semibold text-foreground outline-none transition-all sm:h-14 sm:w-12",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            disabled && "cursor-not-allowed opacity-60"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
