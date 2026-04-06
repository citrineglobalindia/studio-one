import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sampleTeamMembers, type TeamMember } from "@/data/wedding-types";
import { Camera, Video, Edit3, Users, Phone, Plus, UserPlus, Mail, MapPin, CreditCard, IndianRupee, Heart, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const allRoles: { value: TeamMember["role"]; label: string }[] = [
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "editor", label: "Editor" },
  { value: "drone-operator", label: "Drone Operator" },
  { value: "assistant", label: "Assistant" },
];

const initialForm = {
  name: "",
  phone: "",
  email: "",
  gender: "" as string,
  dateOfBirth: "",
  role: "photographer" as TeamMember["role"],
  type: "in-office" as TeamMember["type"],
  address: "",
  city: "",
  state: "",
  aadhaarNumber: "",
  panNumber: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  experience: "",
  specialization: "",
  dailyRate: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  joiningDate: "",
  notes: "",
};

function FormSection({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: typeof Camera;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

const TeamPage = () => {
  const [members, setMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const inOffice = members.filter((m) => m.type === "in-office");
  const vendors = members.filter((m) => m.type === "vendor");

  const updateForm = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    const member: TeamMember = {
      id: `t-${Date.now()}`,
      name: form.name.trim(),
      phone: form.phone || undefined,
      email: form.email || undefined,
      gender: form.gender as TeamMember["gender"] || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      role: form.role,
      type: form.type,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      aadhaarNumber: form.aadhaarNumber || undefined,
      panNumber: form.panNumber || undefined,
      bankAccountName: form.bankAccountName || undefined,
      bankAccountNumber: form.bankAccountNumber || undefined,
      bankIfsc: form.bankIfsc || undefined,
      experience: form.experience || undefined,
      specialization: form.specialization || undefined,
      dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      joiningDate: form.joiningDate || undefined,
      notes: form.notes || undefined,
    };
    setMembers((prev) => [...prev, member]);
    setAddOpen(false);
    setForm(initialForm);
    toast.success(`${member.name} added as ${form.type === "vendor" ? "Vendor" : "In-Office"} ${form.role}`);
  };

  const renderMember = (m: TeamMember) => {
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
            {m.email && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Mail className="h-3 w-3" />{m.email}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your in-office crew and external vendors.</p>
        </div>
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {allRoles.map(({ value: role, label }) => {
          const Icon = roleIcons[role] || Users;
          const count = members.filter((m) => m.role === role).length;
          return (
            <div key={role} className="rounded-lg bg-card border border-border p-3 text-center">
              <Icon className="h-4 w-4 mx-auto text-primary mb-1" />
              <div className="text-lg font-display font-bold text-foreground">{count}</div>
              <div className="text-[10px] text-muted-foreground">{label}s</div>
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

      {/* ═══ ADD MEMBER SHEET ═══ */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Add Team Member
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="px-6 py-5 space-y-4">

              {/* Member Type */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Member Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "in-office" as const, label: "In-Office", desc: "Full-time team" },
                    { value: "vendor" as const, label: "Vendor", desc: "External freelancer" },
                  ]).map((opt) => (
                    <button key={opt.value} onClick={() => updateForm("type", opt.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                        form.type === opt.value
                          ? "border-primary/40 bg-primary/10 shadow-sm"
                          : "border-border bg-card hover:border-primary/20"
                      )}>
                      <span className={cn("text-sm font-semibold", form.type === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Role *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allRoles.map(({ value, label }) => {
                    const Icon = roleIcons[value] || Users;
                    return (
                      <button key={value} onClick={() => updateForm("role", value)}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                          form.role === value
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/20"
                        )}>
                        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", form.role === value ? "bg-primary/20" : "bg-muted")}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── PERSONAL INFO ── */}
              <FormSection title="Personal Information" icon={UserPlus} defaultOpen={true}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Full Name *</Label>
                    <Input placeholder="e.g. Arjun Mehta" value={form.name} onChange={(e) => updateForm("name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone *</Label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input type="email" placeholder="arjun@example.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date of Birth</Label>
                    <Input type="date" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* ── ADDRESS ── */}
              <FormSection title="Address Details" icon={MapPin} defaultOpen={false}>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Address</Label>
                    <Textarea placeholder="Street address, locality..." className="min-h-[60px]" value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">City</Label>
                      <Input placeholder="Mumbai" value={form.city} onChange={(e) => updateForm("city", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State</Label>
                      <Input placeholder="Maharashtra" value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* ── IDENTITY & BANK ── */}
              <FormSection title="Identity & Bank Details" icon={CreditCard} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Aadhaar Number</Label>
                    <Input placeholder="XXXX XXXX XXXX" maxLength={14} value={form.aadhaarNumber} onChange={(e) => updateForm("aadhaarNumber", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">PAN Number</Label>
                    <Input placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={(e) => updateForm("panNumber", e.target.value)} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Bank Account Holder Name</Label>
                    <Input placeholder="Account holder name" value={form.bankAccountName} onChange={(e) => updateForm("bankAccountName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Account Number</Label>
                    <Input placeholder="Account number" value={form.bankAccountNumber} onChange={(e) => updateForm("bankAccountNumber", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">IFSC Code</Label>
                    <Input placeholder="SBIN0001234" value={form.bankIfsc} onChange={(e) => updateForm("bankIfsc", e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* ── PROFESSIONAL ── */}
              <FormSection title="Professional Details" icon={IndianRupee} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Experience</Label>
                    <Input placeholder="e.g. 5 years" value={form.experience} onChange={(e) => updateForm("experience", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Specialization</Label>
                    <Input placeholder="e.g. Candid, Traditional" value={form.specialization} onChange={(e) => updateForm("specialization", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Daily Rate (₹)</Label>
                    <Input type="number" placeholder="5000" value={form.dailyRate} onChange={(e) => updateForm("dailyRate", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Joining Date</Label>
                    <Input type="date" value={form.joiningDate} onChange={(e) => updateForm("joiningDate", e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* ── EMERGENCY CONTACT ── */}
              <FormSection title="Emergency Contact" icon={Heart} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact Name</Label>
                    <Input placeholder="Emergency contact name" value={form.emergencyContactName} onChange={(e) => updateForm("emergencyContactName", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contact Phone</Label>
                    <Input placeholder="+91 98765 43210" value={form.emergencyContactPhone} onChange={(e) => updateForm("emergencyContactPhone", e.target.value)} />
                  </div>
                </div>
              </FormSection>

              {/* ── NOTES ── */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Additional Notes</Label>
                <Textarea placeholder="Any additional notes about this team member..." className="min-h-[60px]" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
              </div>

              {/* Preview */}
              {form.name && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {form.name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{form.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {form.role.replace("-", " ")} · {form.type === "vendor" ? "Vendor" : "In-Office"}
                        {form.dailyRate && ` · ₹${form.dailyRate}/day`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TeamPage;
