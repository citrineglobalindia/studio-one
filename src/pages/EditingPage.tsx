import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Scissors, Plus, Pencil, Trash2, Loader2, Search, Filter, FilterX,
  Clock, AlertTriangle, CheckCircle2, Camera, Video, Film, Sparkles,
  Layers, Wand2, Image as ImageIcon, Calendar as CalendarIcon, X, ArrowRight,
  Hourglass, Eye, Check, MessageSquare, UserCheck, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useEditingJobs, useEditors,
  EDITING_KINDS, EDITING_STATUSES, EDITING_PRIORITIES,
  type EditingJobRow, type EditingStatus, type DbEditingJob,
} from "@/hooks/useEditingJobs";
import { useClients } from "@/hooks/useClients";
import { useClientEvents } from "@/hooks/useEvents";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const KIND_ICON: Record<string, any> = {
  photo: Camera, video: Video, album: Layers, reel: Film, teaser: Sparkles,
  color_grading: Wand2, retouch: ImageIcon, other: Scissors,
};

const STATUS_META: Record<EditingStatus, { label: string; color: string; dot: string; icon: any }> = {
  pending:     { label: "Pending",      color: "bg-slate-500/10 text-slate-600 border-slate-500/30",       dot: "bg-slate-500", icon: Hourglass },
  in_progress: { label: "In Progress",  color: "bg-blue-500/10 text-blue-600 border-blue-500/30",          dot: "bg-blue-500", icon: Clock },
  review:      { label: "In Review",    color: "bg-amber-500/10 text-amber-700 border-amber-500/30",       dot: "bg-amber-500", icon: Eye },
  revisions:   { label: "Revisions",    color: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30", dot: "bg-fuchsia-500", icon: MessageSquare },
  completed:   { label: "Completed",    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500", icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",    color: "bg-rose-500/10 text-rose-600 border-rose-500/30",          dot: "bg-rose-500", icon: X },
};

const PRIO_META: Record<string, { color: string; label: string; icon: any }> = {
  low:    { color: "text-slate-500",   label: "Low",    icon: ArrowRight },
  normal: { color: "text-blue-500",    label: "Normal", icon: ArrowRight },
  high:   { color: "text-amber-500",   label: "High",   icon: AlertTriangle },
  urgent: { color: "text-rose-500",    label: "Urgent", icon: Flame },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function daysLeft(deadline?: string | null) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function EditingPage() {
  const { currentRole } = useRole();
  const { user } = useAuth();
  const canManage = currentRole === "admin" || currentRole === "administrator";
  const allowed = canManage || currentRole === "editor" || currentRole === "accounts";
  const { jobs, isLoading, add, update, setStatus, remove } = useEditingJobs();

  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditingJobRow | null | undefined>(undefined);

  const filtered = useMemo(() => {
    let list = jobs;
    if (filterStatus !== "all") list = list.filter(j => j.status === filterStatus);
    if (filterAssignee !== "all") {
      if (filterAssignee === "me") list = list.filter(j => j.assigned_to === user?.id);
      else if (filterAssignee === "unassigned") list = list.filter(j => !j.assigned_to);
      else list = list.filter(j => j.assigned_to === filterAssignee);
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(j =>
      [j.title, j.description, j.kind, j.client?.name, j.client?.partner_name, j.event?.name, j.assignee?.display_name]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
    return list;
  }, [jobs, filterStatus, filterAssignee, search, user?.id]);

  const stats = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of EDITING_STATUSES) m[s] = 0;
    for (const j of jobs) m[j.status] = (m[j.status] || 0) + 1;
    return m;
  }, [jobs]);

  const overdueCount = useMemo(
    () => jobs.filter(j => j.deadline && new Date(j.deadline) < new Date() && j.status !== "completed" && j.status !== "cancelled").length,
    [jobs]
  );
  const activeFilterCount = [filterStatus !== "all", filterAssignee !== "all", search.trim()].filter(Boolean).length;

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Scissors className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Editing is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator, Editor and Accounts can view editing jobs.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-500/5 border border-fuchsia-500/30 flex items-center justify-center shadow-sm">
              <Scissors className="h-6 w-6 text-fuchsia-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Production</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Editing</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canManage ? "Assign edits to your team and track progress to deadline" : "Your editing assignments"}
              </p>
            </div>
          </div>
          {canManage && (
            <Button onClick={() => setEditing(null)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Assign edit</Button>
          )}
        </div>
      </motion.div>

      {/* KPI strip — clickable filters */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {EDITING_STATUSES.map(s => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const n = stats[s] || 0;
          const active = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(active ? "all" : s)}
              className={"rounded-xl border bg-card p-3 text-left transition hover:border-border " + (active ? "ring-2 ring-primary border-primary" : "border-border/80")}>
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">{n}</p>
            </button>
          );
        })}
      </div>

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <p className="text-xs font-medium text-rose-700">
            <span className="font-bold">{overdueCount}</span> editing job{overdueCount === 1 ? "" : "s"} past the deadline
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, client, assignee…" className="pl-9 h-9" />
        </div>
        {canManage && (
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-9 w-full sm:w-48 text-xs"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {Array.from(new Map(jobs.filter(j => j.assigned_to).map(j => [j.assigned_to, j.assignee])).entries()).map(([uid, a]) => (
                <SelectItem key={uid as string} value={uid as string}>{a?.display_name || uid}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!canManage && currentRole === "editor" && (
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="me">My work</SelectItem>
              <SelectItem value="all">All visible</SelectItem>
            </SelectContent>
          </Select>
        )}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterAssignee("all"); }} className="h-9 gap-1.5 text-xs">
            <FilterX className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["kanban", "table"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (view === v ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Scissors className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No editing jobs match your filters</p>
        </div>
      ) : view === "kanban" ? (
        <KanbanView jobs={filtered} canManage={canManage} onOpen={(j) => setEditing(j)} onStatus={(id, s) => setStatus.mutate({ id, status: s })} />
      ) : (
        <TableView jobs={filtered} canManage={canManage} onEdit={(j) => setEditing(j)} onDelete={(id) => { if (confirm("Delete this job?")) remove.mutate(id); }} />
      )}

      {editing !== undefined && (
        <JobDialog
          open onOpenChange={() => setEditing(undefined)}
          editing={editing}
          canManage={canManage}
          onSave={async (p) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...p } as any);
            else await add.mutateAsync(p as any);
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}

