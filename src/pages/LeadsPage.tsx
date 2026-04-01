import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  sampleLeads, stageConfig, sourceConfig, eventTypeLabels,
  type Lead, type LeadStage,
} from "@/data/lead-types";
import {
  Plus, Phone, CalendarDays, MapPin, IndianRupee, MessageSquare,
  Clock, User, GripVertical,
} from "lucide-react";

const stages: LeadStage[] = ["new", "contacted", "proposal-sent", "converted", "lost"];

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  const getLeadsByStage = (stage: LeadStage) => leads.filter((l) => l.stage === stage);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (stage: LeadStage) => {
    if (draggedLead) {
      setLeads((prev) =>
        prev.map((l) => (l.id === draggedLead ? { ...l, stage } : l))
      );
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const totalLeads = leads.length;
  const totalBudget = leads.reduce((s, l) => s + (l.budget || 0), 0);
  const convertedBudget = leads.filter((l) => l.stage === "converted").reduce((s, l) => s + (l.budget || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-full mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Lead Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalLeads} leads · ₹{(totalBudget / 100000).toFixed(1)}L pipeline · ₹{(convertedBudget / 100000).toFixed(1)}L converted
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Source filter chips */}
        <div className="flex items-center gap-2 px-1 flex-wrap">
          {Object.entries(sourceConfig).map(([key, cfg]) => {
            const count = leads.filter((l) => l.source === key).length;
            return (
              <Badge
                key={key}
                variant="outline"
                className="text-xs gap-1 bg-card border-border hover:border-primary/40 cursor-pointer transition-colors"
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
                <span className="text-muted-foreground ml-0.5">{count}</span>
              </Badge>
            );
          })}
        </div>

        {/* Kanban board */}
        <div className="flex gap-4 overflow-x-auto pb-4 px-1">
          {stages.map((stage) => {
            const stageCfg = stageConfig[stage];
            const stageLeads = getLeadsByStage(stage);
            const stageBudget = stageLeads.reduce((s, l) => s + (l.budget || 0), 0);

            return (
              <div
                key={stage}
                className={cn(
                  "flex-shrink-0 w-72 rounded-xl bg-card/50 border border-border flex flex-col max-h-[calc(100vh-260px)] transition-colors",
                  dragOverStage === stage && "border-primary/50 bg-primary/5",
                )}
                onDragOver={(e) => handleDragOver(e, stage)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column header */}
                <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", stageCfg.color)} />
                    <h3 className="text-sm font-display font-semibold text-foreground">{stageCfg.label}</h3>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    ₹{(stageBudget / 1000).toFixed(0)}K
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isDragging={draggedLead === lead.id}
                      onDragStart={() => handleDragStart(lead.id)}
                    />
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-8 opacity-50">
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onDragStart: () => void;
}

const LeadCard = ({ lead, isDragging, onDragStart }: LeadCardProps) => {
  const src = sourceConfig[lead.source];
  const evtLabel = eventTypeLabels[lead.eventType];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        "rounded-lg bg-card border border-border p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all group",
        isDragging && "opacity-40 scale-95",
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {lead.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-muted border-border">
              {evtLabel}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{src.emoji} {src.label}</span>
          </div>
        </div>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
      </div>

      {/* Details */}
      <div className="space-y-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{lead.city}</span>
          {lead.eventDate && (
            <>
              <span className="text-border">·</span>
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span>{new Date(lead.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </>
          )}
        </div>
        {lead.budget && (
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium">₹{(lead.budget / 1000).toFixed(0)}K</span>
          </div>
        )}
        {lead.notes && (
          <div className="flex items-start gap-1.5 mt-1.5">
            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{lead.notes}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
        {lead.assignedTo && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{lead.assignedTo}</span>
          </div>
        )}
        {!lead.assignedTo && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 text-yellow-400 bg-yellow-500/10 border-yellow-500/30">
            Unassigned
          </Badge>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
