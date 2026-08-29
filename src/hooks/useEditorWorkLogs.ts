import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type WorkLogStatus = "pending" | "in_progress" | "completed" | "absent" | "on_leave";
export const WORK_LOG_STATUSES: WorkLogStatus[] = ["pending", "in_progress", "completed", "absent", "on_leave"];

export const WORK_TYPES = [
  "Haldi", "Wedding", "Wedding Video", "Wedding Reel", "Reception", "Engagement",
  "Teaser", "Full Song", "Highlight", "Album", "Colour Grading", "Photo Edit", "Other",
];

export interface DbWorkLog {
  id: string;
  organization_id: string;
  log_date: string;
  editor_code: string;
  editor_name: string | null;
  user_id: string | null;
  client_name: string | null;
  work_type: string | null;
  work_count: number;
  hours: number;
  is_done: boolean;
  status: WorkLogStatus;
  notes: string | null;
  display_order: number;
  submitted: boolean;
  submitted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Logs for a single date (used by the calendar right panel) */
export function useEditorWorkLogs(dateIso: string | null) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["editor-work-logs", orgId, dateIso],
    enabled: !!orgId && !!dateIso,
    queryFn: async () => {
      if (!orgId || !dateIso) return [] as DbWorkLog[];
      const { data, error } = await (supabase as any)
        .from("editor_work_logs")
        .select("*")
        .eq("organization_id", orgId)
        .eq("log_date", dateIso)
        .order("display_order", { ascending: true })
        .order("editor_code", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DbWorkLog[];
    },
  });

  const add = useMutation({
    mutationFn: async (p: Partial<DbWorkLog> & { log_date: string; editor_code: string }) => {
      if (!orgId) throw new Error("No studio");
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await (supabase as any).from("editor_work_logs").insert({
        ...p, organization_id: orgId, created_by: uid, submitted: p.submitted ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editor-work-logs"] }); qc.invalidateQueries({ queryKey: ["editor-work-logs-range"] }); toast.success("Row added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...p }: Partial<DbWorkLog> & { id: string }) => {
      const { error } = await (supabase as any).from("editor_work_logs").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editor-work-logs"] }); qc.invalidateQueries({ queryKey: ["editor-work-logs-range"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("editor_work_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editor-work-logs"] }); qc.invalidateQueries({ queryKey: ["editor-work-logs-range"] }); toast.success("Row removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("editor_work_logs")
        .update({ submitted: true, submitted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editor-work-logs"] }); qc.invalidateQueries({ queryKey: ["editor-work-logs-range"] }); toast.success("Sent to admin"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { logs: query.data ?? [], isLoading: query.isLoading, add, update, remove, send };
}

/** Count of logs per date in a range — used to badge calendar day cells */
export function useWorkLogCountsByDate(fromIso: string, toIso: string) {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  return useQuery({
    queryKey: ["editor-work-logs-range", orgId, fromIso, toIso],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return {} as Record<string, number>;
      const { data, error } = await (supabase as any)
        .from("editor_work_logs")
        .select("log_date")
        .eq("organization_id", orgId)
        .gte("log_date", fromIso)
        .lte("log_date", toIso);
      if (error) throw error;
      const m: Record<string, number> = {};
      for (const r of (data ?? [])) m[r.log_date] = (m[r.log_date] || 0) + 1;
      return m;
    },
  });
}


/** Per-editor aggregate (hours, work count, entries) across a date range — Admin/HR summary. */
export interface WorkLogEditorSummary { editor_code: string; editor_name: string | null; hours: number; work_count: number; entries: number; }
export function useWorkLogSummary(fromIso: string, toIso: string) {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  return useQuery({
    queryKey: ["editor-work-logs-summary", orgId, fromIso, toIso],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as WorkLogEditorSummary[];
      const { data, error } = await (supabase as any)
        .from("editor_work_logs")
        .select("*")
        .eq("organization_id", orgId)
        .gte("log_date", fromIso)
        .lte("log_date", toIso);
      if (error) throw error;
      const m = new Map<string, WorkLogEditorSummary>();
      for (const r of (data ?? [])) {
        const key = r.editor_code || "-";
        const cur = m.get(key) || { editor_code: key, editor_name: r.editor_name ?? null, hours: 0, work_count: 0, entries: 0 };
        cur.hours += Number(r.hours || 0);
        cur.work_count += Number(r.work_count || 0);
        cur.entries += 1;
        if (!cur.editor_name && r.editor_name) cur.editor_name = r.editor_name;
        m.set(key, cur);
      }
      return Array.from(m.values()).sort((a, b) => b.hours - a.hours || b.work_count - a.work_count);
    },
  });
}
