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
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

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
    setSlideDir("left");
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
    if (idx < STEPS.length - 1) {
      setSlideDir("left");
      setCurrentStep(STEPS[idx + 1].id);
    }
  };
  const prev = () => {
    const idx = stepIndex;
    if (idx > 0) {
      setSlideDir("right");
      setCurrentStep(STEPS[idx - 1].id);
    }
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden p-0 gap-0 border-primary/10 shadow-2xl shadow-primary/5">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 bg-gradient-to-b from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {done ? "Studio Created!" : "New Studio Wizard"}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          /* Welcome Onboard Success */
          <div className="p-6 space-y-6 text-center">
            {/* Animated celebration */}
            <div className="relative flex flex-col items-center gap-4 py-6">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <div className="h-48 w-48 rounded-full bg-gradient-to-br from-primary via-emerald-500 to-primary animate-pulse" />
              </div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-2xl shadow-primary/30 animate-[bounce_1s_ease-in-out]">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div className="relative space-y-2">
                <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary via-emerald-400 to-primary bg-clip-text text-transparent">
                  Welcome Onboard! 🎉
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  <strong className="text-foreground">{form.studioName}</strong> is all set up and ready to create magic!
                </p>
              </div>
            </div>

            {/* Credentials card */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5 p-5 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Login Credentials</span>
                </div>
                <Button variant="ghost" size="sm" onClick={copyCredentials} className="text-primary hover:text-primary">
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2.5 border border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</span>
                    <p className="text-sm font-mono font-semibold text-foreground">{credentials?.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-background/80 px-3 py-2.5 border border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Password</span>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {showPassword ? credentials?.password : "••••••••"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {form.city && <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" />{form.city}</Badge>}
              <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{teamSizes.find(t => t.value === form.teamSize)?.label}</Badge>
              {disabledRoles.length > 0 && <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">{disabledRoles.length} roles disabled</Badge>}
              {restrictedModules.length > 0 && <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">{restrictedModules.length} modules restricted</Badge>}
            </div>

            <Button className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white shadow-lg shadow-primary/20" onClick={() => { setOpen(false); reset(); }}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Done — Let's Go!
            </Button>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="shrink-0 px-6 pt-4">
              <div className="flex items-center gap-0.5">
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex;
                  const isComplete = i < stepIndex;
                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <button
                        onClick={() => { if (i <= stepIndex) { setSlideDir(i < stepIndex ? "right" : "left"); setCurrentStep(step.id); } }}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all w-full group",
                          isActive && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                          isComplete && "bg-primary/10 text-primary cursor-pointer hover:bg-primary/15",
                          !isActive && !isComplete && "text-muted-foreground hover:text-foreground/60"
                        )}
                      >
                        <div className={cn(
                          "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-all",
                          isActive && "bg-primary-foreground/20",
                          isComplete && "bg-primary/15",
                          !isActive && !isComplete && "bg-muted"
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <step.icon className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span className="hidden sm:inline truncate">{step.label}</span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={cn(
                          "h-0.5 w-3 shrink-0 mx-0.5 rounded-full transition-colors",
                          isComplete ? "bg-primary" : "bg-border"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-1 w-full rounded-full bg-muted/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/70 transition-all duration-500 ease-out"
                    style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Content — fixed height scrollable area */}
            <div className="px-6 pt-4 pb-0">
              <div
                key={currentStep}
                className="overflow-y-auto max-h-[calc(90vh-280px)] pr-2 pb-4"
                style={{
                  animation: slideDir === "left"
                    ? "wizard-slide-left 0.25s ease-out"
                    : "wizard-slide-right 0.25s ease-out",
                }}
              >
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
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <span className="text-xs text-muted-foreground font-medium">
                Step {stepIndex + 1} of {STEPS.length} — <span className="text-foreground/70">{STEPS[stepIndex].label}</span>
              </span>
              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <Button variant="outline" size="sm" onClick={prev} className="gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>
                )}
                {stepIndex < STEPS.length - 1 ? (
                  <Button size="sm" onClick={next} disabled={!canProceed()} className="gap-1.5 shadow-md shadow-primary/20">
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleCreate} disabled={loading || !canProceed()} className="gap-1.5 shadow-md shadow-primary/20">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
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
