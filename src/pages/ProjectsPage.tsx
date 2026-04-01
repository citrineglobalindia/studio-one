import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { sampleProjects } from "@/data/wedding-types";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Users, IndianRupee, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; class: string }> = {
  inquiry: { label: "Inquiry", class: "bg-muted text-muted-foreground border-border" },
  booked: { label: "Booked", class: "bg-primary/20 text-primary border-primary/30" },
  "in-progress": { label: "In Progress", class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  editing: { label: "Editing", class: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  delivered: { label: "Delivered", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  completed: { label: "Completed", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const ProjectsPage = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Wedding Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage all marriage events and their lifecycle.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = sampleProjects.filter((p) => p.status === key).length;
            return (
              <div key={key} className="rounded-lg bg-card border border-border p-3 text-center">
                <div className="text-xl font-display font-bold text-foreground">{count}</div>
                <div className="text-xs text-muted-foreground mt-1">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Projects list */}
        <div className="space-y-3">
          {sampleProjects.map((project) => {
            const status = statusConfig[project.status];
            const paymentPercent = project.totalAmount > 0 ? Math.round((project.paidAmount / project.totalAmount) * 100) : 0;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="rounded-lg bg-card border border-border p-5 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.clientName} & {project.partnerName}
                      </h3>
                      <Badge variant="outline" className={status.class}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(project.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {project.venue}, {project.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.team.length} team · {project.subEvents.length} events
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    {/* Payment progress */}
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground flex items-center gap-1">
                        <IndianRupee className="h-3 w-3" />
                        {(project.paidAmount / 1000).toFixed(0)}K / {(project.totalAmount / 1000).toFixed(0)}K
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", paymentPercent >= 100 ? "bg-emerald-500" : "bg-primary")}
                          style={{ width: `${paymentPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{paymentPercent}% paid</span>
                    </div>

                    {/* Sub-events mini */}
                    <div className="hidden lg:flex items-center gap-1">
                      {project.subEvents.slice(0, 4).map((se) => (
                        <div
                          key={se.id}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            se.status === "completed" && "bg-emerald-500",
                            se.status === "in-progress" && "bg-blue-500",
                            se.status === "upcoming" && "bg-muted-foreground/30",
                          )}
                          title={`${se.name}: ${se.status}`}
                        />
                      ))}
                      {project.subEvents.length > 4 && (
                        <span className="text-[10px] text-muted-foreground">+{project.subEvents.length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectsPage;
