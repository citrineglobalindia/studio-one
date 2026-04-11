import { cn } from "@/lib/utils";

export function ProgressRing({ value, size = 48, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value === 100 ? "text-emerald-500" : value >= 60 ? "text-blue-500" : value >= 30 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={cn("transition-all duration-700", color)} />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", color)}>
        {value}%
      </span>
    </div>
  );
}
