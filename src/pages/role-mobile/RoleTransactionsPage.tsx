import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Search, ChevronDown, IndianRupee, TrendingUp, TrendingDown, Calendar, Wallet, Plus, Receipt } from "lucide-react";

type Status = "All" | "Paid" | "Pending" | "Failed";
const TXNS = [
  { id: "T01", desc: "Salary - April", amount: 32000, type: "credit" as const, status: "Paid" as const, date: "01 May 2026" },
  { id: "T02", desc: "Sharma Wedding shoot", amount: 8500, type: "credit" as const, status: "Pending" as const, date: "12 May 2026" },
  { id: "T03", desc: "Travel reimbursement", amount: 1200, type: "credit" as const, status: "Paid" as const, date: "28 Apr 2026" },
  { id: "T04", desc: "Equipment rental", amount: 3500, type: "debit" as const, status: "Paid" as const, date: "20 Apr 2026" },
  { id: "T05", desc: "Verma Engagement bonus", amount: 2500, type: "credit" as const, status: "Pending" as const, date: "20 May 2026" },
  { id: "T06", desc: "Failed payout retry", amount: 4200, type: "credit" as const, status: "Failed" as const, date: "15 Apr 2026" },
];

const SC: Record<string, string> = {
  Paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Failed: "bg-destructive/15 text-destructive",
};

export default function RoleTransactionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Status>("All");
  const [open, setOpen] = useState(false);

  const earned = TXNS.filter((t) => t.status === "Paid" && t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const pending = TXNS.filter((t) => t.status === "Pending").reduce((s, t) => s + t.amount, 0);
  const spent = TXNS.filter((t) => t.status === "Paid" && t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const filtered = TXNS.filter((t) => {
    if (filter !== "All" && t.status !== filter) return false;
    if (search && !t.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString());

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/90 to-primary/60 px-5 pt-5 pb-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              { icon: TrendingUp, label: "Earned", value: earned, color: "text-emerald-300" },
              { icon: TrendingDown, label: "Pending", value: pending, color: "text-amber-200" },
              { icon: Wallet, label: "Spent", value: spent, color: "text-rose-200" },
            ].map((s) => {
              const I = s.icon;
              return (
                <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                  <I className={`h-4 w-4 mb-1 ${s.color}`} />
                  <p className="text-[10px] uppercase tracking-wider opacity-80">{s.label}</p>
                  <p className="text-[15px] font-bold flex items-center mt-0.5">
                    <IndianRupee className="h-3 w-3" />{fmt(s.value)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
            <p className="text-[10px] uppercase tracking-wider opacity-80">Net this month</p>
            <p className="text-3xl font-extrabold flex items-center mt-1">
              <IndianRupee className="h-5 w-5" />{fmt(earned - spent)}
            </p>
            <p className="text-[11px] opacity-80 mt-1">{TXNS.filter((t) => t.status === "Paid").length} settled · {TXNS.filter((t) => t.status === "Pending").length} pending</p>
          </div>
          <button
            onClick={() => navigate("/m/expenses")}
            className="mt-3 w-full bg-white text-primary rounded-2xl p-3.5 flex items-center justify-between font-bold active:scale-[0.98] transition-transform shadow-lg"
          >
            <span className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
              <span className="text-left">
                <span className="block text-[13px] leading-tight">Raise Expense</span>
                <span className="block text-[10px] font-medium opacity-70">Event-wise or office</span>
              </span>
            </span>
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="bg-background -mt-4 rounded-t-3xl relative z-10 px-5 pt-5 pb-6">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className={`flex items-center gap-1 px-3 py-2.5 rounded-xl text-[12px] font-medium ring-1 ${
                filter !== "All" ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border"
              }`}
            >
              {filter}
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[110px]"
                >
                  {(["All", "Paid", "Pending", "Failed"] as Status[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setFilter(opt); setOpen(false); }}
                      className={`block w-full text-left px-3 py-2.5 text-[12px] ${
                        filter === opt ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3"
            >
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${
                t.type === "credit" ? "bg-emerald-500/15" : "bg-destructive/15"
              }`}>
                {t.type === "credit"
                  ? <ArrowDownLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  : <ArrowUpRight className="h-5 w-5 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[13px] font-semibold text-foreground truncate pr-2">{t.desc}</p>
                  <p className={`text-[14px] font-bold ${t.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {t.type === "credit" ? "+" : "-"}₹{fmt(t.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {t.date}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SC[t.status]}`}>{t.status}</span>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No transactions found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