// ───────────────── KANBAN VIEW

function KanbanView({ jobs, canManage, onOpen, onStatus }: { jobs: EditingJobRow[]; canManage: boolean; onOpen: (j: EditingJobRow) => void; onStatus: (id: string, s: EditingStatus) => void }) {
  const cols: EditingStatus[] = ["pending", "in_progress", "review", "revisions", "completed"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      {cols.map(col => {
        const meta = STATUS_META[col];
        const cards = jobs.filter(j => j.status === col);
        return (
          <div key={col} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <span className={"h-2 w-2 rounded-full " + meta.dot} />
                <p className="text-xs font-semibold text-foreground capitalize">{meta.label}</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{cards.length}</Badge>
            </div>
            <div className="p-2 space-y-2 max-h-[65vh] overflow-y-auto">
              {cards.length === 0 && <p className="text-[10px] text-muted-foreground italic text-center py-4">No jobs</p>}
              {cards.map(j => <JobCard key={j.id} job={j} canManage={canManage} onOpen={() => onOpen(j)} onStatus={(s) => onStatus(j.id, s)} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JobCard({ job, canManage, onOpen, onStatus }: { job: EditingJobRow; canManage: boolean; onOpen: () => void; onStatus: (s: EditingStatus) => void }) {
  const KindIcon = KIND_ICON[job.kind] || Scissors;
  const Prio = PRIO_META[job.priority];
  const dl = daysLeft(job.deadline);
  const overdue = dl !== null && dl < 0 && job.status !== "completed" && job.status !== "cancelled";

  return (
    <div className="rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 transition group">
      <button onClick={onOpen} className="w-full text-left">
        <div className="flex items-start gap-2">
          <div className="h-7 w-7 rounded-md bg-fuchsia-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <KindIcon className="h-3.5 w-3.5 text-fuchsia-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{job.title}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {job.client && <span className="text-[10px] text-muted-foreground truncate">{job.client.name}{job.client.partner_name ? ` & ${job.client.partner_name}` : ""}</span>}
              <Prio.icon className={"h-3 w-3 " + Prio.color} />
            </div>
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {job.assignee?.display_name && (
            <span className="inline-flex items-center gap-1"><UserCheck className="h-2.5 w-2.5" /> {job.assignee.display_name.split(" ")[0]}</span>
          )}
        </div>
        {job.deadline && (
          <span className={"text-[10px] tabular-nums " + (overdue ? "text-rose-600 font-semibold" : "text-muted-foreground")}>
            {overdue ? `${Math.abs(dl!)}d over` : dl === 0 ? "today" : `${dl}d`}
          </span>
        )}
      </div>
      {/* status quick actions */}
      <div className="flex items-center gap-1 mt-1.5">
        {(() => {
          const next: Record<EditingStatus, EditingStatus | null> = {
            pending: "in_progress", in_progress: "review", review: "completed",
            revisions: "in_progress", completed: null, cancelled: null,
          };
          const n = next[job.status];
          if (!n) return null;
          const canAct = canManage || job.status === "in_progress" || job.status === "review" || job.status === "revisions" || job.status === "pending";
          return canAct ? (
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onStatus(n); }} className="h-6 text-[10px] px-2 gap-1 flex-1">
              <Check className="h-3 w-3" /> Move to {STATUS_META[n].label}
            </Button>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ───────────────── TABLE VIEW

function TableView({ jobs, canManage, onEdit, onDelete }: { jobs: EditingJobRow[]; canManage: boolean; onEdit: (j: EditingJobRow) => void; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed min-w-[1100px]">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Job</th>
              <th className="text-left px-3 py-3 font-semibold">Client</th>
              <th className="text-left px-3 py-3 font-semibold">Assignee</th>
              <th className="text-left px-3 py-3 font-semibold">Deadline</th>
              <th className="text-left px-3 py-3 font-semibold">Priority</th>
              <th className="text-left px-3 py-3 font-semibold">Status</th>
              <th className="text-right px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map(j => {
              const KindIcon = KIND_ICON[j.kind] || Scissors;
              const Prio = PRIO_META[j.priority];
              const dl = daysLeft(j.deadline);
              const overdue = dl !== null && dl < 0 && j.status !== "completed" && j.status !== "cancelled";
              const sMeta = STATUS_META[j.status];
              return (
                <tr key={j.id} className="hover:bg-muted/20 align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="h-7 w-7 rounded-md bg-fuchsia-500/10 flex items-center justify-center shrink-0 mt-0.5"><KindIcon className="h-3.5 w-3.5 text-fuchsia-600" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{j.title}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{j.kind.replace("_", " ")}{j.event?.name ? ` · ${j.event.name}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs truncate">{j.client?.name ? `${j.client.name}${j.client.partner_name ? ` & ${j.client.partner_name}` : ""}` : "—"}</td>
                  <td className="px-3 py-3 text-xs truncate">{j.assignee?.display_name || <span className="text-muted-foreground italic">unassigned</span>}</td>
                  <td className="px-3 py-3 text-xs tabular-nums">
                    {j.deadline ? (
                      <div className={overdue ? "text-rose-600 font-semibold" : "text-foreground"}>
                        {fmtDate(j.deadline)}
                        <p className="text-[10px] opacity-70">{overdue ? `${Math.abs(dl!)} day${Math.abs(dl!)===1?"":"s"} overdue` : dl === 0 ? "today" : `in ${dl} day${dl===1?"":"s"}`}</p>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={"inline-flex items-center gap-1 text-[11px] " + Prio.color}><Prio.icon className="h-3 w-3" />{Prio.label}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={"text-[10px] capitalize " + sMeta.color}>{sMeta.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(j)} title="Open"><Pencil className="h-3.5 w-3.5" /></Button>
                      {canManage && <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => onDelete(j.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ───────────────── DIALOG

function JobDialog({ open, onOpenChange, editing, canManage, onSave }: { open: boolean; onOpenChange: () => void; editing: EditingJobRow | null; canManage: boolean; onSave: (p: Partial<DbEditingJob>) => Promise<void> }) {
  const { clients } = useClients();
  const editorsRes = useEditors();
  const editors = editorsRes.data ?? [];
  const isEdit = !!editing;
  const editorOnly = !canManage; // editor can only update status/notes

  const [form, setForm] = useState<any>({
    title: editing?.title || "",
    kind: editing?.kind || "photo",
    description: editing?.description || "",
    client_id: editing?.client_id || null,
    event_id: editing?.event_id || null,
    assigned_to: editing?.assigned_to || null,
    deadline: editing?.deadline || "",
    priority: editing?.priority || "normal",
    status: editing?.status || "pending",
    editor_notes: editing?.editor_notes || "",
    review_notes: editing?.review_notes || "",
    raw_files_url: editing?.raw_files_url || "",
    output_files_url: editing?.output_files_url || "",
  });
  const { events } = useClientEvents(form.client_id || undefined);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!form.title?.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload: any = editorOnly ? {
        status: form.status, editor_notes: form.editor_notes || null,
      } : {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        deadline: form.deadline || null,
        editor_notes: form.editor_notes?.trim() || null,
        review_notes: form.review_notes?.trim() || null,
        raw_files_url: form.raw_files_url?.trim() || null,
        output_files_url: form.output_files_url?.trim() || null,
      };
      await onSave(payload);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-fuchsia-500" />
            {isEdit ? (editorOnly ? "Update job" : "Edit job") : "Assign edit"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Title *">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} disabled={editorOnly} placeholder="e.g. Wedding highlights reel" />
          </Field>

          {!editorOnly && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EDITING_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EDITING_PRIORITIES.map(p => <SelectItem key={p} value={p}>{PRIO_META[p].label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Client">
                  <Select value={form.client_id || "_"} onValueChange={(v) => { set("client_id", v === "_" ? null : v); set("event_id", null); }}>
                    <SelectTrigger><SelectValue placeholder="— pick client —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— no client —</SelectItem>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}{c.partner_name ? ` & ${c.partner_name}` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Event (optional)">
                  <Select value={form.event_id || "_"} onValueChange={(v) => set("event_id", v === "_" ? null : v)} disabled={!form.client_id || events.length === 0}>
                    <SelectTrigger><SelectValue placeholder={form.client_id ? "— pick event —" : "pick a client first"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— no event —</SelectItem>
                      {events.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.name || e.event_type} · {fmtDate(e.event_date)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Assign to editor">
                  <Select value={form.assigned_to || "_"} onValueChange={(v) => set("assigned_to", v === "_" ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="— pick editor —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— unassigned —</SelectItem>
                      {editors.map(ed => <SelectItem key={ed.user_id} value={ed.user_id}>{ed.display_name || ed.user_id}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Deadline">
                  <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                </Field>
              </div>

              <Field label="Description / brief">
                <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Style, references, must-haves…" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Raw files URL">
                  <Input value={form.raw_files_url} onChange={(e) => set("raw_files_url", e.target.value)} placeholder="Google Drive / Dropbox link" />
                </Field>
                <Field label="Output URL">
                  <Input value={form.output_files_url} onChange={(e) => set("output_files_url", e.target.value)} placeholder="Final delivery link" />
                </Field>
              </div>
            </>
          )}

          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EDITING_STATUSES.map(s => (
                  <SelectItem key={s} value={s}>
                    <span className="inline-flex items-center gap-2">
                      <span className={"h-2 w-2 rounded-full " + STATUS_META[s].dot} />
                      {STATUS_META[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={canManage ? "Editor's notes" : "Your notes"}>
            <Textarea rows={2} value={form.editor_notes} onChange={(e) => set("editor_notes", e.target.value)} placeholder={canManage ? "Notes left by the editor" : "Progress notes, blockers…"} />
          </Field>

          {canManage && (
            <Field label="Review notes (admin/administrator)">
              <Textarea rows={2} value={form.review_notes} onChange={(e) => set("review_notes", e.target.value)} placeholder="Feedback for revisions" />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{isEdit ? "Save" : "Assign"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
