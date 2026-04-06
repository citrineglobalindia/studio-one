import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  team_size: string;
  primary_color: string;
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

    try {
      // Get user's org membership
      const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) {
        setOrganization(null);
        setOrgLoading(false);
        return;
      }

      // Get org details
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .single();

      setOrganization(org as Organization | null);

      // Get subscription with plan
      if (org) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("id, status, trial_ends_at, plan_id")
          .eq("organization_id", org.id)
          .single();

        if (sub) {
          const { data: plan } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", sub.plan_id)
            .single();

          setSubscription({
            ...sub,
            plan: plan ? {
              id: plan.id,
              name: plan.name,
              slug: plan.slug,
              max_clients: plan.max_clients ?? -1,
              max_projects: plan.max_projects ?? -1,
              max_team_members: plan.max_team_members ?? -1,
              features: (plan.features as string[]) || [],
            } : null,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching org:", err);
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [user]);

  const canAccess = (feature: string): boolean => {
    if (!subscription?.plan) return true;
    return subscription.plan.features.some(
      f => f.toLowerCase().includes(feature.toLowerCase())
    );
  };

  const isWithinLimit = (resource: "clients" | "projects" | "team", count: number): boolean => {
    if (!subscription?.plan) return true;
    const limits: Record<string, number> = {
      clients: subscription.plan.max_clients,
      projects: subscription.plan.max_projects,
      team: subscription.plan.max_team_members,
    };
    const limit = limits[resource];
    return limit === -1 || count < limit; // -1 means unlimited
  };

  return (
    <OrgContext.Provider value={{
      organization,
      subscription,
      orgLoading,
      hasOrg: !!organization,
      canAccess,
      isWithinLimit,
      refreshOrg: fetchOrg,
    }}>
      {children}
    </OrgContext.Provider>
  );
}
