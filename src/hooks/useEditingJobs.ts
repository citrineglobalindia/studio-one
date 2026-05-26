import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

export type EditingKind = "photo" | "video" | "album" | "reel" | "teaser" | "color_grading" | "retouch" | "other";
export type EditingStatus = "pending" | "in_progress" | "review" | "revisions" | "completed" | "cancelled";
export type EditingPriority = "low" | "normal" | "high" | "urgent";

export const EDITING_KINDS: { value: EditingKind; label: string }[] = [
  { value: "photo", label: "Photo edit" },
  { value: "video", label: "Video edit" },
  { value: "album", label: "Album design" },
  { value: "reel", label: "Reel" },
  { value: "teaser", label: "Teaser" },
  { value: "color_grading", label: "Color grading" },
  { value: "retouch", label: "Retouch" },
  { value: "other", label: "Other" },
];
export const EDITING_STATUSES: EditingStatus[] = ["pending", "in_progress", "review", "revisions", "completed", "cancelled"];
export const EDITING_PRIORITIES: EditingPriority[] = ["low", "normal", "high", "urgent"];

export interface DbEditingJob {
  id: string;
  organization_id: string;
  client_id: string | null;
  event_id: string | null;
  title: string;
  kind: EditingKind;
  description: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  deadline: string | null;
  priority: EditingPriority;
  status: EditingStatus;
  started_at: string | null;
  completed_at: string | null;
  editor_notes: string | null;
  review_notes: string | null;
  raw_files_url: string | null;
  output_files_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditingJobRow extends DbEditingJob {
  client?: { id: string; name: string; partner_name: string | null } | null;
  event?: { id: string; name: string | null; event_type: string | null; event_date: string | null } | null;
  assignee?: { user_id: string; display_name: string | null; role: string | null } | null;
}

export function useEditingJobs() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["editing-jobs", orgId, currentRole, user?.id ?? null],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as EditingJobRow[];
      // RLS will filter rows. We just join client + event + assignee profile.
      const { data, error } = await (supabase as any)
        .from("editing_jobs")
        .select(`
          *,
          client:clients(id,name,partner_name),
          event:events(id,name,event_type,event_date)
        `)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as EditingJobRow[];
      // Fetch assignee profiles in one go
      const assigneeIds = Array.from(new Set(rows.map(r => r.assigned_to).filter(Boolean) as string[]));
      let profileMap = new Map<string, { display_name: string | null; role: string | null }>();
      if (assigneeIds.length) {
        const pr = await (supabase as any).from("profiles").select("user_id,display_name,role").in("user_id", assigneeIds);
        for (const p of (pr.data ?? [])) profileMap.set(p.user_id, { display_name: p.display_name, role: p.role });
      }
      return rows.map(r => ({
        ...r,
        assignee: r.assigned_to ? { user_id: r.assigned_to, ...(profileMap.get(r.assigned_to) ?? { display_name: null, role: null }) } : null,
      }));
    },
  });

  const add = useMutation({
    mutationFn: async (p: Partial<DbEditingJob> & { title: string }) => {
      if (!orgId) throw new Error("No studio");
      const row = {
        ...p,
        organization_id: orgId,
        assigned_by: user?.id ?? null,
        assigned_at: p.assigned_to ? new Date().toISOString() : null,
      };
      const { error } = await (supabase as any).from("editing_jobs").insert(row);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editing-jobs"] }); toast.success("Job assigned"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...p }: Partial<DbEditingJob> & { id: string }) => {
      const { error } = await (supabase as any).from("editing_jobs").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["editing-jobs"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EditingStatus }) => {
      const patch: any = { status };
      if (status === "in_progress" && !query.data?.find(j => j.id === id)?.started_at) patch.started_at = new Date().toISOString();
      if (status === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await (supabase as any).from("editing_jobs").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editing-jobs"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("editing_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["editing-jobs"] }); toast.success("Job deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    jobs: query.data ?? [],
    isLoading: query.isLoading,
    add, update, setStatus, remove,
  };
}

// List of editors (and admins/administrators who could also edit) eligible to assign jobs to
export function useEditors() {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  return useQuery({
    queryKey: ["editors-for-assignment", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as Array<{ user_id: string; display_name: string | null; role: string }>;
      // Find org members whose role is editor
      const omRes = await (supabase as any).from("organization_members")
        .select("user_id, role").eq("organization_id", orgId).eq("role", "editor");
      const ids = (omRes.data ?? []).map((r: any) => r.user_id);
      if (!ids.length) return [];
      const pr = await (supabase as any).from("profiles").select("user_id, display_name, role").in("user_id", ids);
      return (pr.data ?? []) as Array<{ user_id: string; display_name: string | null; role: string }>;
    },
  });
}
