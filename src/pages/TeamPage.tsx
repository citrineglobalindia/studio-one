import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { sampleTeamMembers } from "@/data/wedding-types";
import { Camera, Video, Edit3, Users, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const roleIcons: Record<string, typeof Camera> = {
  photographer: Camera,
  videographer: Video,
  editor: Edit3,
  "drone-operator": Camera,
  assistant: Users,
};

const roleColors: Record<string, string> = {
  photographer: "bg-blue-500/20 text-blue-400",
  videographer: "bg-purple-500/20 text-purple-400",
  editor: "bg-emerald-500/20 text-emerald-400",
  "drone-operator": "bg-orange-500/20 text-orange-400",
  assistant: "bg-muted text-muted-foreground",
};

const TeamPage = () => {
  const inOffice = sampleTeamMembers.filter((m) => m.type === "in-office");
  const vendors = sampleTeamMembers.filter((m) => m.type === "vendor");

  const renderMember = (m: typeof sampleTeamMembers[0]) => {
    const Icon = roleIcons[m.role] || Users;
    return (
      <div key={m.id} className={cn("rounded-lg bg-card border p-4 hover:border-primary/30 transition-colors", m.type === "vendor" ? "border-primary/20" : "border-border")}>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{m.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-medium capitalize", roleColors[m.role])}>
                <Icon className="h-2.5 w-2.5" />{m.role.replace("-", " ")}
              </span>
              {m.type === "vendor" && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">Vendor</Badge>
              )}
            </div>
            {m.phone && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Phone className="h-3 w-3" />{m.phone}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Team Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your in-office crew and external vendors.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        </div>

        {/* Role summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {["photographer", "videographer", "editor", "drone-operator", "assistant"].map((role) => {
            const Icon = roleIcons[role] || Users;
            const count = sampleTeamMembers.filter((m) => m.role === role).length;
            return (
              <div key={role} className="rounded-lg bg-card border border-border p-3 text-center">
                <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
                <div className="text-lg font-display font-bold text-foreground">{count}</div>
                <div className="text-[10px] text-muted-foreground capitalize">{role.replace("-", " ")}s</div>
              </div>
            );
          })}
        </div>

        {/* In-office */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3">In-Office Team ({inOffice.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inOffice.map(renderMember)}
          </div>
        </div>

        {/* Vendors */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3">Vendors & Freelancers ({vendors.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendors.map(renderMember)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;
