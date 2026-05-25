import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface DbTeamMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  full_name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  availability: string | null;
  rating: number | null;
  daily_rate: number | null;
  specialties: string[] | null;
  experience_years: number | null;
  notes: string | null;
}

export function useTeamMembers() {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["team-members", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbTeamMember[];
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", orgId)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbTeamMember[];
    },
  });

  return { members: query.data ?? [], isLoading: query.isLoading };
}
