import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";

// Reusable color palettes — keep them semantic
const PIE_COLORS = ["#10b981", "#3b82f6", "#a78bfa", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#ef4444", "#6366f1"];
const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";

function inrShort(n: number) {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${Math.round(v)}`;
}

function inrFull(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
}

// ─── Donut: status / category breakdown ───
export function DonutCard({
  title, subtitle, data, total, totalLabel = "Total",
}: {
  title: string;
  subtitle?: string;
  data: Array<{ name: string; value: number }>;
  total: number;
  totalLabel?: string;
}) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
      ) : (
        <div className="relative h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                cx="50%" cy="50%"
                innerRadius={56} outerRadius={84}
                paddingAngle={2}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {filtered.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => inrFull(v)}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" style={{ paddingTop: 8 }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{totalLabel}</p>
            <p className="text-base font-bold text-foreground tabular-nums">{inrShort(total)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini pie for a list of breakdown rows (used in P&L) ───
export function MiniPieRows({
  data, color = "emerald",
}: {
  data: Array<{ name: string; value: number }>;
  color?: "emerald" | "rose";
}) {
  const sum = data.reduce((s, d) => s + d.value, 0);
  if (sum === 0) return null;
  return (
    <div className="grid grid-cols-[120px,1fr] gap-3 items-center">
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={48} stroke="hsl(var(--background))" strokeWidth={1.5}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => inrFull(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1 text-xs">
        {data.map((d, i) => {
          const pct = (d.value / sum) * 100;
          return (
            <li key={d.name} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate text-foreground">{d.name}</span>
              </span>
              <span className="tabular-nums text-muted-foreground">{inrFull(d.value)} <span className="opacity-60">({pct.toFixed(0)}%)</span></span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Area chart: month-by-month income vs expense ───
export function MonthAreaChart({
  data, height = 220,
}: {
  data: Array<{ month: string; income: number; expense: number; net?: number }>;
  height?: number;
}) {
  if (data.length === 0) return null;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.4} />
              <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.4} />
              <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => inrShort(Number(v))} width={50} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number, n: string) => [inrFull(v), n[0].toUpperCase() + n.slice(1)]}
          />
          <Area type="monotone" dataKey="income" stroke={INCOME_COLOR} fill="url(#incomeGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="expense" stroke={EXPENSE_COLOR} fill="url(#expenseGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status bar chart (counts) ───
export function StatusBarChart({ data, height = 180 }: { data: Array<{ status: string; count: number; color: string }>; height?: number }) {
  if (data.length === 0) return null;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
          <XAxis dataKey="status" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
