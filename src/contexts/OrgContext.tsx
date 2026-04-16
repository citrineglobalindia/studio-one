import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  team_size: string | null;
  primary_color: string | null;
  city: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
}

interface Subscription {
  id: string;
  status: string;
  trial_ends_at: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    max_clients: number;
    max_projects: number;
    max_team_members: number;
    features: string[];
  } | null;
}

interface OrgContextType {
  organization: Organization | null;
  subscription: Subscription | null;
  orgLoading: boolean;
  hasOrg: boolean;
  canAccess: (feature: string) => boolean;
  isWithinLimit: (resource: "clients" | "projects" | "team", count: number) => boolean;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
  organization: null,
  subscription: null,
  orgLoading: true,
  hasOrg: false,
  canAccess: () => true,
  isWithinLimit: () => true,
  refreshOrg: async () => {},
});

export const useOrg = () => useContext(OrgContext);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);

  const fetchOrg = async () => {
    if (!user) {
      setOrganization(null);
      setSubscription(null);
      setOrgLoading(false);
      return;
    }

    setOrgLoading(true);

    try {
      const impersonatedOrgId = typeof window !== "undefined"
        ? localStorage.getItem("sa_impersonate_org")
        : null;

      const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
        _user_id: user.id,
      });

      let targetOrgId = impersonatedOrgId && isSuperAdmin ? impersonatedOrgId : null;

      if (!targetOrgId) {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        targetOrgId = membership?.organization_id ?? null;
      }

      if (!targetOrgId) {
        setOrganization(null);
        setSubscription(null);
        setOrgLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", targetOrgId)
        .maybeSingle();

      setOrganization((org as Organization | null) ?? null);

      if (!org) {
        setSubscription(null);
        setOrgLoading(false);
        return;
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, status, trial_ends_at, plan_id")
        .eq("organization_id", org.id)
        .maybeSingle();

      if (!sub) {
        setSubscription(null);
        setOrgLoading(false);
        return;
      }

      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", sub.plan_id)
        .maybeSingle();

      setSubscription({
        ...sub,
        plan: plan
          ? {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              max_clients: plan.max_clients ?? -1,
              max_projects: plan.max_projects ?? -1,
              max_team_members: plan.max_team_members ?? -1,
              features: (plan.features as string[]) || [],
            }
          : null,
      });
    } catch (err) {
      console.error("Error fetching org:", err);
      setOrganization(null);
      setSubscription(null);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [user]);

  const canAccess = (feature: string): boolean => {
    if (!subscription?.plan) return true;
    return subscription.plan.features.some((f) => f.toLowerCase().includes(feature.toLowerCase()));
  };

  const isWithinLimit = (resource: "clients" | "projects" | "team", count: number): boolean => {
    if (!subscription?.plan) return true;
    const limits: Record<string, number> = {
      clients: subscription.plan.max_clients,
      projects: subscription.plan.max_projects,
      team: subscription.plan.max_team_members,
    };
    const limit = limits[resource];
    return limit === -1 || count < limit;
  };

  return (
    <OrgContext.Provider
      value={{
        organization,
        subscription,
        orgLoading,
        hasOrg: !!organization,
        canAccess,
        isWithinLimit,
        refreshOrg: fetchOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}
