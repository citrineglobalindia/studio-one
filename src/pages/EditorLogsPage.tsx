import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorWorkLogPanel } from "@/components/calendar/EditorWorkLogPanel";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function shift(iso: string, days: number) { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

export default function EditorLogsPage() {
  const { currentRole } = useRole();
  const { user } = useAuth();
  const canManage = currentRole === "admin" || currentRole === "administrator";
  const allowed = canManage || currentRole === "accounts" || currentRole === "editor";
  const [date, setDate] = useState<string>(todayIso());

  const nice = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Editor Logs is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator, Accounts and Editors can view editor logs.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-500/5 border border-fuchsia-500/30 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-fuchsia-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Production</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Editor Logs</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{nice}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9" title="Previous day" onClick={() => setDate(d => shift(d, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="relative">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value || todayIso())} className="h-9 pl-8 w-[150px] text-xs" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" title="Next day" onClick={() => setDate(d => shift(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setDate(todayIso())}>Today</Button>
          </div>
        </div>
      </motion.div>

      <EditorWorkLogPanel dateIso={date} canManage={canManage} role={currentRole} userId={user?.id ?? null} />
    </div>
  );
}
