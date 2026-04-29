import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Workflow, Plus, Trash2, ListTodo, ChevronRight, Loader2, GripVertical, Wand2, Pencil,
} from "lucide-react";
import { useProcessTemplates, type ProcessTemplate } from "@/hooks/useProcessTemplates";
import { useClients } from "@/hooks/useClients";

const ROLE_OPTIONS = [
  { value: "any", label: "Any role" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "editor", label: "Editor" },
  { value: "telecaller", label: "Telecaller" },
  { value: "vendor", label: "Vendor" },
  { value: "accounts", label: "Accountant" },
  { value: "admin", label: "Admin / Owner" },
];

export default function ProcessTemplatesPage() {
  const navigate = useNavigate();
  const {
    templates, stepsForTemplate, isLoading,
    createTemplate, deleteTemplate, addStep, updateStep, deleteStep,
    applyTemplateToClient,
  } = useProcessTemplates();
  const { clients = [] } = useClients();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null);
  const [applyTarget, setApplyTarget] = useState<ProcessTemplate | null>(null);
  const [applyClientId, setApplyClientId] = useState<string>("");

  const [newStepDraft, setNewStepDraft] = useState({ name: "", description: "", responsible_role: "any", default_eta_days: "" });

  const tabs = [
    { label: "Per-Client", path: "/process-planner" },
    { label: "Templates", path: "/process-planner/templates" },
    { label: "Across Projects", path: "/process-planner/dashboard" },
  ];

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createTemplate.mutateAsync({ name: name.trim(), description: description.trim() || null });
    setName(""); setDescription(""); setCreateOpen(false);
  };

  const handleAddStep = async () => {
    if (!selectedTemplate || !newStepDraft.name.trim()) return;
    const steps = stepsForTemplate(selectedTemplate.id);
    await addStep.mutateAsync({
      template_id: selectedTemplate.id,
      step_order: steps.length + 1,
      name: newStepDraft.name.trim(),
      description: newStepDraft.description.trim() || null,
      responsible_role: newStepDraft.responsible_role === "any" ? null : newStepDraft.responsible_role,
      default_eta_days: newStepDraft.default_eta_days ? Number(newStepDraft.default_eta_days) : null,
    });
    setNewStepDraft({ name: "", description: "", responsible_role: "any", default_eta_days: "" });
  };

  const handleApply = async () => {
    if (!applyTarget || !applyClientId) return;
    const client = (clients as any[]).find(c => c.id === applyClientId);
    await applyTemplateToClient.mutateAsync({
      templateId: applyTarget.id,
      clientId: applyClientId,
      baseDate: client?.event_date,
    });
    setApplyTarget(null);
    setApplyClientId("");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Workflow className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Process Planner</h1>
            <p className="text-sm text-muted-foreground">Reusable workflow templates for every kind of project</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-4 flex items-center gap-1 border-b">
          {tabs.map(t => (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              className={`px-3 py-2 text-sm font-medium ${t.path === "/process-planner/templates" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Templates list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Templates</h2>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1 h-7 px-2 text-xs">
              <Plus className="h-3 w-3" /> New
            </Button>
          </div>
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
              <Workflow className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No templates yet. Create one to define your studio's standard workflow.
            </CardContent></Card>
          ) : (
            templates.map(t => {
              const stepCount = stepsForTemplate(t.id).length;
              const isActive = selectedTemplate?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{t.name}</span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <ListTodo className="h-2.5 w-2.5" /> {stepCount}
                    </Badge>
                  </div>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Template editor */}
        <div>
          {!selectedTemplate ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select or create a template to start defining its steps.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{selectedTemplate.name}</h2>
                    {selectedTemplate.description && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setApplyTarget(selectedTemplate)}
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Apply to client
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            All {stepsForTemplate(selectedTemplate.id).length} steps will be removed. Existing client process steps remain unaffected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { deleteTemplate.mutate(selectedTemplate.id); setSelectedTemplate(null); }}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</h3>
                  {stepsForTemplate(selectedTemplate.id).map((s, idx) => (
                    <div key={s.id} className="flex items-start gap-3 rounded-lg border p-3 bg-card">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                          <Input
                            value={s.name}
                            onChange={e => updateStep.mutate({ id: s.id, name: e.target.value })}
                            className="h-8 font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Select
                            value={s.responsible_role ?? "any"}
                            onValueChange={(v) => updateStep.mutate({ id: s.id, responsible_role: v === "any" ? null : v })}
                          >
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map(r => (
                                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Days from event"
                            value={s.default_eta_days ?? ""}
                            onChange={e => updateStep.mutate({ id: s.id, default_eta_days: e.target.value ? Number(e.target.value) : null })}
                            className="h-7 text-xs w-32"
                          />
                          <Textarea
                            value={s.description ?? ""}
                            onChange={e => updateStep.mutate({ id: s.id, description: e.target.value || null })}
                            placeholder="Optional notes for this step…"
                            rows={1}
                            className="text-xs flex-1 min-w-[180px]"
                          />
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                        onClick={() => deleteStep.mutate(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}

                  {/* Add step */}
                  <div className="rounded-lg border border-dashed p-3 bg-muted/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="New step name (e.g. Photo Editing)"
                        value={newStepDraft.name}
                        onChange={e => setNewStepDraft(d => ({ ...d, name: e.target.value }))}
                        className="h-8"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select value={newStepDraft.responsible_role} onValueChange={v => setNewStepDraft(d => ({ ...d, responsible_role: v }))}>
                        <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="ETA days from event"
                        value={newStepDraft.default_eta_days}
                        onChange={e => setNewStepDraft(d => ({ ...d, default_eta_days: e.target.value }))}
                        className="h-8 text-xs w-40"
                      />
                      <Button size="sm" onClick={handleAddStep} disabled={!newStepDraft.name.trim() || addStep.isPending} className="gap-1">
                        <Plus className="h-3 w-3" /> Add step
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create template dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New process template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wedding Pipeline" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createTemplate.isPending}>
              {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to client dialog */}
      <Dialog open={!!applyTarget} onOpenChange={(o) => !o && setApplyTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply "{applyTarget?.name}" to a client</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Materializes this template into actual workflow steps for the client.
              Due dates are computed from the client's event date + each step's ETA days.
            </p>
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={applyClientId} onValueChange={setApplyClientId}>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>
                  {(clients as any[]).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.partner_name ? ` & ${c.partner_name}` : ""}
                      {c.event_date ? ` — ${c.event_date}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyTarget(null)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!applyClientId || applyTemplateToClient.isPending} className="gap-2">
              {applyTemplateToClient.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
