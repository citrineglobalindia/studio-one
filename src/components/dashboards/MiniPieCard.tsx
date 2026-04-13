import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

function MiniPieCard({ title, subtitle, data, centerLabel }: { title: string; subtitle: string; data: ChartItem[]; centerLabel?: string }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <motion.div variants={cardVariants} className="bg-card rounded-2xl border border-border p-4 flex flex-col">
      <h4 className="font-bold text-[13px] text-foreground mb-0.5">{title}</h4>
      <p className="text-[10px] text-muted-foreground mb-3">{subtitle}</p>

      <div className="relative mx-auto mb-3" style={{ width: 130, height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11, padding: "6px 10px" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value}`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-display font-extrabold text-foreground">{centerLabel}</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mt-auto">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2 text-[11px]">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
            <span className="font-semibold text-foreground">{d.value}</span>
            <span className="text-muted-foreground/60 text-[10px]">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default MiniPieCard;
export { MiniPieCard };
