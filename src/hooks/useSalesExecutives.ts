import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface SalesExecutive {
  user_id: string;
  name: string;
  role: string;
}

// Roles that can own / be assigned a lead.
const SALES_ROLES = ["telecaller", "admin", "administrator", "accounts"];

/**
 * Authoritative list of people a lead can be assigned to.
 * Sourced from organization_members -> profiles.role (the real app role),
 * NOT team_members.role (which can be stale or hold a job title).
 */
export function useSalesExecutives() {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["sales-executives", orgId],
    enabled: !!orgId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!orgId) return [] as SalesExecutive[];

      // 1) Everyone in this studio
      const { data: members, error: mErr } = await (supabase as any)
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId);
      if (mErr) throw mErr;
      const userIds = (members ?? []).map((m: any) => m.user_id).filter(Boolean);
      if (userIds.length === 0) return [] as SalesExecutive[];

      // 2) Their real role + display name
      const { data: profs, error: pErr } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, role")
        .in("user_id", userIds);
      if (pErr) throw pErr;

      // 3) Nicer names from team_members where available
      const { data: tms } = await (supabase as any)
        .from("team_members")
        .select("user_id, full_name")
        .eq("organization_id", orgId)
        .in("user_id", userIds);
      const nameByUser = new Map<string, string>();
      for (const t of tms ?? []) if (t.user_id && t.full_name) nameByUser.set(t.user_id, t.full_name);

      const execs: SalesExecutive[] = (profs ?? [])
        .filter((p: any) => SALES_ROLES.includes(String(p.role || "")))
        .map((p: any) => ({
          user_id: p.user_id,
          name: nameByUser.get(p.user_id) || p.display_name || "Unnamed",
          role: String(p.role || ""),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return execs;
    },
  });

  return { executives: query.data ?? [], isLoading: query.isLoading };
}
