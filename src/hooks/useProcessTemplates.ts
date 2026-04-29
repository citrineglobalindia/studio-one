import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface ProcessTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessTemplateStep {
  id: string;
  template_id: string;
  organization_id: string;
  step_order: number;
  name: string;
  description: string | null;
  responsible_role: string | null;
  default_eta_days: number | null;
  created_at: string;
}

/**
 * Workflow templates per studio (e.g. "Wedding Pipeline").
 * Apply a template to a project/client → creates concrete client_process_steps rows.
 */
export function useProcessTemplates() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const templates = useQuery({
    queryKey: ["process_templates", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_templates")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data || []) as any) as ProcessTemplate[];
    },
  });

  const allSteps = useQuery({
    queryKey: ["process_template_steps", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_template_steps")
        .select("*")
        .eq("organization_id", orgId!)
        .order("step_order", { ascending: true });
      if (error) throw error;
      return ((data || []) as any) as ProcessTemplateStep[];
    },
  });

  const stepsForTemplate = (templateId: string) =>
    (allSteps.data ?? []).filter(s => s.template_id === templateId);

  const createTemplate = useMutation({
    mutationFn: async (input: { name: string; description?: string | null; is_default?: boolean }) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("process_templates")
        .insert({
          organization_id: orgId,
          name: input.name,
          description: input.description ?? null,
          is_default: input.is_default ?? false,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["process_templates", orgId] });
      toast.success("Template created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("process_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["process_templates", orgId] });
      qc.invalidateQueries({ queryKey: ["process_template_steps", orgId] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStep = useMutation({
    mutationFn: async (input: Omit<ProcessTemplateStep, "id" | "organization_id" | "created_at">) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("process_template_steps")
        .insert({ ...input, organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["process_template_steps", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessTemplateStep> & { id: string }) => {
      const { error } = await supabase
        .from("process_template_steps")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["process_template_steps", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("process_template_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["process_template_steps", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  /** Materialise a template into concrete client_process_steps for a client. */
  const applyTemplateToClient = useMutation({
    mutationFn: async ({ templateId, clientId, baseDate }: { templateId: string; clientId: string; baseDate?: string }) => {
      if (!orgId) throw new Error("No organization");
      const steps = stepsForTemplate(templateId);
      if (steps.length === 0) throw new Error("Template has no steps");
      const rows = steps.map((s, idx) => {
        let due_date: string | null = null;
        if (baseDate && s.default_eta_days != null) {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + s.default_eta_days);
          due_date = d.toISOString().slice(0, 10);
        }
        return {
          organization_id: orgId,
          client_id: clientId,
          template_step_id: s.id,
          step_number: idx + 1,
          sequence: idx + 1,
          heading: s.name,
          description: s.description,
          responsible_role: s.responsible_role,
          due_date,
          status: "pending",
        };
      });
      const { error } = await supabase.from("client_process_steps").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["process-steps"] });
      toast.success("Pipeline applied to client");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    templates: templates.data ?? [],
    allSteps: allSteps.data ?? [],
    stepsForTemplate,
    isLoading: templates.isLoading || allSteps.isLoading,
    createTemplate,
    deleteTemplate,
    addStep,
    updateStep,
    deleteStep,
    applyTemplateToClient,
  };
}

/** All process steps across all clients (cross-project bottleneck view). */
export function useAllProcessSteps() {
  const { organization } = useOrg();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["all_process_steps", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_process_steps")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  return { steps: query.data ?? [], isLoading: query.isLoading };
}
