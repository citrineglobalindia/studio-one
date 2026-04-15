import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Loader2, CheckCircle2, Copy, Eye, EyeOff, ArrowRight, ArrowLeft,
  Building2, CreditCard, Shield, Blocks, Sparkles, ClipboardList,
  MapPin, Phone, Users,
} from "lucide-react";
import { toast } from "sonner";
import { ALL_ROLES, ALL_MODULES } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

interface Plan { id: string; name: string; }
interface CreateStudioWizardProps { plans: Plan[]; onCreated: () => void; }

const STEPS = [
  { id: "info", label: "Studio Info", icon: Building2 },
  { id: "plan", label: "Select Plan", icon: CreditCard },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "modules", label: "Modules", icon: Blocks },
  { id: "review", label: "Review", icon: ClipboardList },
] as const;

type StepId = typeof STEPS[number]["id"];

const teamSizes = [
  { value: "solo", label: "Solo (Just me)" },
  { value: "small", label: "Small (2-5)" },
  { value: "medium", label: "Medium (6-15)" },
  { value: "large", label: "Large (16+)" },
];

const coreModules = ["dashboard", "profile", "notifications"];

export function CreateStudioWizard({ plans, onCreated }: CreateStudioWizardProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepId>("info");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const [form, setForm] = useState({
    studioName: "", email: "", password: "", city: "", phone: "", teamSize: "solo", planId: "",
  });
  const [disabledRoles, setDisabledRoles] = useState<string[]>([]);
  const [restrictedModules, setRestrictedModules] = useState<string[]>([]);

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const reset = () => {
    setForm({ studioName: "", email: "", password: "", city: "", phone: "", teamSize: "solo", planId: "" });
    setDisabledRoles([]);
    setRestrictedModules([]);
    setCurrentStep("info");
    setDone(false);
    setCredentials(null);
    setShowPassword(false);
  };

  const canProceed = () => {
    if (currentStep === "info") return !!(form.studioName && form.email && form.password.length >= 6);
    return true;
  };

  const next = () => {
    const idx = stepIndex;
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
  };
  const prev = () => {
    const idx = stepIndex;
    if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
  };

  const handleCreate = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("create-studio", {
      body: {
        studioName: form.studioName, email: form.email, password: form.password,
        city: form.city, phone: form.phone, teamSize: form.teamSize,
        planId: form.planId || undefined,
      },
    });

    if (error || data?.error) {
      setLoading(false);
      toast.error(data?.error || error?.message || "Failed to create studio");
      return;
    }

    const orgId = data?.organizationId;
    if (orgId) {
      if (disabledRoles.length > 0) {
        await supabase.from("studio_role_restrictions").upsert(
          { organization_id: orgId, disabled_roles: disabledRoles },
          { onConflict: "organization_id" }
        );
      }
      if (restrictedModules.length > 0) {
        await supabase.from("studio_module_restrictions").upsert(
          { organization_id: orgId, restricted_modules: restrictedModules },
          { onConflict: "organization_id" }
        );
      }
    }

    // Audit log
    if (user?.id) {
      await supabase.from("audit_logs").insert({
        action: "studio_created",
        actor_id: user.id,
        target_id: orgId || null,
        target_type: "organization",
        metadata: {
          studio_name: form.studioName,
          email: form.email,
          city: form.city,
          plan: plans.find(p => p.id === form.planId)?.name || null,
          disabled_roles: disabledRoles,
          restricted_modules: restrictedModules,
        },
      });
    }

    setLoading(false);
    setCredentials({ email: form.email, password: form.password });
    setDone(true);
    onCreated();
    toast.success(`Studio "${form.studioName}" created!`);
  };

  const copyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    toast.success("Copied!");
  };

  const toggleRole = (role: string) =>
    setDisabledRoles((p) => p.includes(role) ? p.filter((r) => r !== role) : [...p, role]);
  const toggleModule = (mod: string) =>
    setRestrictedModules((p) => p.includes(mod) ? p.filter((m) => m !== mod) : [...p, mod]);

  const moduleGroups = ALL_MODULES.reduce((acc, m) => {
    if (!acc[m.group]) acc[m.group] = [];
    acc[m.group].push(m);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Create Studio</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {done ? "Studio Created!" : "New Studio Wizard"}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          /* Success */
          <div className="p-6 space-y-5">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Studio <strong>{form.studioName}</strong> is ready. Share these credentials with the owner.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Login Credentials</span>
                <Button variant="ghost" size="sm" onClick={copyCredentials}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
              </div>
              <div className="space-y-2">
                <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm font-mono font-medium">{credentials?.email}</p></div>
                <div><span className="text-xs text-muted-foreground">Password</span><p className="text-sm font-mono font-medium">{credentials?.password}</p></div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {disabledRoles.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Disabled roles:</span> {disabledRoles.join(", ")}
                </div>
              )}
              {restrictedModules.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Restricted modules:</span> {restrictedModules.join(", ")}
                </div>
              )}
            </div>
            <Button className="w-full" variant="outline" onClick={() => { setOpen(false); reset(); }}>Done</Button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="px-6 pt-4">
              <div className="flex items-center gap-1">
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex;
                  const isComplete = i < stepIndex;
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <button
                        onClick={() => { if (i <= stepIndex) setCurrentStep(step.id); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full",
                          isActive && "bg-primary/10 text-primary border border-primary/30",
                          isComplete && "text-emerald-500 cursor-pointer",
                          !isActive && !isComplete && "text-muted-foreground"
                        )}
                      >
                        <step.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden sm:inline truncate">{step.label}</span>
                        {isComplete && <CheckCircle2 className="h-3 w-3 ml-auto shrink-0" />}
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={cn("h-px w-4 shrink-0 mx-1", isComplete ? "bg-emerald-500" : "bg-border")} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {currentStep === "info" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Studio Name *</Label>
                    <Input placeholder="Pixel Perfect Studios" value={form.studioName} onChange={(e) => setForm({ ...form, studioName: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Owner Email *</Label>
                      <Input type="email" placeholder="owner@studio.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="Min 6 chars" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input placeholder="Mumbai" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input placeholder="+91 9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Team Size</Label>
                    <Select value={form.teamSize} onValueChange={(v) => setForm({ ...form, teamSize: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {teamSizes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {currentStep === "plan" && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">Select a subscription plan for this studio.</p>
                  {plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No plans available yet.</p>
                  ) : (
                    <div className="grid gap-3">
                      {plans.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setForm({ ...form, planId: p.id })}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                            form.planId === p.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                            form.planId === p.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground">{p.name}</p>
                          </div>
                          {form.planId === p.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">You can skip this step — plan can be assigned later.</p>
                </div>
              )}

              {currentStep === "roles" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Toggle roles ON/OFF for this studio.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setDisabledRoles([])}>Enable All</Button>
                      <Button variant="outline" size="sm" onClick={() => setDisabledRoles(ALL_ROLES.filter(r => r.value !== "admin").map(r => r.value))}>Disable All</Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {ALL_ROLES.map((role) => {
                      const isAdmin = role.value === "admin";
                      const isEnabled = !disabledRoles.includes(role.value);
                      return (
                        <div key={role.value} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">{role.label}</span>
                            {isAdmin && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Required</Badge>}
                          </div>
                          <Switch checked={isEnabled} onCheckedChange={() => toggleRole(role.value)} disabled={isAdmin} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentStep === "modules" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Enable/disable modules for this studio.</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRestrictedModules([])}>Enable All</Button>
                      <Button variant="outline" size="sm" onClick={() => setRestrictedModules(ALL_MODULES.filter(m => !coreModules.includes(m.value)).map(m => m.value))}>Disable All</Button>
                    </div>
                  </div>
                  {Object.entries(moduleGroups).map(([group, modules]) => (
                    <div key={group} className="space-y-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group}</h4>
                      {modules.map((mod) => {
                        const isCore = coreModules.includes(mod.value);
                        const isEnabled = !restrictedModules.includes(mod.value);
                        return (
                          <div key={mod.value} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{mod.label}</span>
                              {isCore && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Core</Badge>}
                            </div>
                            <Switch checked={isEnabled} onCheckedChange={() => toggleModule(mod.value)} disabled={isCore} />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {currentStep === "review" && (() => {
                const selectedPlan = plans.find((p) => p.id === form.planId);
                const enabledRoles = ALL_ROLES.filter((r) => !disabledRoles.includes(r.value));
                const enabledModules = ALL_MODULES.filter((m) => !restrictedModules.includes(m.value));
                const disabledModules = ALL_MODULES.filter((m) => restrictedModules.includes(m.value));
                const teamLabel = teamSizes.find((t) => t.value === form.teamSize)?.label || form.teamSize;

                return (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Review everything before creating the studio.</p>

                    {/* Studio Info */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" /> Studio Info
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep("info")}>Edit</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium">{form.studioName}</p></div>
                        <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium font-mono text-xs">{form.email}</p></div>
                        {form.city && <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" /><span className="text-foreground text-xs">{form.city}</span></div>}
                        {form.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /><span className="text-foreground text-xs">{form.phone}</span></div>}
                        <div className="flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /><span className="text-foreground text-xs">{teamLabel}</span></div>
                      </div>
                    </div>

                    {/* Plan */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5" /> Plan
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep("plan")}>Edit</Button>
                      </div>
                      <p className="text-sm font-medium mt-1">{selectedPlan ? selectedPlan.name : <span className="text-muted-foreground italic">No plan selected</span>}</p>
                    </div>

                    {/* Roles */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" /> Roles ({enabledRoles.length}/{ALL_ROLES.length} active)
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep("roles")}>Edit</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.map((r) => {
                          const enabled = !disabledRoles.includes(r.value);
                          return (
                            <Badge key={r.value} variant={enabled ? "default" : "outline"}
                              className={cn("text-[10px]", !enabled && "opacity-40 line-through")}>
                              {r.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Modules */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Blocks className="h-3.5 w-3.5" /> Modules ({enabledModules.length}/{ALL_MODULES.length} active)
                        </h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCurrentStep("modules")}>Edit</Button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_MODULES.map((m) => {
                          const enabled = !restrictedModules.includes(m.value);
                          return (
                            <Badge key={m.value} variant={enabled ? "secondary" : "outline"}
                              className={cn("text-[10px]", !enabled && "opacity-40 line-through")}>
                              {m.label}
                            </Badge>
                          );
                        })}
                      </div>
                      {disabledModules.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">{disabledModules.length} module(s) will be restricted</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
              <div className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {STEPS.length}
              </div>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={prev}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                  </Button>
                )}
                {stepIndex < STEPS.length - 1 ? (
                  <Button size="sm" onClick={next} disabled={!canProceed()}>
                    Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleCreate} disabled={loading || !canProceed()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    {loading ? "Creating..." : "Create Studio"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
