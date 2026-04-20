import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface TaskRow {
  id: string;
  organization_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_role: string | null;
  due_date: string | null;
  progress: number;
  subtasks: { id: string; title: string; done: boolean }[];
  comments: { id: string; author: string; text: string; date: string }[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInput = Omit<TaskRow, "id" | "organization_id" | "created_by" | "created_at" | "updated_at">;

export function useTasks() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["tasks", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TaskRow[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (input: TaskInput) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...input, organization_id: orgId, created_by: user?.id ?? null } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", orgId] }); toast.success("Task created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskRow> & { id: string }) => {
      const { data, error } = await supabase.from("tasks").update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", orgId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", orgId] }); toast.success("Task deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    addTask, updateTask, deleteTask,
  };
}
