import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface Project {
  id: string;
  organization_id: string;
  client_id: string | null;
  project_name: string;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  status: string;
  total_amount: number;
  amount_paid: number;
  assigned_team: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  client?: { name: string; partner_name: string | null; phone: string | null; city: string | null } | null;
}

export function useProjects() {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["projects", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("*, client:clients(name, partner_name, phone, city)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Project[];
    },
    enabled: !!orgId,
  });

  const addProject = useMutation({
    mutationFn: async (project: Omit<Project, "id" | "created_at" | "updated_at" | "client">) => {
      const { data, error } = await supabase.from("projects").insert(project).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast.success("Project created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, client, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase.from("projects").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast.success("Project updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", orgId] });
      toast.success("Project deleted!");
    },
    onError: (e) => toast.error(e.message),
  });

  return { projects: query.data || [], isLoading: query.isLoading, addProject, updateProject, deleteProject };
}
