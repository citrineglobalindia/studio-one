import { useState, useEffect, useCallback } from "react";
import { useClients } from "@/hooks/useClients";
import { useProcessSteps, type ProcessStep } from "@/hooks/useProcessSteps";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Plus, Trash2, Copy, CalendarIcon, CheckCircle2, Clock, Circle,
  ChevronRight, ListChecks, Users, Pencil, Save,
} from "lucide-react";

const EVENT_OPTIONS = [
  "Pre-Wedding", "Wedding", "Haldi", "Mehendi", "Sangeet",
  "Reception", "Engagement", "Baby Shower", "Birthday", "Corporate",
];

const STATUS_CONFIG: Record<string, { label: string; dotClass: string; bgClass: string; icon: typeof Circle }> = {
  not_started: { label: "Not Started", dotClass: "bg-muted-foreground/40", bgClass: "bg-muted/50 text-muted-foreground", icon: Circle },
  in_progress: { label: "In Progress", dotClass: "bg-amber-500", bgClass: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: Clock },
  completed: { label: "Completed", dotClass: "bg-emerald-500", bgClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
};

export default function ProcessPlannerPage() {
  const { clients, isLoading: clientsLoading } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { steps, isLoading, addStep, updateStep, deleteStep } = useProcessSteps(selectedClientId || undefined);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleAddStep = () => {
    if (!selectedClientId) return;
    addStep.mutate(
      {
        client_id: selectedClientId,
        step_number: steps.length + 1,
        heading: "",
        description: null,
        events: [],
        deadline: null,
        status: "not_started",
      },
      {
        onSuccess: (data: any) => {
          if (data?.id) setEditingStepId(data.id);
        },
      }
    );
  };

  const handleDuplicate = (step: ProcessStep) => {
    addStep.mutate({
      client_id: step.client_id,
      step_number: steps.length + 1,
      heading: `${step.heading} (copy)`,
      description: step.description,
      events: step.events,
      deadline: step.deadline,
      status: "not_started",
    });
  };

  const completedCount = steps.filter((s) => s.status === "completed").length;
  const inProgressCount = steps.filter((s) => s.status === "in_progress").length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <ListChecks className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Process Planner</h1>
            <p className="text-sm text-muted-foreground">Define &amp; track step-by-step workflows for each client</p>
          </div>
        </div>
        {selectedClientId && (
          <Button onClick={handleAddStep} disabled={addStep.isPending} className="gap-2">
            <Plus className="h-4 w-4" /> Add Step
          </Button>
        )}
      </div>

      {/* Client Selector */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
              <Users className="h-4 w-4" /> Client:
            </div>
            <div className="flex-1 w-full">
              {clients.length === 0 && !clientsLoading ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                  <span className="text-sm text-muted-foreground">No clients found. Add clients first.</span>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/clients">Go to Clients</a>
                  </Button>
                </div>
              ) : (
                <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setEditingStepId(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client to plan their process…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="font-medium">{c.name}</span>
                        {c.event_type && <span className="text-muted-foreground ml-2">• {c.event_type}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Progress */}
          {selectedClientId && steps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{steps.length} steps</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {completedCount} done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    {inProgressCount} active
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty States */}
      {!selectedClientId && clients.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
              <ListChecks className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Select a Client</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a client from the dropdown above to view or create their process timeline.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedClientId && steps.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Steps Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Start building the workflow for <strong>{selectedClient?.name}</strong>.
            </p>
            <Button onClick={handleAddStep} disabled={addStep.isPending} className="gap-2">
              <Plus className="h-4 w-4" /> Add First Step
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline + Editor */}
      {selectedClientId && steps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card className="sticky top-4 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/50 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" /> Timeline
                </CardTitle>
                <CardDescription>{selectedClient?.name}</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 pb-6">
                <div className="relative pl-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border" />
                  {steps.map((step) => {
                    const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.not_started;
                    const Icon = cfg.icon;
                    const isActive = editingStepId === step.id;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setEditingStepId(isActive ? null : step.id)}
                        className={cn(
                          "relative w-full text-left mb-5 last:mb-0 group rounded-lg p-2.5 -ml-1 transition-all",
                          isActive ? "bg-accent ring-1 ring-primary/30" : "hover:bg-accent/50"
                        )}
                      >
                        <div className={cn(
                          "absolute -left-[0.9rem] top-3 h-6 w-6 rounded-full flex items-center justify-center ring-[3px] ring-background transition-all",
                          cfg.dotClass
                        )}>
                          <Icon className="h-3 w-3 text-white" />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold tracking-wider text-primary/70 uppercase">Step {step.step_number}</span>
                            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                            <span className="text-sm font-semibold text-foreground leading-tight">
                              {step.heading || "Untitled Step"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] h-5 border", cfg.bgClass)}>
                              {cfg.label}
                            </Badge>
                            {step.deadline && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="h-2.5 w-2.5" />
                                {format(new Date(step.deadline), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                          {step.events.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {step.events.map((e) => (
                                <Badge key={e} variant="secondary" className="text-[9px] h-4 px-1.5">{e}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Step Details</h2>
              <span className="text-xs text-muted-foreground">Click a step to edit</span>
            </div>
            {steps.map((step) => (
              <StepEditorCard
                key={step.id}
                step={step}
                isExpanded={editingStepId === step.id}
                onToggle={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                onSave={(updates) => updateStep.mutate({ id: step.id, ...updates })}
                isSaving={updateStep.isPending}
                onDelete={() => {
                  deleteStep.mutate(step.id);
                  if (editingStepId === step.id) setEditingStepId(null);
                }}
                onDuplicate={() => handleDuplicate(step)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step Editor Card with local state + Save button ─── */
function StepEditorCard({
  step,
  isExpanded,
  onToggle,
  onSave,
  isSaving,
  onDelete,
  onDuplicate,
}: {
  step: ProcessStep;
  isExpanded: boolean;
  onToggle: () => void;
  onSave: (u: Partial<ProcessStep>) => void;
  isSaving: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [localHeading, setLocalHeading] = useState(step.heading);
  const [localDescription, setLocalDescription] = useState(step.description || "");
  const [localStatus, setLocalStatus] = useState(step.status);
  const [localEvents, setLocalEvents] = useState<string[]>(step.events);
  const [localDeadline, setLocalDeadline] = useState<Date | undefined>(
    step.deadline ? new Date(step.deadline) : undefined
  );
  const [isDirty, setIsDirty] = useState(false);

  // Reset local state when step data changes (e.g. after save)
  useEffect(() => {
    setLocalHeading(step.heading);
    setLocalDescription(step.description || "");
    setLocalStatus(step.status);
    setLocalEvents(step.events);
    setLocalDeadline(step.deadline ? new Date(step.deadline) : undefined);
    setIsDirty(false);
  }, [step]);

  const markDirty = () => setIsDirty(true);

  const toggleEvent = (event: string) => {
    setLocalEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
    markDirty();
  };

  const handleSave = () => {
    onSave({
      heading: localHeading,
      description: localDescription || null,
      status: localStatus,
      events: localEvents,
      deadline: localDeadline ? format(localDeadline, "yyyy-MM-dd") : null,
    });
    setIsDirty(false);
  };

  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.not_started;
  const localCfg = STATUS_CONFIG[localStatus] || STATUS_CONFIG.not_started;

  const statusBorderColor =
    localStatus === "completed" ? "border-l-emerald-500" :
    localStatus === "in_progress" ? "border-l-amber-500" :
    "border-l-muted-foreground/30";

  return (
    <Card className={cn("border-l-4 transition-all", statusBorderColor, isExpanded && "ring-1 ring-primary/20 shadow-md")}>
      {/* Collapsed Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono font-bold text-xs shrink-0">
            {step.step_number}
          </Badge>
          <div>
            <span className="font-semibold text-sm text-foreground">
              {step.heading || "Untitled Step"}
            </span>
            {step.deadline && (
              <span className="text-xs text-muted-foreground ml-2">
                • {format(new Date(step.deadline), "dd MMM")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">Unsaved</Badge>}
          <Badge variant="outline" className={cn("text-[10px] border", cfg.bgClass)}>{cfg.label}</Badge>
          <Pencil className={cn("h-3.5 w-3.5 transition-colors", isExpanded ? "text-primary" : "text-muted-foreground")} />
        </div>
      </button>

      {/* Expanded Editor */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium">Process Heading</Label>
              <Input
                value={localHeading}
                onChange={(e) => { setLocalHeading(e.target.value); markDirty(); }}
                placeholder="e.g. Pre-Wedding Shoot"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Status</Label>
              <Select value={localStatus} onValueChange={(v) => { setLocalStatus(v); markDirty(); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      <span className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", v.dotClass)} />
                        {v.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium">Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !localDeadline && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localDeadline ? format(localDeadline, "PPP") : "Pick a deadline…"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={localDeadline}
                  onSelect={(d) => { setLocalDeadline(d); markDirty(); }}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={localDescription}
              onChange={(e) => { setLocalDescription(e.target.value); markDirty(); }}
              placeholder="Detailed explanation of what needs to be done…"
              className="mt-1 min-h-[70px]"
            />
          </div>

          <div>
            <Label className="text-xs font-medium mb-2 block">Event Selection</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {EVENT_OPTIONS.map((ev) => (
                <label
                  key={ev}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer rounded-lg border p-2 text-xs transition-colors",
                    localEvents.includes(ev)
                      ? "border-primary/50 bg-primary/5 text-foreground"
                      : "border-border hover:bg-accent/50 text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={localEvents.includes(ev)}
                    onCheckedChange={() => toggleEvent(ev)}
                  />
                  {ev}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </Button>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="gap-2"
              size="sm"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving…" : "Save Step"}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
