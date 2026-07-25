import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface ClientProductivity {
  id?: string;
  client_id: string;
  traditional_photo: boolean;
  traditional_video: boolean;
  candid_photo: boolean;
  candid_video: boolean;
  album: boolean;
  updated_at?: string;
}

export const PRODUCTIVITY_ITEMS: { key: keyof ClientProductivity; label: string }[] = [
  { key: "traditional_photo", label: "Traditional Photo" },
  { key: "traditional_video", label: "Traditional Video" },
  { key: "candid_photo", label: "Candid Photo" },
  { key: "candid_video", label: "Candid Video" },
  { key: "album", label: "Album" },
];

export function useClientProductivity() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-productivity", orgId],
    enabled: !!orgId,
    staleTime: 10_000,
    queryFn: async () => {
      if (!orgId) return new Map<string, ClientProductivity>();
      const { data, error } = await (supabase as any)
        .from("client_productivity")
        .select("*")
        .eq("organization_id", orgId);
      if (error) throw error;
      const map = new Map<string, ClientProductivity>();
      for (const r of (data ?? []) as ClientProductivity[]) map.set(r.client_id, r);
      return map;
    },
  });

  const setFlag = useMutation({
    mutationFn: async ({ clientId, key, value, current }: {
      clientId: string; key: keyof ClientProductivity; value: boolean; current?: ClientProductivity;
    }) => {
      if (!orgId) throw new Error("No studio");
      const base = current ?? {
        client_id: clientId,
        traditional_photo: false, traditional_video: false,
        candid_photo: false, candid_video: false, album: false,
      };
      const row: any = {
        organization_id: orgId,
        client_id: clientId,
        traditional_photo: base.traditional_photo,
        traditional_video: base.traditional_video,
        candid_photo: base.candid_photo,
        candid_video: base.candid_video,
        album: base.album,
        [key]: value,
        updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from("client_productivity")
        .upsert(row, { onConflict: "client_id" });
      if (error) throw error;
    },
    // Optimistic update for snappy checkboxes
    onMutate: async ({ clientId, key, value, current }) => {
      await qc.cancelQueries({ queryKey: ["client-productivity", orgId] });
      const prev = qc.getQueryData<Map<string, ClientProductivity>>(["client-productivity", orgId]);
      const next = new Map(prev ?? []);
      const existing = current ?? next.get(clientId) ?? {
        client_id: clientId,
        traditional_photo: false, traditional_video: false,
        candid_photo: false, candid_video: false, album: false,
      };
      next.set(clientId, { ...existing, [key]: value } as ClientProductivity);
      qc.setQueryData(["client-productivity", orgId], next);
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["client-productivity", orgId], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["client-productivity", orgId] }),
  });

  return { byClient: query.data ?? new Map<string, ClientProductivity>(), isLoading: query.isLoading, setFlag };
}
