import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, LogIn, LogOut, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const HISTORY = [
  { date: "01 May", in: "09:12 AM", out: "06:48 PM", hours: "9h 36m", status: "present" as const },
  { date: "30 Apr", in: "09:05 AM", out: "06:30 PM", hours: "9h 25m", status: "present" as const },
  { date: "29 Apr", in: "—", out: "—", hours: "0h", status: "leave" as const },
  { date: "28 Apr", in: "09:18 AM", out: "07:02 PM", hours: "9h 44m", status: "present" as const },
  { date: "27 Apr", in: "10:24 AM", out: "06:30 PM", hours: "8h 06m", status: "late" as const },
];

const SC: Record<string, string> = {
  present: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  late: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  leave: "bg-muted text-muted-foreground",
};

export default function RoleAttendancePage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [since, setSince] = useState<string | null>(null);

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Attendance</h1>
        <p className="text-[12px] text-muted-foreground">Track your clock-ins and shifts</p>
      </div>

      {/* Status card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden mb-4"
      >
        <div className={`h-1 ${clockedIn ? "bg-emerald-500" : "bg-muted"}`} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Today</p>
              <p className="text-[18px] font-extrabold text-foreground mt-0.5">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
              </p>
              {since && (
                <p className="text-[12px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Since {since}
                </p>
              )}
            </div>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
              clockedIn ? "bg-emerald-500/15" : "bg-secondary"
            }`}>
              <Clock className={`h-7 w-7 ${clockedIn ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
            </div>
          </div>
          <button
            onClick={() => {
              if (clockedIn) {
                setClockedIn(false);
                setSince(null);
                toast.success("Clocked out");
              } else {
                const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                setClockedIn(true);
                setSince(now);
                toast.success("Clocked in");
              }
            }}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-colors ${
              clockedIn ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {clockedIn ? <><LogOut className="h-4 w-4" /> Clock Out</> : <><LogIn className="h-4 w-4" /> Clock In</>}
          </button>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { icon: CheckCircle2, label: "Present", value: 22, color: "text-emerald-600 dark:text-emerald-400" },
          { icon: Clock, label: "Late", value: 2, color: "text-amber-600 dark:text-amber-400" },
          { icon: XCircle, label: "Leave", value: 1, color: "text-muted-foreground" },
        ].map((s) => {
          const I = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <I className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-xl font-extrabold text-foreground">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h3 className="text-[14px] font-bold text-foreground">Recent History</h3>
        <Calendar className="h-3 w-3 text-muted-foreground ml-auto" />
      </div>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {HISTORY.map((h, i) => (
          <div
            key={h.date}
            className={`flex items-center gap-3 px-4 py-3 ${i < HISTORY.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <p className="text-[11px] font-bold text-foreground">{h.date.split(" ")[0]}</p>
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-foreground">{h.date} · {h.hours}</p>
              <p className="text-[11px] text-muted-foreground">In {h.in} · Out {h.out}</p>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SC[h.status]}`}>
              {h.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
