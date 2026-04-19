import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, ChevronRight, Briefcase } from "lucide-react";

const PROJECTS = [
  { id: "P01", name: "Sharma Wedding", client: "Rahul & Anjali", date: "12 May", venue: "Taj Banquet, Delhi", status: "Upcoming", progress: 35 },
  { id: "P02", name: "Verma Engagement", client: "Karan & Nisha", date: "20 May", venue: "Leela Palace, Goa", status: "Planning", progress: 12 },
  { id: "P03", name: "Mehta Sangeet", client: "Aditya & Pooja", date: "02 Jun", venue: "Hyatt Regency, Mumbai", status: "Active", progress: 68 },
  { id: "P04", name: "Iyer Pre-Wedding", client: "Karthik & Divya", date: "08 Jun", venue: "Munnar Resort", status: "Active", progress: 50 },
  { id: "P05", name: "Reddy Reception", client: "Suresh & Latha", date: "15 Mar", venue: "ITC Gardenia", status: "Delivered", progress: 100 },
];

const STATUS_COLORS: Record<string, string> = {
  Upcoming: "bg-primary/15 text-primary",
  Planning: "bg-muted text-muted-foreground",
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Delivered: "bg-secondary text-secondary-foreground",
};

export default function RoleProjectsPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | "Active" | "Upcoming" | "Delivered">("All");

  const filtered = PROJECTS.filter((p) => {
    if (tab !== "All" && !(p.status === tab || (tab === "Active" && p.status === "Planning"))) return false;
    if (q && !`${p.name} ${p.client} ${p.venue}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Projects</h1>
        <p className="text-[12px] text-muted-foreground">Your assigned shoots and edits</p>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
        />
      </div>

      <div className="flex gap-1.5 mb-4 bg-secondary/60 rounded-2xl p-1">
        {(["All", "Active", "Upcoming", "Delivered"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="w-full bg-card border border-border rounded-2xl p-4 text-left active:bg-secondary/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-bold text-foreground truncate">{p.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">{p.client}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                  <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {p.venue}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
            </div>
          </motion.button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No projects match your filters.</div>
        )}
      </div>
    </div>
  );
}
