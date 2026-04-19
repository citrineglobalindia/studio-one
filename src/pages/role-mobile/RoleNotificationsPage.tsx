import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Calendar, MessageCircle, Wallet, Briefcase,
  AlertTriangle, CheckCircle2, Clock, Trash2, Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = "task" | "event" | "message" | "payment" | "system";
type Priority = "low" | "normal" | "high";

interface NotifItem {
  id: string;
  category: Category;
  priority: Priority;
  title: string;
  body: string;
  time: Date;
  read: boolean;
}

const CATEGORY_META: Record<Category, { icon: typeof Bell; tint: string; bg: string; label: string }> = {
  task:    { icon: Briefcase,      tint: "text-amber-500",    bg: "bg-amber-500/12",    label: "Task" },
  event:   { icon: Calendar,       tint: "text-blue-500",     bg: "bg-blue-500/12",     label: "Event" },
  message: { icon: MessageCircle,  tint: "text-violet-500",   bg: "bg-violet-500/12",   label: "Chat" },
  payment: { icon: Wallet,         tint: "text-emerald-500",  bg: "bg-emerald-500/12",  label: "Payment" },
  system:  { icon: AlertTriangle,  tint: "text-rose-500",     bg: "bg-rose-500/12",     label: "Alert" },
};

const seed = (role: string): NotifItem[] => {
  const now = Date.now();
  const m = (mins: number) => new Date(now - mins * 60_000);
  return [
    { id: "1", category: "task",    priority: "high",   title: "New task assigned", body: `Edit Sharma wedding teaser — due tomorrow 6 PM.`, time: m(8),   read: false },
    { id: "2", category: "event",   priority: "normal", title: "Tomorrow's shoot",  body: "Reception at Hyatt, 5:30 PM. Crew: 3 members.",     time: m(45),  read: false },
    { id: "3", category: "payment", priority: "normal", title: "Expense approved",  body: "Travel ₹1,200 has been approved by Admin.",         time: m(180), read: false },
    { id: "4", category: "message", priority: "low",    title: "Anita replied",     body: `"Looks great, please send revision by Friday."`,     time: m(360), read: true  },
    { id: "5", category: "system",  priority: "high",   title: "Attendance pending",body: "You haven't clocked in for today's session.",       time: m(600), read: true  },
    { id: "6", category: "task",    priority: "low",    title: "Album review",      body: "Verma family album moved to your queue.",            time: m(1440),read: true  },
  ];
};

const FILTERS: { key: "all" | "unread" | Category; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "task", label: "Tasks" },
  { key: "event", label: "Events" },
  { key: "message", label: "Chats" },
  { key: "payment", label: "Payments" },
];

export default function RoleNotificationsPage() {
  const { currentRole } = useRole();
  const [items, setItems] = useState<NotifItem[]>(() => seed(currentRole));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((n) => !n.read);
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAll = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  const remove = (id: string) => setItems((prev) => prev.filter((n) => n.id !== id));

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-primary via-primary/85 to-primary/60 text-primary-foreground shadow-lg"
      >
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary-foreground/15 blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                <Bell className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Inbox</span>
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight leading-none">
              {unreadCount}
              <span className="ml-2 text-sm font-medium opacity-80">unread</span>
            </p>
            <p className="mt-1 text-xs opacity-80">{items.length} total notifications</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1.5 rounded-full bg-primary-foreground/20 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold active:scale-95 transition-transform"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <motion.button
              key={f.key}
              whileTap={{ scale: 0.94 }}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold border transition-colors",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
              )}
            >
              {f.label}
              {f.key === "unread" && unreadCount > 0 && (
                <span className={cn(
                  "ml-1.5 inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold",
                  active ? "bg-background/20 text-background" : "bg-primary text-primary-foreground"
                )}>
                  {unreadCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">You're all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">Nothing here right now.</p>
            </motion.div>
          ) : (
            filtered.map((n) => {
              const meta = CATEGORY_META[n.category];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.18 }}
                  onClick={() => toggleRead(n.id)}
                  className={cn(
                    "relative rounded-2xl p-3.5 border transition-colors active:scale-[0.99]",
                    n.read
                      ? "bg-card border-border/50"
                      : "bg-card border-primary/30 shadow-sm"
                  )}
                >
                  {!n.read && (
                    <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                      <Icon className={cn("h-4.5 w-4.5", meta.tint)} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                          meta.bg, meta.tint
                        )}>
                          {meta.label}
                        </span>
                        {n.priority === "high" && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-rose-500/12 text-rose-500">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "mt-1 text-[13px] leading-snug",
                        n.read ? "font-medium text-foreground/90" : "font-bold text-foreground"
                      )}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug line-clamp-2">
                        {n.body}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(n.time, { addSuffix: true })}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                          className="text-[10px] font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1 active:scale-95 transition"
                        >
                          <Trash2 className="h-3 w-3" /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {filtered.length > 0 && (
        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Tap a notification to mark as read
        </p>
      )}
    </div>
  );
}
