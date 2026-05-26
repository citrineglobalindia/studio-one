import * as React from "react";
import { Input } from "@/components/ui/input";

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "maxLength" | "inputMode" | "pattern"> {
  value: string;
  onChange: (next: string) => void;
  /** Strict mode shows the count; default true. Set false to hide the counter chip. */
  showCount?: boolean;
}

/**
 * 10-digit Indian mobile number input.
 * - Accepts only digits (paste / autofill stripped)
 * - Hard cap at 10 chars
 * - inputMode=numeric pops the number pad on mobile
 * - Visual chip shows "10 / 10" → "✓" when valid
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, showCount = true, placeholder = "98765 43210", className = "", ...rest }, ref) => {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);
    const valid = digits.length === 10;

    const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange(next);
    };

    return (
      <div className="relative">
        <Input
          {...rest}
          ref={ref}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]{10}"
          maxLength={10}
          autoComplete="tel-national"
          value={digits}
          onChange={handle}
          placeholder={placeholder}
          className={"pr-14 tracking-wide tabular-nums " + className}
        />
        {showCount && digits.length > 0 && (
          <span
            className={
              "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 select-none rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums " +
              (valid
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                : "bg-muted text-muted-foreground border border-border")
            }
            aria-hidden
          >
            {valid ? "✓" : `${digits.length}/10`}
          </span>
        )}
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
