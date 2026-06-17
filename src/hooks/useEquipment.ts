import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface EquipmentItem {
  name: string;
  issued: boolean;
  returned: boolean;
}

export interface DbEquipmentLog {
  id: string;
  organization_id: string;
  client_id: string | null;
  event_id: string | null;
  responsible_person: string | null;
  responsible_user_id: string | null;
  items: EquipmentItem[];
  status: "issued" | "partial" | "returned" | string;
  notes: string | null;
  issued_at: string | null;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; name: string; partner_name: string | null } | null;
  event?: { id: string; name: string | null; event_type: string | null; event_date: string | null } | null;
}

// Common photography gear presets to speed up checklist creation.
export const EQUIPMENT_PRESETS = [
  "DSLR Body", "Mirrorless Body", "Prime Lens", "Zoom Lens", "Drone",
  "Gimbal", "Tripod", "Monopod", "Flash / Speedlight", "LED Light",
  "Light Stand", "Reflector", "Memory Cards", "Batteries", "Charger",
  "Audio Recorder", "Mic", "Laptop", "Hard Disk", "Backdrop",
];

export function deriveStatus(items: EquipmentItem[]): "issued" | "partial" | "returned" {
  const issued = items.filter((i) => i.issued);
  if (issued.length === 0) return "issued";
  const returned = issued.filter((i) => i.returned);
  if (returned.length === 0) return "issued";
  if (returned.length === issued.length) return "returned";
  return "partial";
}

export function useEquipment() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["equipment-logs", orgId],
    enabled: !!orgId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    queryFn: async () => {
      if (!orgId) return [] as DbEquipmentLog[];
      const { data, error } = await (supabase as any)
        .from("equipment_logs")
        .select("*, client:clients(id,name,partner_name), event:events(id,name,event_type,event_date)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbEquipmentLog[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbEquipmentLog>) => {
      if (!orgId) throw new Error("No studio");
      const items = (payload.items ?? []) as EquipmentItem[];
      const { data, error } = await (supabase as any)
        .from("equipment_logs")
        .insert({ ...payload, items, organization_id: orgId, status: deriveStatus(items) })
        .select().single();
      if (error) throw error;
      return data as DbEquipmentLog;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment-logs"] }); toast.success("Equipment log saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbEquipmentLog> & { id: string }) => {
      const body: any = { ...patch, updated_at: new Date().toISOString() };
      if (patch.items) {
        body.status = deriveStatus(patch.items as EquipmentItem[]);
        if (body.status === "returned" && !patch.returned_at) body.returned_at = new Date().toISOString();
      }
      const { error } = await (supabase as any).from("equipment_logs").update(body).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment-logs"] }); toast.success("Equipment log updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("equipment_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipment-logs"] }); toast.success("Equipment log removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { logs: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}
