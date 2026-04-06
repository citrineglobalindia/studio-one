import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Check, Crown, Zap, ArrowRight, Calendar, Users, FolderOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: string;
  max_clients: number | null;
  max_projects: number | null;
  max_team_members: number | null;
  features: string[];
}

export function SubscriptionManager() {
  const { organization, subscription, refreshOrg } = useOrg();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) {
        setPlans(data.map(p => ({
          ...p,
          features: (p.features as string[]) || [],
        })));
      }
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const currentPlan = subscription?.plan;
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleUpgrade = (plan: Plan) => {
    toast.info(`Upgrade to ${plan.name} — payment integration coming soon!`);
  };

  const formatLimit = (val: number | null) => (val === -1 || val === null) ? "Unlimited" : val.toString();

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      {subscription && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{currentPlan?.name || "Free"} Plan</span>
                    <Badge variant={subscription.status === "trial" ? "secondary" : "default"}>
                      {subscription.status === "trial" ? `Trial • ${trialDaysLeft} days left` : subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {organization?.name}
                  </p>
                </div>
              </div>
              {subscription.status === "trial" && (
                <Button onClick={() => handleUpgrade(plans.find(p => p.slug === "professional")!)} className="gap-1">
                  <Zap className="h-4 w-4" /> Upgrade Now
                </Button>
              )}
            </div>

            {subscription.status === "trial" && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Trial progress</span>
                  <span>{14 - trialDaysLeft}/14 days used</span>
                </div>
                <Progress value={((14 - trialDaysLeft) / 14) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Usage limits */}
      {currentPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Team Members", limit: currentPlan.max_team_members, current: 1 },
            { icon: FolderOpen, label: "Projects", limit: currentPlan.max_projects, current: 0 },
            { icon: Calendar, label: "Clients", limit: currentPlan.max_clients, current: 0 },
          ].map(item => (
            <Card key={item.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{item.current}</span>
                  <span className="text-sm text-muted-foreground">/ {formatLimit(item.limit)}</span>
                </div>
                {item.limit !== -1 && item.limit !== null && (
                  <Progress value={(item.current / item.limit) * 100} className="h-1.5 mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plans comparison */}
      <div>
        <h3 className="text-lg font-bold mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map(plan => {
            const isCurrent = currentPlan?.slug === plan.slug;
            return (
              <Card key={plan.id} className={`relative ${isCurrent ? "border-primary" : "border-border/50"}`}>
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">Current Plan</Badge>
                  </div>
                )}
                <CardContent className="p-5 pt-6 flex flex-col h-full">
                  <h4 className="font-bold text-lg">{plan.name}</h4>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-extrabold">
                      {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && <span className="text-sm text-muted-foreground">/{plan.billing_period}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <div>{formatLimit(plan.max_clients)} clients</div>
                    <div>{formatLimit(plan.max_projects)} projects</div>
                    <div>{formatLimit(plan.max_team_members)} team members</div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {isCurrent ? "Current Plan" : "Upgrade"} {!isCurrent && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
