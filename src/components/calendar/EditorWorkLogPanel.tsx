import { useMemo, useState } from "react";
import { ClipboardList, Plus, Trash2, Check, Loader2, Pencil, X, Palette, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditorWorkLogs, WORK_LOG_STATUSES, WORK_TYPES, type DbWorkLog, type WorkLogStatus } from "@/hooks/useEditorWorkLogs";

const STATUS_META: Record<WorkLogStatus, { label: string; cls: string }> = {
  pending:     { label: "Pending",     cls: "bg-slate-500/10 text-slate-600 border-slate-500/30" },
  in_progress: { label: "In progress", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  absent:      { label: "Absent",      cls: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
  on_leave:    { label: "On leave",    cls: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
};

export function EditorWorkLogPanel({ dateIso, canManage, role, userId }: {
  dateIso: string; canManage: boolean; role?: string; userId?: string | null;
}) {
  const { logs, isLoading, add, update, remove, send } = useEditorWorkLogs(dateIso);
  const [adding, setAdding] = useState(false);

  const isManager = canManage; // admin / administrator
  const isEditor = role === "editor";
  const canAdd = isManager || isEditor;
  const showActionsCol = isManager || isEditor;

  const grouped = useMemo(() => {
    const m = new Map<string, DbWorkLog[]>();
    for (const l of logs) { if (!m.has(l.editor_code)) m.set(l.editor_code, []); m.get(l.editor_code)!.push(l); }
    return Array.from(m.entries());
  }, [logs]);

  const dayTotal = logs.reduce((s, l) => s + Number(l.work_count || 0), 0);

  // Per-row capabilities
  const ownRow = (l: DbWorkLog) => isEditor && userId && l.created_by === userId;
  const canEditRow = (l: DbWorkLog) => isManager || (!!ownRow(l) && !l.submitted);
  const canDeleteRow = () => isManager; // editors can never delete
  const canSendRow = (l: DbWorkLog) => !!ownRow(l) && !l.submitted;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-fuchsia-500/10 flex items-center justify-center"><ClipboardList className="h-4 w-4 text-fuchsia-600" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">Editor work log</p>
            <p className="text-[10px] text-muted-foreground">{logs.length} entr{logs.length === 1 ? "y" : "ies"} · {dayTotal} items total{isEditor ? " · your entries" : ""}</p>
          </div>
        </div>
        {canAdd && <Button size="sm" onClick={() => setAdding(true)} className="h-7 gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Add</Button>}
      </div>

      {isLoading ? (
        <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : logs.length === 0 && !adding ? (
        <div className="py-10 text-center">
          <ClipboardList className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No editor logs for this day</p>
          {canAdd && <button onClick={() => setAdding(true)} className="text-xs text-primary hover:underline mt-1">Add the first entry</button>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Editor</th>
                <th className="text-left px-2 py-2 font-semibold">Client</th>
                <th className="text-left px-2 py-2 font-semibold">Work</th>
                <th className="text-right px-2 py-2 font-semibold">Count</th>
                <th className="text-right px-2 py-2 font-semibold">Total</th>
                <th className="text-center px-2 py-2 font-semibold">Done</th>
                <th className="text-left px-2 py-2 font-semibold">Status</th>
                <th className="text-left px-2 py-2 font-semibold">Notes</th>
                {showActionsCol && <th className="px-2 py-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.map(([code, rows]) => {
                const editorTotal = rows.reduce((s, r) => s + Number(r.work_count || 0), 0);
                return rows.map((l, idx) => (
                  <LogRow key={l.id} log={l} showActionsCol={showActionsCol} showEditor={idx === 0}
                    editorRowSpan={rows.length} editorTotal={editorTotal} showTotal={idx === 0}
                    canEdit={canEditRow(l)} canDelete={canDeleteRow()} canSend={canSendRow(l)}
                    onUpdate={(p) => update.mutate({ id: l.id, ...p })} onRemove={() => remove.mutate(l.id)}
                    onSend={() => { if (window.confirm("Send this entry to admin? You won't be able to edit it after sending.")) send.mutate(l.id); }} />
                ));
              })}
              {adding && <AddRow dateIso={dateIso} submittedDefault={isManager} onCancel={() => setAdding(false)} onSave={async (p) => { await add.mutateAsync(p as any); setAdding(false); }} />}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LogRow({ log, showActionsCol, showEditor, editorRowSpan, editorTotal, showTotal, canEdit, canDelete, canSend, onUpdate, onRemove, onSend }: {
  log: DbWorkLog; showActionsCol: boolean; showEditor: boolean; editorRowSpan: number; editorTotal: number; showTotal: boolean;
  canEdit: boolean; canDelete: boolean; canSend: boolean;
  onUpdate: (p: Partial<DbWorkLog>) => void; onRemove: () => void; onSend: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ client_name: log.client_name || "", work_type: log.work_type || "", work_count: log.work_count, notes: log.notes || "" });
  const sMeta = STATUS_META[log.status];
  const save = () => { onUpdate({ client_name: draft.client_name || null, work_type: draft.work_type || null, work_count: Number(draft.work_count) || 0, notes: draft.notes || null }); setEditing(false); };

  return (
    <tr className={"hover:bg-muted/20 align-middle " + (log.submitted ? "" : "bg-amber-500/[0.04]")}>
      {showEditor ? (
        <td className="px-3 py-2 font-semibold text-foreground align-middle border-r border-border/50" rowSpan={editorRowSpan}>
          {log.editor_code}
          {log.editor_name && <p className="text-[10px] text-muted-foreground font-normal">{log.editor_name}</p>}
        </td>
      ) : null}
      <td className="px-2 py-2">{editing ? <Input value={draft.client_name} onChange={(e) => setDraft(d => ({ ...d, client_name: e.target.value }))} className="h-7 text-xs" /> : (log.client_name || "—")}</td>
      <td className="px-2 py-2">{editing ? (
        <Select value={draft.work_type} onValueChange={(v) => setDraft(d => ({ ...d, work_type: v }))}>
          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>{WORK_TYPES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
        </Select>
      ) : (log.work_type || "—")}</td>
      <td className="px-2 py-2 text-right tabular-nums">{editing ? <Input type="number" value={draft.work_count} onChange={(e) => setDraft(d => ({ ...d, work_count: Number(e.target.value) }))} className="h-7 text-xs text-right w-16 ml-auto" /> : (log.work_count || 0)}</td>
      {showTotal ? <td className="px-2 py-2 text-right tabular-nums font-semibold border-r border-border/50" rowSpan={editorRowSpan}>{editorTotal}</td> : null}
      <td className="px-2 py-2 text-center">
        <button disabled={!canEdit} onClick={() => canEdit && onUpdate({ is_done: !log.is_done })} className={"inline-flex " + (!canEdit ? "cursor-default" : "")}>
          <span className={"h-4 w-4 rounded border flex items-center justify-center " + (log.is_done ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40")}>
            {log.is_done && <Check className="h-3 w-3 text-white" />}
          </span>
        </button>
      </td>
      <td className="px-2 py-2">
        {canEdit ? (
          <Select value={log.status} onValueChange={(v) => onUpdate({ status: v as WorkLogStatus })}>
            <SelectTrigger className={"h-7 text-[11px] capitalize border w-[120px] " + sMeta.cls}><SelectValue /></SelectTrigger>
            <SelectContent>{WORK_LOG_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className={"text-[10px] capitalize " + sMeta.cls}>{sMeta.label}</Badge>
        )}
      </td>
      <td className="px-2 py-2">{editing ? <Input value={draft.notes} onChange={(e) => setDraft(d => ({ ...d, notes: e.target.value }))} className="h-7 text-xs" placeholder="e.g. Colour Grading" /> :
        (log.notes ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Palette className="h-3 w-3" />{log.notes}</span> : "—")}</td>
      {showActionsCol && (
        <td className="px-2 py-2 text-right whitespace-nowrap">
          {editing ? (
            <div className="inline-flex gap-0.5">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" onClick={save}><Check className="h-3.5 w-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-0.5 justify-end">
              {canSend && (
                <Button size="sm" variant="outline" className="h-6 gap-1 text-[10px] text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/10" onClick={onSend} title="Send to admin (locks this entry)">
                  <Send className="h-3 w-3" /> Send
                </Button>
              )}
              {log.submitted && !canEdit && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600" title="Sent — visible to admin"><Lock className="h-3 w-3" /> Sent</span>
              )}
              {canEdit && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}><Pencil className="h-3 w-3" /></Button>}
              {canDelete && <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>}
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

function AddRow({ dateIso, submittedDefault, onCancel, onSave }: { dateIso: string; submittedDefault: boolean; onCancel: () => void; onSave: (p: any) => Promise<void> }) {
  const [f, setF] = useState({ editor_code: "", editor_name: "", client_name: "", work_type: "", work_count: 0, status: "pending" as WorkLogStatus, notes: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!f.editor_code.trim()) return;
    setSaving(true);
    try {
      await onSave({ log_date: dateIso, editor_code: f.editor_code.trim(), editor_name: f.editor_name.trim() || null, client_name: f.client_name.trim() || null, work_type: f.work_type || null, work_count: Number(f.work_count) || 0, status: f.status, notes: f.notes.trim() || null, submitted: submittedDefault });
    } finally { setSaving(false); }
  };
  return (
    <tr className="bg-primary/5">
      <td className="px-3 py-2"><Input value={f.editor_code} onChange={(e) => setF(p => ({ ...p, editor_code: e.target.value }))} placeholder="LE-Name" className="h-7 text-xs" /></td>
      <td className="px-2 py-2"><Input value={f.client_name} onChange={(e) => setF(p => ({ ...p, client_name: e.target.value }))} placeholder="Client" className="h-7 text-xs" /></td>
      <td className="px-2 py-2">
        <Select value={f.work_type} onValueChange={(v) => setF(p => ({ ...p, work_type: v }))}>
          <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Work" /></SelectTrigger>
          <SelectContent>{WORK_TYPES.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="px-2 py-2"><Input type="number" value={f.work_count} onChange={(e) => setF(p => ({ ...p, work_count: Number(e.target.value) }))} className="h-7 text-xs text-right w-16 ml-auto" /></td>
      <td className="px-2 py-2"></td>
      <td className="px-2 py-2"></td>
      <td className="px-2 py-2">
        <Select value={f.status} onValueChange={(v) => setF(p => ({ ...p, status: v as WorkLogStatus }))}>
          <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
          <SelectContent>{WORK_LOG_STATUSES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="px-2 py-2"><Input value={f.notes} onChange={(e) => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Notes" className="h-7 text-xs" /></td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        <div className="inline-flex gap-0.5">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" onClick={save} disabled={saving || !f.editor_code.trim()}>{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}</Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </td>
    </tr>
  );
}
