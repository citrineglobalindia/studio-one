import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Activity, Sparkles, Calendar, Briefcase, Wallet,
  TrendingUp, MessageCircle, ClipboardList, UserCircle2,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleConfig } from "@/components/role-mobile/role-content";

export default function RoleDashboardPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const { user } = useAuth();
  const cfg = getRoleConfig(currentRole);
  const Icon = cfg.icon;
  const displayName = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Friend";

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary/80 to-primary/60 px-5 pt-5 pb-14 text-primary-foreground">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">Welcome back</p>
              <h1 className="text-2xl font-extrabold mt-0.5 capitalize">{displayName}</h1>
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold bg-white/15 px-2 py-0.5 rounded-md">
                <Icon className="h-3 w-3" />
                {cfg.label}
              </div>
            </div>
            <button
              onClick={() => navigate("/m/profile")}
              className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center"
              aria-label="Profile"
            >
              <UserCircle2 className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {cfg.stats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-2xl p-3 text-center"
              >
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background -mt-6 rounded-t-3xl relative z-10 px-5 pt-6 pb-6">
        {/* Primary KPI */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden mb-4"
        >
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{cfg.primaryMetric.label}</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{cfg.primaryMetric.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{cfg.primaryMetric.sub}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Today's quote */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-secondary to-muted rounded-2xl p-4 mb-5 flex items-center gap-3"
        >
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[12px] font-semibold text-foreground">{cfg.greeting}</p>
            <p className="text-[11px] text-muted-foreground">{cfg.tagline}</p>
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { icon: Briefcase, label: "Projects", path: "/m/projects" },
            { icon: Calendar, label: "Calendar", path: "/m/calendar" },
            { icon: Wallet, label: "Transactions", path: "/m/transactions" },
            { icon: ClipboardList, label: "Attendance", path: "/m/attendance" },
            { icon: MessageCircle, label: "Team Chat", path: "/m/chat" },
            { icon: UserCircle2, label: "My Profile", path: "/m/profile" },
          ].map((q) => {
            const Q = q.icon;
            return (
              <motion.button
                key={q.label}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(q.path)}
                className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 active:bg-secondary/50"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
                  <Q className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[12px] font-semibold text-foreground text-left">{q.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Recent activity */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Recent Activity</h3>
          <Activity className="h-3 w-3 text-muted-foreground ml-auto" />
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {[
            { title: "New assignment posted", time: "2h ago" },
            { title: "Calendar updated for next week", time: "5h ago" },
            { title: "Payout processed", time: "Yesterday" },
            { title: "Attendance confirmed", time: "Yesterday" },
          ].map((a, i, arr) => (
            <button
              key={a.title}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-secondary/50 ${
                i < arr.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="flex-1">
                <p className="text-[13px] text-foreground font-medium">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.time}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
