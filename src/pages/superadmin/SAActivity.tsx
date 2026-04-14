import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Building2, Users, FolderKanban, FileText, Clock,
  TrendingUp, CalendarDays, IndianRupee,
} from "lucide-react";
import { format, subDays, isAfter } from "date-fns";

interface ActivityItem {
  type: "studio_created" | "client_added" | "project_created" | "invoice_created";
  label: string;
  studio: string;
  date: string;
  color: string;
  icon: typeof Building2;
}

export default function SAActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ last7: 0, last30: 0, lastOrg: "" });

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    const [orgsRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
      supabase.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("clients").select("id, name, organization_id, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("projects").select("id, project_name, organization_id, created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("invoices").select("id, invoice_number, organization_id, created_at").order("created_at", { ascending: false }).limit(50),
    ]);

    const orgMap: Record<string, string> = {};
    (orgsRes.data || []).forEach((o: any) => { orgMap[o.id] = o.name; });

    const items: ActivityItem[] = [];

    (orgsRes.data || []).forEach((o: any) => {
      items.push({ type: "studio_created", label: `Studio "${o.name}" created`, studio: o.name, date: o.created_at, color: "text-primary", icon: Building2 });
    });
    (clientsRes.data || []).forEach((c: any) => {
      items.push({ type: "client_added", label: `Client "${c.name}" added`, studio: orgMap[c.organization_id] || "Unknown", date: c.created_at, color: "text-blue-400", icon: Users });
    });
    (projectsRes.data || []).forEach((p: any) => {
      items.push({ type: "project_created", label: `Project "${p.project_name}" created`, studio: orgMap[p.organization_id] || "Unknown", date: p.created_at, color: "text-violet-400", icon: FolderKanban });
    });
    (invoicesRes.data || []).forEach((i: any) => {
      items.push({ type: "invoice_created", label: `Invoice #${i.invoice_number} generated`, studio: orgMap[i.organization_id] || "Unknown", date: i.created_at, color: "text-emerald-400", icon: FileText });
    });

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const now = new Date();
    const last7 = items.filter((i) => isAfter(new Date(i.date), subDays(now, 7))).length;
    const last30 = items.filter((i) => isAfter(new Date(i.date), subDays(now, 30))).length;

    setActivities(items.slice(0, 100));
    setStats({
      last7,
      last30,
      lastOrg: (orgsRes.data || [])[0]?.name || "—",
    });
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Recent platform-wide activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center"><Activity className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{stats.last7}</p><p className="text-xs text-muted-foreground">Last 7 Days</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-violet-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{stats.last30}</p><p className="text-xs text-muted-foreground">Last 30 Days</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-sm font-bold text-foreground truncate">{stats.lastOrg}</p><p className="text-xs text-muted-foreground">Latest Studio</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Timeline</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {activities.map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{item.studio}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(item.date), "MMM d, yyyy · h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
