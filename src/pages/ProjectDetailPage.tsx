import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useEventTeamAssignments } from "@/hooks/useEventTeamAssignments";
import { useEvents } from "@/hooks/useEvents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, CalendarDays, MapPin, Phone, IndianRupee, Heart,
  Camera, Users, CheckCircle2, Clock, Loader2, FileText, Sparkles, Pencil, Package,
} from "lucide-react";

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  planning: { label: "Planning", class: "bg-muted text-muted-foreground border-border", icon: Sparkles },
  booked: { label: "Booked", class: "bg-primary/20 text-primary border-primary/30", icon: CheckCircle2 },
  in_progress: { label: "In Progress", class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
  editing: { label: "Editing", class: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Pencil },
  delivered: { label: "Delivered", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Package },
  completed: { label: "Completed", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, isLoading } = useProjects();
  const { members: teamMembers } = useTeamMembers();
  const { byEvent: assignmentsByEvent } = useEventTeamAssignments();
  const { events: allEvents } = useEvents();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-foreground font-medium">Project not found</p>
        <p className="text-sm text-muted-foreground mt-1">This project may have been deleted or you don't have access.</p>
        <Button variant="outline" className="mt-6 gap-2 rounded-xl" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[project.status] || statusConfig.planning;
  const StatusIcon = cfg.icon;
  const amountPaid = project.amount_paid || 0;
  const totalAmount = project.total_amount || 0;
  const paidPct = totalAmount > 0 ? Math.round((amountPaid / totalAmount) * 100) : 0;
  const balance = Math.max(0, totalAmount - amountPaid);

  // Aggregate assigned team from THREE sources:
  //   (1) project.assigned_team — stores NAMES (legacy)
  //   (2) event_team_assignments for this project's id
  //   (3) event_team_assignments for every event belonging to the same client
  const assignedTeam = (() => {
    const byId = new Map<string, any>();

    // Source 1: names stored on the project
    for (const name of project.assigned_team || []) {
      if (!name) continue;
      const match = teamMembers.find((m: any) => m.full_name === name);
      const id = match ? match.id : `name:${name}`;
      if (!byId.has(id)) byId.set(id, match ?? { id, full_name: name, role: "Crew" });
    }

    // Collect every event id tied to this project's client
    const eventIds: string[] = [project.id];
    if (project.client_id) {
      for (const e of allEvents as any[]) {
        if (e.client_id === project.client_id) eventIds.push(e.id);
      }
    }

    const byEvent = assignmentsByEvent();
    for (const eid of eventIds) {
      for (const mid of byEvent[eid] || []) {
        const m = teamMembers.find((x: any) => x.id === mid);
        if (m && !byId.has(m.id)) byId.set(m.id, m);
      }
    }

    return Array.from(byId.values());
  })();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="mt-1 shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {project.project_name}
            </h1>
            <Badge variant="outline" className={cn("capitalize gap-1", cfg.class)}>
              <StatusIcon className="h-3 w-3" /> {cfg.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {project.client?.name && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {project.client.name}
                {project.client.partner_name && <> & {project.client.partner_name}</>}
              </span>
            )}
            {project.event_date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(project.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
            {project.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.venue}{project.client?.city ? `, ${project.client.city}` : ""}
              </span>
            )}
            {project.client?.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {project.client.phone}
              </span>
            )}
            {project.event_type && (
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {project.event_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">₹{(totalAmount / 1000).toFixed(0)}K</p>
          <p className="text-xs text-muted-foreground">{project.event_type || "—"}</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">₹{(amountPaid / 1000).toFixed(0)}K</p>
          <Progress value={paidPct} className="h-1.5 mt-1" />
        </div>
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Balance Due</p>
          <p className={cn("text-xl font-display font-bold mt-1", balance > 0 ? "text-amber-500" : "text-emerald-500")}>
            ₹{(balance / 1000).toFixed(0)}K
          </p>
          <p className="text-xs text-muted-foreground">{paidPct}% paid</p>
        </div>
        <div className="rounded-lg bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Team Size</p>
          <p className="text-xl font-display font-bold text-foreground mt-1">{assignedTeam.length}</p>
          <p className="text-xs text-muted-foreground">members assigned</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team ({assignedTeam.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-card border border-border p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Project Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Project Name</dt>
                  <dd className="text-foreground font-medium text-right">{project.project_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Event Type</dt>
                  <dd className="text-foreground font-medium text-right">{project.event_type || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Event Date</dt>
                  <dd className="text-foreground font-medium text-right">
                    {project.event_date ? new Date(project.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Venue</dt>
                  <dd className="text-foreground font-medium text-right">{project.venue || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-foreground font-medium text-right capitalize">{cfg.label}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="text-foreground font-medium text-right">
                    {new Date(project.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-card border border-border p-5">
              <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Client
              </h3>
              {project.client ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Primary</dt>
                    <dd className="text-foreground font-medium text-right">{project.client.name}</dd>
                  </div>
                  {project.client.partner_name && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Partner</dt>
                      <dd className="text-foreground font-medium text-right">{project.client.partner_name}</dd>
                    </div>
                  )}
                  {project.client.phone && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="text-foreground font-medium text-right">{project.client.phone}</dd>
                    </div>
                  )}
                  {project.client.city && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">City</dt>
                      <dd className="text-foreground font-medium text-right">{project.client.city}</dd>
                    </div>
                  )}
                  {project.client_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 rounded-xl gap-2"
                      onClick={() => navigate(`/clients/${project.client_id}`)}
                    >
                      View full client profile
                    </Button>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No client linked to this project.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Assigned Team</h2>
          </div>

          {assignedTeam.length === 0 ? (
            <div className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No team members assigned yet.</p>
              <p className="text-xs mt-1">Edit this project from the Projects page to assign members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedTeam.map((m) => m && (
                <div key={m.id} className="rounded-lg bg-card border border-border p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">
                      {(m.role || "team").replace("_", " ").replace("-", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          <div className="rounded-lg bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment Status</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">
                  ₹{amountPaid.toLocaleString("en-IN")} <span className="text-sm text-muted-foreground font-normal">of ₹{totalAmount.toLocaleString("en-IN")}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-display font-extrabold text-primary">{paidPct}%</p>
                <p className="text-xs text-muted-foreground">collected</p>
              </div>
            </div>
            <Progress value={paidPct} className="h-2" />
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Paid</p>
                <p className="text-sm font-bold text-emerald-500 mt-1">₹{amountPaid.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Balance</p>
                <p className={cn("text-sm font-bold mt-1", balance > 0 ? "text-amber-500" : "text-emerald-500")}>
                  ₹{balance.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-sm font-bold text-foreground mt-1">₹{totalAmount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-card border border-border p-5 text-center text-muted-foreground">
            <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Detailed invoice history lives in the <button onClick={() => navigate("/invoices")} className="text-primary underline">Invoices</button> module.</p>
          </div>
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="space-y-4">
          <div className="rounded-lg bg-card border border-border p-5">
            <h3 className="text-sm font-display font-semibold text-foreground mb-3">Project Notes</h3>
            {project.notes ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">{project.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes added yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailPage;
