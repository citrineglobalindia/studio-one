import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft, ArrowUpRight, Search, IndianRupee,
  TrendingUp, TrendingDown, Wallet, Plus, Receipt, Sparkles,
  ArrowUpRight as Arrow, Eye, EyeOff,
} from "lucide-react";

type Status = "All" | "Paid" | "Pending" | "Failed";
const TXNS = [
  { id: "T01", desc: "Salary — April",          sub: "Studio payroll",       amount: 32000, type: "credit" as const, status: "Paid" as const,    date: "01 May 2026" },
  { id: "T02", desc: "Sharma Wedding shoot",    sub: "Event payout",         amount: 8500,  type: "credit" as const, status: "Pending" as const, date: "12 May 2026" },
  { id: "T03", desc: "Travel reimbursement",    sub: "Approved expense",     amount: 1200,  type: "credit" as const, status: "Paid" as const,    date: "28 Apr 2026" },
  { id: "T04", desc: "Equipment rental",        sub: "Sony A7IV · 2 days",   amount: 3500,  type: "debit"  as const, status: "Paid" as const,    date: "20 Apr 2026" },
  { id: "T05", desc: "Verma Engagement bonus",  sub: "Performance bonus",    amount: 2500,  type: "credit" as const, status: "Pending" as const, date: "20 May 2026" },
  { id: "T06", desc: "Failed payout retry",     sub: "Bank rejected",        amount: 4200,  type: "credit" as const, status: "Failed" as const,  date: "15 Apr 2026" },
];

const SC: Record<string, string> = {
  Paid:    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30",
  Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30",
  Failed:  "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
};

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString());
const fmtFull = (n: number) => n.toLocaleString("en-IN");

export default function RoleTransactionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status>("All");
  const [hide, setHide] = useState(false);

  const earned  = useMemo(() => TXNS.filter((t) => t.status === "Paid"    && t.type === "credit").reduce((s, t) => s + t.amount, 0), []);
  const pending = useMemo(() => TXNS.filter((t) => t.status === "Pending").reduce((s, t) => s + t.amount, 0), []);
  const spent   = useMemo(() => TXNS.filter((t) => t.status === "Paid"    && t.type === "debit" ).reduce((s, t) => s + t.amount, 0), []);

  const filtered = TXNS.filter((t) => {
    if (filter !== "All" && t.status !== filter) return false;
    if (search && !`${t.desc} ${t.sub}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const mask = (s: string) => (hide ? "•••••" : s);

  return (
    <div>
      {/* Hero — premium gradient wallet card */}
      <div className="relative px-5 pt-5 pb-14 text-primary-foreground overflow-hidden">
        {/* layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/55" />
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-75 font-semibold">Wallet · This month</p>
              <p className="text-[12px] opacity-90 mt-0.5">May 2026</p>
            </div>
            <button
              onClick={() => setHide((v) => !v)}
              className="h-9 w-9 rounded-2xl bg-white/15 backdrop-blur-xl ring-1 ring-white/20 flex items-center justify-center active:scale-90 transition"
              aria-label="Toggle balance visibility"
            >
              {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Glass net card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-2xl border border-white/25 p-5 shadow-2xl overflow-hidden"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 opacity-80" />
              <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Net balance</p>
            </div>
            <div className="flex items-end gap-1">
              <IndianRupee className="h-7 w-7 mb-1 opacity-90" />
              <p className="text-[44px] font-black leading-none tracking-tight">
                {hide ? "•••••" : fmtFull(earned - spent)}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] opacity-90">
              <span className="inline-flex items-center gap-1 bg-white/15 ring-1 ring-white/20 rounded-full px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-200" />
                {TXNS.filter((t) => t.status === "Paid").length} settled
              </span>
              <span className="inline-flex items-center gap-1 bg-white/15 ring-1 ring-white/20 rounded-full px-2 py-0.5">
                <TrendingDown className="h-3 w-3 text-amber-200" />
                {TXNS.filter((t) => t.status === "Pending").length} pending
              </span>
            </div>
          </motion.div>

          {/* Mini stat chips */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { icon: TrendingUp, label: "Earned",  value: earned,  tint: "text-emerald-200" },
              { icon: TrendingDown, label: "Pending", value: pending, tint: "text-amber-200" },
              { icon: Wallet, label: "Spent",   value: spent,   tint: "text-rose-200" },
            ].map((s, i) => {
              const I = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="bg-white/12 backdrop-blur-xl rounded-2xl p-2.5 border border-white/15"
                >
                  <I className={`h-3.5 w-3.5 mb-1 ${s.tint}`} />
                  <p className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">{s.label}</p>
                  <p className="text-[13px] font-extrabold flex items-center mt-0.5">
                    <IndianRupee className="h-2.5 w-2.5" />{mask(fmt(s.value))}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Raise expense CTA */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/m/expenses")}
            className="mt-3 w-full bg-white text-primary rounded-2xl p-3.5 flex items-center justify-between font-bold shadow-xl ring-1 ring-black/5"
          >
            <span className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-left">
                <span className="block text-[13px] leading-tight">Raise an expense</span>
                <span className="block text-[10px] font-medium opacity-60">Event-wise · office · travel</span>
              </span>
            </span>
            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
          </motion.button>
        </div>
      </div>

      {/* List sheet */}
      <div className="bg-background -mt-6 rounded-t-[28px] relative z-10 px-5 pt-5 pb-6 ring-1 ring-border/40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[15px] font-extrabold text-foreground tracking-tight">Activity</p>
            <p className="text-[11px] text-muted-foreground">{filtered.length} transactions</p>
          </div>
          <div className="relative w-44">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-card ring-1 ring-border text-[12px] outline-none focus:ring-primary"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5 mb-3 -mx-1 px-1 overflow-x-auto">
          {(["All", "Paid", "Pending", "Failed"] as Status[]).map((opt) => {
            const active = filter === opt;
            return (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`shrink-0 relative px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  active ? "text-primary-foreground" : "text-muted-foreground bg-card ring-1 ring-border"
                }`}
              >
                {active && (
                  <motion.div layoutId="txn-pill" className="absolute inset-0 bg-primary rounded-full shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{opt}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          <AnimatePresence>
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.03 }}
                className="group relative bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
              >
                {/* accent left rail */}
                <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                  t.type === "credit" ? "bg-emerald-500/70" : "bg-destructive/70"
                }`} />
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ml-1 ${
                  t.type === "credit" ? "bg-emerald-500/12" : "bg-destructive/12"
                }`}>
                  {t.type === "credit"
                    ? <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    : <ArrowUpRight className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[13px] font-bold text-foreground truncate pr-2">{t.desc}</p>
                    <p className={`text-[14px] font-extrabold tracking-tight ${
                      t.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                    }`}>
                      {t.type === "credit" ? "+" : "−"}₹{mask(fmt(t.amount))}
                    </p>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground truncate">{t.sub}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{t.date}</span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${SC[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
                <Arrow className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-12 rounded-2xl bg-card border border-dashed border-border">
              <Wallet className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">No transactions match</p>
              <p className="text-[11px] text-muted-foreground mt-1">Try a different filter or search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
