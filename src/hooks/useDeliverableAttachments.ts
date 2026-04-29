import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DeliverableAttachment {
  id: string;
  organization_id: string;
  deliverable_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  notes: string | null;
  created_at: string;
}

export function useDeliverableAttachments(deliverableId?: string) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["deliverable_attachments", orgId, deliverableId],
    enabled: !!orgId && !!deliverableId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliverable_attachments")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("deliverable_id", deliverableId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as any) as DeliverableAttachment[];
    },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, notes }: { file: File; notes?: string }) => {
      if (!orgId || !deliverableId) throw new Error("Missing context");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${orgId}/${deliverableId}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("editor-uploads")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("editor-uploads").getPublicUrl(path);

      const { data, error } = await supabase
        .from("deliverable_attachments")
        .insert({
          organization_id: orgId,
          deliverable_id: deliverableId,
          uploaded_by: user?.id ?? null,
          file_name: file.name,
          file_path: path,
          file_url: pub.publicUrl,
          file_type: file.type || null,
          file_size: file.size,
          notes: notes || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliverable_attachments", orgId] });
      toast.success("File uploaded");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachment: DeliverableAttachment) => {
      // Best-effort storage cleanup
      await supabase.storage.from("editor-uploads").remove([attachment.file_path]);
      const { error } = await supabase
        .from("deliverable_attachments")
        .delete()
        .eq("id", attachment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deliverable_attachments", orgId] });
      toast.success("File removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    attachments: query.data ?? [],
    isLoading: query.isLoading,
    uploadFile,
    deleteAttachment,
  };
}
