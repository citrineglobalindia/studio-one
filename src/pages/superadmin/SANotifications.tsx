import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Building2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface NotifItem {
  id: string;
  type: "trial_expiring" | "new_studio" | "no_activity";
  title: string;
  description: string;
  date: string;
  severity: "info" | "warning" | "success";
}

export default function SANotifications() {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateNotifications();
  }, []);

  const generateNotifications = async () => {
    setLoading(true);
    const [orgsRes, subsRes] = await Promise.all([
      supabase.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("organization_id, status, trial_ends_at"),
    ]);

    const orgs = orgsRes.data || [];
    const subs = subsRes.data || [];
    const orgMap: Record<string, string> = {};
    orgs.forEach((o: any) => { orgMap[o.id] = o.name; });

    const notifs: NotifItem[] = [];

    // Trial expiring soon
    subs.filter((s: any) => s.status === "trial" && s.trial_ends_at).forEach((s: any) => {
      const daysLeft = differenceInDays(new Date(s.trial_ends_at), new Date());
      if (daysLeft <= 7 && daysLeft >= 0) {
        notifs.push({
          id: `trial-${s.organization_id}`,
          type: "trial_expiring",
          title: `Trial expiring for ${orgMap[s.organization_id] || "Unknown"}`,
          description: `${daysLeft} day(s) remaining. Consider reaching out.`,
          date: s.trial_ends_at,
          severity: daysLeft <= 3 ? "warning" : "info",
        });
      }
    });

    // New studios (last 7 days)
    orgs.filter((o: any) => differenceInDays(new Date(), new Date(o.created_at)) <= 7).forEach((o: any) => {
      notifs.push({
        id: `new-${o.id}`,
        type: "new_studio",
        title: `New studio: ${o.name}`,
        description: "Studio was recently created and is onboarding.",
        date: o.created_at,
        severity: "success",
      });
    });

    // Studios without subscription
    const subOrgIds = new Set(subs.map((s: any) => s.organization_id));
    orgs.filter((o: any) => !subOrgIds.has(o.id)).forEach((o: any) => {
      notifs.push({
        id: `nosub-${o.id}`,
        type: "no_activity",
        title: `${o.name} has no subscription`,
        description: "This studio has no active plan assigned.",
        date: o.created_at,
        severity: "warning",
      });
    });

    notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setNotifications(notifs);
    setLoading(false);
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      default: return <Bell className="h-4 w-4 text-blue-400" />;
    }
  };

  const severityBg = (severity: string) => {
    switch (severity) {
      case "warning": return "bg-amber-500/10";
      case "success": return "bg-emerald-500/10";
      default: return "bg-blue-500/10";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">{notifications.length} alerts requiring attention</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{notifications.filter((n) => n.severity === "warning").length}</p><p className="text-xs text-muted-foreground">Warnings</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{notifications.filter((n) => n.severity === "success").length}</p><p className="text-xs text-muted-foreground">New Activity</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><Bell className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{notifications.filter((n) => n.severity === "info").length}</p><p className="text-xs text-muted-foreground">Info</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-base">All clear! No notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-9 w-9 rounded-lg ${severityBg(notif.severity)} flex items-center justify-center shrink-0 mt-0.5`}>
                    {severityIcon(notif.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{notif.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(notif.date), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
