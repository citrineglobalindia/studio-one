import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye, Image, FileText, CreditCard, Calendar, ExternalLink, Settings, Copy } from "lucide-react";
import { sampleProjects } from "@/data/wedding-types";
import { useState } from "react";

interface PortalAccess {
  projectId: string;
  client: string;
  partner: string;
  portalUrl: string;
  features: { gallery: boolean; invoices: boolean; contracts: boolean; timeline: boolean };
  lastVisit?: string;
  totalVisits: number;
  isActive: boolean;
}

const portalAccess: PortalAccess[] = [
  { projectId: "p1", client: "Priya Sharma", partner: "Rahul Kapoor", portalUrl: "portal.studio.com/priya-rahul", features: { gallery: true, invoices: true, contracts: true, timeline: true }, lastVisit: "2026-03-30", totalVisits: 12, isActive: true },
  { projectId: "p2", client: "Ananya Desai", partner: "Vikram Malhotra", portalUrl: "portal.studio.com/ananya-vikram", features: { gallery: false, invoices: true, contracts: true, timeline: true }, lastVisit: "2026-03-28", totalVisits: 5, isActive: true },
  { projectId: "p3", client: "Meera Iyer", partner: "Aditya Nair", portalUrl: "portal.studio.com/meera-aditya", features: { gallery: true, invoices: true, contracts: true, timeline: true }, lastVisit: "2026-03-25", totalVisits: 18, isActive: true },
  { projectId: "p4", client: "Sneha Kapoor", partner: "Rohan Jain", portalUrl: "portal.studio.com/sneha-rohan", features: { gallery: false, invoices: false, contracts: false, timeline: false }, totalVisits: 0, isActive: false },
];

export default function PortalPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(`https://${url}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Client Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">{portalAccess.filter((p) => p.isActive).length} active portals · {portalAccess.reduce((s, p) => s + p.totalVisits, 0)} total visits</p>
          </div>
          <Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Portal Settings</Button>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Photo Gallery", icon: Image, desc: "Client photo selection" },
            { label: "Invoices", icon: CreditCard, desc: "Payment tracking" },
            { label: "Contracts", icon: FileText, desc: "Digital signatures" },
            { label: "Timeline", icon: Calendar, desc: "Event schedule" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg bg-card border border-border p-4">
              <f.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Portal Cards */}
        <div className="space-y-4">
          {portalAccess.map((portal) => (
            <div key={portal.projectId} className="rounded-lg bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{portal.client} & {portal.partner}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{portal.portalUrl}</span>
                      <button onClick={() => handleCopy(portal.portalUrl, portal.projectId)} className="text-primary hover:text-primary/80">
                        <Copy className="h-3 w-3" />
                      </button>
                      {copiedId === portal.projectId && <span className="text-[10px] text-emerald-400">Copied!</span>}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={portal.isActive ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]" : "bg-muted text-muted-foreground border-border text-[10px]"}>
                  {portal.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {Object.entries(portal.features).map(([key, enabled]) => (
                  <div key={key} className={`rounded-md border p-2 text-center text-xs ${enabled ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted/30 text-muted-foreground"}`}>
                    {enabled ? "✓" : "—"} {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span><Eye className="inline h-3 w-3 mr-1" />{portal.totalVisits} visits</span>
                  {portal.lastVisit && <span>Last: {portal.lastVisit.slice(5)}</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="h-3.5 w-3.5" />Preview</Button>
                  <Button size="sm" className="gap-1.5 text-xs"><ExternalLink className="h-3.5 w-3.5" />Open Portal</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
