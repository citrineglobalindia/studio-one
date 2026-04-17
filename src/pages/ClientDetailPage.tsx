import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Phone, Mail, MapPin, Crown, ArrowLeft, CalendarDays, Sparkles, Heart,
  Briefcase, Receipt, PartyPopper, Plus, MoreHorizontal, Edit, Trash2, Copy,
  Share2, Loader2, Camera, Video, ClipboardList, FileText, UsersRound,
  Save, X, Gift, CalendarCheck, Cake, Home, MessageSquare, Upload,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { SlidersHorizontal } from "lucide-react";
import { useEventTeamAssignments } from "@/hooks/useEventTeamAssignments";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
} as const;
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  active: { label: "Active",    color: "text-emerald-600", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
  vip:    { label: "VIP",       color: "text-primary",     bg: "bg-primary/10",     ring: "ring-primary/30" },
  completed: { label: "Completed", color: "text-muted-foreground", bg: "bg-muted",  ring: "ring-border" },
  "on-hold": { label: "On Hold",   color: "text-amber-600",     bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
};

// Loose client shape — includes the new columns that may not exist in DbClient type yet.
type AnyClient = Record<string, any> & {
  id: string;
  organization_id: string;
  name: string;
  partner_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  event_type: string | null;
  event_date: string | null;
  delivery_date: string | null;
  source: string | null;
  status: string;
  budget: number | null;
  notes: string | null;
  created_at: string;
};

// ---- helpers ----
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

const initials = (n: string) => n.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const ageFromDOB = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { organization } = useOrg();
  const { clients, isLoading, updateClient, deleteClient } = useClients();
  const { invoices } = useInvoices();
  const { projects, updateProject } = useProjects();
  const { events: dbEvents, updateEvent } = useEvents();
  const { byEvent: assignmentsByEvent } = useEventTeamAssignments();
  const { members: dbTeamMembers } = useTeamMembers();

  const client = clients.find((c: any) => c.id === id) as AnyClient | undefined;

  // ---- inline edit state ----
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    partner_name: "",
    phone: "",
    partner_phone: "",
    email: "",
    partner_email: "",
    address: "",
    city: "",
    date_of_birth: "",
    partner_date_of_birth: "",
    engagement_date: "",
    marriage_date: "",
    event_date: "",
    delivery_date: "",
    notes: "",
  });

  // Seed form when client changes
  useEffect(() => {
    if (!client) return;
    setForm({
      name: client.name ?? "",
      partner_name: client.partner_name ?? "",
      phone: client.phone ?? "",
      partner_phone: client.partner_phone ?? "",
      email: client.email ?? "",
      partner_email: client.partner_email ?? "",
      address: client.address ?? "",
      city: client.city ?? "",
      date_of_birth: client.date_of_birth ?? "",
      partner_date_of_birth: client.partner_date_of_birth ?? "",
      engagement_date: client.engagement_date ?? "",
      marriage_date: client.marriage_date ?? "",
      event_date: client.event_date ?? "",
      delivery_date: client.delivery_date ?? "",
      notes: client.notes ?? "",
    });
  }, [client]);

  // ---- uploads ----
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  async function uploadMedia(kind: "photo" | "video", file: File) {
    if (!organization?.id || !client?.id) {
      toast.error("No studio loaded");
      return null;
    }
    const ext = (file.name.split(".").pop() || (kind === "photo" ? "jpg" : "mp4")).toLowerCase();
    const prefix = kind === "photo" ? "photo" : "feedback";
    const path = `${organization.id}/${client.id}/${prefix}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("client-media")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (upErr) {
      toast.error(`Upload failed: ${upErr.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from("client-media").getPublicUrl(path);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !client) return;
    if (file.size > 4 * 1024 * 1024) return toast.error("Photo must be under 4 MB");
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");

    setPhotoUploading(true);
    const url = await uploadMedia("photo", file);
    if (url) {
      updateClient.mutate({ id: client.id, photo_url: url } as any, {
        onSuccess: () => toast.success("Photo updated"),
      });
    }
    setPhotoUploading(false);
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !client) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("Video must be under 50 MB");
    if (!file.type.startsWith("video/")) return toast.error("Please choose a video");

    setVideoUploading(true);
    const url = await uploadMedia("video", file);
    if (url) {
      updateClient.mutate({ id: client.id, feedback_video_url: url } as any, {
        onSuccess: () => toast.success("Feedback video uploaded"),
      });
    }
    setVideoUploading(false);
  }

  // ---- save details ----
  async function handleSave() {
    if (!client) return;
    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setSaving(true);
    updateClient.mutate(
      {
        id: client.id,
        name: form.name.trim(),
        partner_name: form.partner_name || null,
        phone: form.phone || null,
        partner_phone: form.partner_phone || null,
        email: form.email || null,
        partner_email: form.partner_email || null,
        address: form.address || null,
        city: form.city || null,
        date_of_birth: form.date_of_birth || null,
        partner_date_of_birth: form.partner_date_of_birth || null,
        engagement_date: form.engagement_date || null,
        marriage_date: form.marriage_date || null,
        event_date: form.event_date || null,
        delivery_date: form.delivery_date || null,
        notes: form.notes || null,
      } as any,
      {
        onSuccess: () => {
          setEditing(false);
          setSaving(false);
        },
        onError: () => setSaving(false),
      }
    );
  }

  // ---- financials ----
  const clientInvoices = useMemo(
    () => invoices.filter((inv: any) => inv.client_id === id),
    [invoices, id]
  );
  const clientProjects = useMemo(
    () => projects.filter((p: any) => p.client_id === id),
    [projects, id]
  );

  // Merge project-linked events AND events from the events table for this client
  const clientEvents = useMemo(() => {
    const fromProjects = clientProjects
      .filter((p: any) => p.event_date)
      .map((p: any) => ({
        id: p.id,
        source: "project" as const,
        name: p.project_name,
        date: p.event_date,
        venue: p.venue || "",
        type: p.event_type || "Event",
        status: p.status || "planning",
      }));
    const fromEvents = dbEvents
      .filter((e: any) => e.client_id === id)
      .map((e: any) => ({
        id: e.id,
        source: "event" as const,
        name: e.name,
        date: e.event_date,
        venue: e.venue || "",
        type: e.event_type || "Event",
        status: e.status || "upcoming",
        start_time: e.start_time,
        end_time: e.end_time,
      }));
    return [...fromProjects, ...fromEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [clientProjects, dbEvents, id]);
  const totalInvoiced = clientInvoices.reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0);
  const totalPaid = clientInvoices.reduce((s: number, inv: any) => s + (inv.amount_paid || 0), 0);
  const totalDue = totalInvoiced - totalPaid;
  const paidPercent = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  // ---- process steps ----
  const [processSteps, setProcessSteps] = useState<any[]>([]);
  useEffect(() => {
    if (!client?.id) return;
    supabase
      .from("client_process_steps")
      .select("*")
      .eq("client_id", client.id)
      .order("step_number", { ascending: true })
      .then(({ data }) => setProcessSteps(data || []));
  }, [client?.id]);

  // ---- aggregated team members across client's projects AND events ----
  // Pulls from two sources:
  //   (1) legacy projects.assigned_team TEXT[] (names)
  //   (2) event_team_assignments (real team_member rows) for this client's events & projects
  const teamMembers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string }>();

    // From projects.assigned_team (legacy — just names)
    for (const p of clientProjects) {
      (p.assigned_team || []).forEach((name: string) => {
        if (!name) return;
        // Prefer a team-member row match if we have one (so role/initials are real)
        const match = dbTeamMembers.find((m: any) => m.full_name === name);
        const id = match ? match.id : `name:${name}`;
        if (!map.has(id)) map.set(id, { id, name: match ? match.full_name : name, role: match ? match.role : "Crew" });
      });
    }

    // From event_team_assignments for everything related to this client
    const byEventMap = assignmentsByEvent();
    const relevantEventIds = [
      ...clientProjects.map((p: any) => p.id),
      ...dbEvents.filter((e: any) => e.client_id === id).map((e: any) => e.id),
    ];
    for (const eid of relevantEventIds) {
      const memberIds = byEventMap[eid] || [];
      for (const mid of memberIds) {
        const m = dbTeamMembers.find((x: any) => x.id === mid);
        if (m && !map.has(m.id)) {
          map.set(m.id, { id: m.id, name: m.full_name, role: m.role });
        }
      }
    }

    return Array.from(map.values());
  }, [clientProjects, dbEvents, assignmentsByEvent, dbTeamMembers, id]);

  // ---- loading / not-found ----
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-foreground font-medium">Client not found</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[client.status] || statusConfig.active;
  const coupleName = client.partner_name ? `${client.name} & ${client.partner_name}` : client.name;
  const clientAge = ageFromDOB(client.date_of_birth);
  const partnerAge = ageFromDOB(client.partner_date_of_birth);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-5 pb-10">
      {/* Top bar */}
      <motion.div variants={cardVariants} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">Client Profile</p>
          <h1 className="text-lg sm:text-xl font-display font-bold text-foreground truncate">{coupleName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving" : "Save"}
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(`${coupleName} — ${client.phone || ""} ${client.email || ""}`);
                toast.success("Copied to clipboard");
              }}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy Details
              </DropdownMenuItem>
              <DropdownMenuItem><Share2 className="h-3.5 w-3.5 mr-2" /> Share Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (!window.confirm(`Delete ${coupleName}? This can't be undone.`)) return;
                  deleteClient.mutate(client.id, { onSuccess: () => navigate("/clients") });
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* ═════════════════ HERO ═════════════════ */}
      <motion.div variants={cardVariants} className="relative rounded-3xl overflow-hidden border border-border">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-rose-400/10 to-amber-300/10" />
        <div className="absolute -top-16 -right-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-rose-400/15 blur-3xl" />

        <div className="relative p-6 md:p-8 grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6 items-center">
          {/* Photo */}
          <div className="relative group shrink-0 mx-auto md:mx-0">
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-3xl bg-background/60 backdrop-blur border-4 border-background shadow-2xl overflow-hidden flex items-center justify-center">
              {client.photo_url ? (
                <img src={client.photo_url} alt={coupleName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary">{initials(coupleName)}</span>
              )}
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute -bottom-1 -right-1 h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background hover:scale-105 transition-transform disabled:opacity-70"
              title="Upload photo"
            >
              {photoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            {client.status === "vip" && (
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-2xl bg-gradient-to-br from-amber-400 to-primary flex items-center justify-center shadow-lg border-4 border-background">
                <Crown className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Names + date badges */}
          <div className="text-center md:text-left min-w-0">
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-foreground leading-tight">
              {coupleName}
            </h2>
            <div className="flex items-center gap-2 justify-center md:justify-start mt-1.5 flex-wrap text-xs text-muted-foreground">
              {client.city && (<><MapPin className="h-3.5 w-3.5" /> {client.city}</>)}
              {client.source && (<><span>·</span><Sparkles className="h-3.5 w-3.5" /> {client.source}</>)}
              {client.event_type && (<><span>·</span><PartyPopper className="h-3.5 w-3.5" /> {client.event_type}</>)}
            </div>

            {/* Date pills */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {client.engagement_date && (
                <DatePill icon={<Gift className="h-3.5 w-3.5" />} label="Engagement" value={fmtDate(client.engagement_date)} tint="emerald" />
              )}
              {client.marriage_date && (
                <DatePill icon={<Heart className="h-3.5 w-3.5" />} label="Marriage" value={fmtDate(client.marriage_date)} tint="rose" />
              )}
              {client.event_date && !client.marriage_date && (
                <DatePill icon={<CalendarCheck className="h-3.5 w-3.5" />} label="Event" value={fmtDate(client.event_date)} tint="primary" />
              )}
              {client.date_of_birth && (
                <DatePill icon={<Cake className="h-3.5 w-3.5" />} label={`${client.name.split(" ")[0]}'s Birthday`} value={fmtDate(client.date_of_birth) + (clientAge ? ` (${clientAge})` : "")} tint="amber" />
              )}
              {client.partner_date_of_birth && client.partner_name && (
                <DatePill icon={<Cake className="h-3.5 w-3.5" />} label={`${client.partner_name.split(" ")[0]}'s Birthday`} value={fmtDate(client.partner_date_of_birth) + (partnerAge ? ` (${partnerAge})` : "")} tint="blue" />
              )}
            </div>
          </div>

          {/* Status + quick contact */}
          <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
            <Badge className={cn("text-[11px] px-3 py-1 rounded-full font-semibold ring-1", cfg.bg, cfg.color, cfg.ring)}>
              {client.status === "vip" && <Crown className="h-3 w-3 mr-1 inline" />}
              {cfg.label}
            </Badge>
            <div className="flex items-center gap-2">
              {client.phone && (
                <a href={`tel:${client.phone}`} className="h-9 w-9 rounded-xl bg-background/80 border border-border flex items-center justify-center hover:border-primary/40 transition-colors" title={client.phone}>
                  <Phone className="h-4 w-4 text-foreground" />
                </a>
              )}
              {client.phone && (
                <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="h-9 w-9 rounded-xl bg-background/80 border border-border flex items-center justify-center hover:border-primary/40 transition-colors" title="WhatsApp">
                  <MessageSquare className="h-4 w-4 text-foreground" />
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="h-9 w-9 rounded-xl bg-background/80 border border-border flex items-center justify-center hover:border-primary/40 transition-colors" title={client.email}>
                  <Mail className="h-4 w-4 text-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═════════════════ FINANCIALS ═════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="BUDGET"    value={`₹${((client.budget || 0) / 1000).toFixed(0)}K`}     tint="bg-primary/5 ring-primary/15" />
        <StatCard label="INVOICED"  value={`₹${(totalInvoiced / 1000).toFixed(0)}K`}            tint="bg-blue-500/5 ring-blue-500/15" />
        <StatCard label="RECEIVED"  value={`₹${(totalPaid / 1000).toFixed(0)}K`}  valueColor="text-emerald-600" tint="bg-emerald-500/5 ring-emerald-500/15" />
        <StatCard label="DUE"       value={`₹${(totalDue / 1000).toFixed(0)}K`}   valueColor="text-amber-600"   tint="bg-amber-500/5 ring-amber-500/15" />
      </div>

      {totalInvoiced > 0 && (
        <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Payment Progress</span>
            <span className="text-xs font-bold text-foreground tabular-nums">{paidPercent}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${paidPercent}%` }} transition={{ duration: 1.2 }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
          </div>
        </motion.div>
      )}

      {/* ═════════════════ TABS ═════════════════ */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <Tabs defaultValue="overview">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-1 h-auto p-0 px-3 overflow-x-auto">
            {[
              { value: "overview",  icon: Users,              label: "Overview" },
              { value: "manage",    icon: SlidersHorizontal,  label: "Manage" },
              { value: "projects",  icon: Briefcase,          label: "Projects",  count: clientProjects.length },
              { value: "invoices",  icon: Receipt,            label: "Invoices",  count: clientInvoices.length },
              { value: "events",    icon: CalendarDays,       label: "Events",    count: clientEvents.length },
              { value: "process",   icon: ClipboardList,      label: "Process",   count: processSteps.length },
              { value: "contracts", icon: FileText,           label: "Contracts" },
              { value: "team",      icon: UsersRound,         label: "Team",      count: teamMembers.length },
              { value: "feedback",  icon: Video,              label: "Feedback" },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 py-3 gap-1.5 text-xs font-medium whitespace-nowrap"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {typeof t.count === "number" && (
                  <Badge variant="secondary" className="text-[9px] h-4 min-w-[16px] px-1 ml-0.5 rounded-full">{t.count}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-5">
            {/* ───── MANAGE (hierarchy: client → project → events table) ───── */}
            <TabsContent value="manage" className="mt-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" /> Projects &amp; Events ({clientProjects.length} / {dbEvents.filter((e: any) => e.client_id === id).length})
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/events")}>
                    <CalendarDays className="h-3.5 w-3.5" /> Add Event
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/projects")}>
                    <Plus className="h-3.5 w-3.5" /> New Project
                  </Button>
                </div>
              </div>

              {clientProjects.length === 0 && dbEvents.filter((e: any) => e.client_id === id).length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No projects or events for this client yet.
                </div>
              )}

              {clientProjects.map((p: any) => (
                <ProjectManageRow
                  key={p.id}
                  project={p}
                  events={(dbEvents as any[]).filter((e) => e.client_id === id && (e.project_id === p.id || !e.project_id))}
                  teamMembers={dbTeamMembers}
                  assignmentsByEvent={assignmentsByEvent}
                  onSave={(patch) => updateProject.mutate({ id: p.id, ...(patch as any) })}
                  onSaveEvent={(eid, patch) => updateEvent.mutate({ id: eid, ...(patch as any) })}
                />
              ))}

              {/* Orphan events: belong to this client but not linked to any listed project */}
              {(() => {
                const linkedEventIds = new Set<string>();
                for (const p of clientProjects) {
                  for (const e of dbEvents as any[]) {
                    if (e.client_id === id && (e.project_id === p.id || !e.project_id)) linkedEventIds.add(e.id);
                  }
                }
                const orphans = (dbEvents as any[]).filter((e) => e.client_id === id && !linkedEventIds.has(e.id));
                if (orphans.length === 0) return null;
                return (
                  <div className="rounded-xl border border-dashed border-border p-4 mt-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Events not tied to any listed project</p>
                    {orphans.map((e: any) => (
                      <EventManageRow
                        key={e.id}
                        event={e}
                        teamMembers={dbTeamMembers}
                        assignmentsByEvent={assignmentsByEvent}
                        onSave={(patch) => updateEvent.mutate({ id: e.id, ...(patch as any) })}
                      />
                    ))}
                  </div>
                );
              })()}
            </TabsContent>

            {/* ───── OVERVIEW ───── */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailCard icon={<Phone className="h-4 w-4" />} title={`${client.name.split(" ")[0] || "Client"} — Contact`}>
                  <DetailField label="Phone"  value={editing ? <Input value={form.phone}   onChange={(e) => setForm({ ...form, phone:   e.target.value })} placeholder="+91 …" /> : (client.phone || "—")} />
                  <DetailField label="Email"  value={editing ? <Input value={form.email}   onChange={(e) => setForm({ ...form, email:   e.target.value })} placeholder="…@…" /> : (client.email || "—")} />
                  <DetailField label="Date of Birth" value={editing ? <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /> : (fmtDate(client.date_of_birth) || "—")} />
                </DetailCard>

                <DetailCard icon={<Heart className="h-4 w-4" />} title={`${client.partner_name?.split(" ")[0] || "Partner"} — Contact`}>
                  <DetailField label="Name"  value={editing ? <Input value={form.partner_name}  onChange={(e) => setForm({ ...form, partner_name:  e.target.value })} placeholder="Partner's name" /> : (client.partner_name || "—")} />
                  <DetailField label="Phone" value={editing ? <Input value={form.partner_phone} onChange={(e) => setForm({ ...form, partner_phone: e.target.value })} placeholder="+91 …" /> : (client.partner_phone || "—")} />
                  <DetailField label="Email" value={editing ? <Input value={form.partner_email} onChange={(e) => setForm({ ...form, partner_email: e.target.value })} placeholder="…@…" /> : (client.partner_email || "—")} />
                  <DetailField label="Date of Birth" value={editing ? <Input type="date" value={form.partner_date_of_birth} onChange={(e) => setForm({ ...form, partner_date_of_birth: e.target.value })} /> : (fmtDate(client.partner_date_of_birth) || "—")} />
                </DetailCard>

                <DetailCard icon={<Home className="h-4 w-4" />} title="Address">
                  {editing ? (
                    <>
                      <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows={3} />
                      <div className="mt-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">City</Label>
                        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{client.address || "—"}</p>
                      {client.city && <p className="text-xs text-muted-foreground mt-1">{client.city}</p>}
                    </>
                  )}
                </DetailCard>

                <DetailCard icon={<CalendarDays className="h-4 w-4" />} title="Key Dates">
                  <DetailField label="Engagement"  value={editing ? <Input type="date" value={form.engagement_date} onChange={(e) => setForm({ ...form, engagement_date: e.target.value })} /> : (fmtDate(client.engagement_date) || "—")} />
                  <DetailField label="Marriage"    value={editing ? <Input type="date" value={form.marriage_date}   onChange={(e) => setForm({ ...form, marriage_date:   e.target.value })} /> : (fmtDate(client.marriage_date) || "—")} />
                  <DetailField label="Main Event"  value={editing ? <Input type="date" value={form.event_date}      onChange={(e) => setForm({ ...form, event_date:      e.target.value })} /> : (fmtDate(client.event_date) || "—")} />
                  <DetailField label="Delivery"    value={editing ? <Input type="date" value={form.delivery_date}   onChange={(e) => setForm({ ...form, delivery_date:   e.target.value })} /> : (fmtDate(client.delivery_date) || "—")} />
                </DetailCard>
              </div>

              <DetailCard icon={<FileText className="h-4 w-4" />} title="Notes">
                {editing ? (
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} placeholder="Any special preferences or requirements..." />
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes || "—"}</p>
                )}
              </DetailCard>
            </TabsContent>

            {/* ───── PROJECTS ───── */}
            <TabsContent value="projects" className="mt-0 space-y-3">
              {clientProjects.length === 0 ? (
                <EmptyState icon={<Briefcase className="h-10 w-10" />} text="No projects yet" actionLabel="Create Project" onAction={() => navigate("/projects")} />
              ) : clientProjects.map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.project_name}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {p.event_type && <span>{p.event_type}</span>}
                        {p.event_date && <span>· {fmtDate(p.event_date)}</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                  </div>
                  {(p.total_amount || 0) > 0 && (
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Total: <span className="font-bold text-foreground">₹{((p.total_amount || 0) / 1000).toFixed(0)}K</span></span>
                      <span className="text-muted-foreground">Paid: <span className="font-bold text-emerald-500">₹{((p.amount_paid || 0) / 1000).toFixed(0)}K</span></span>
                    </div>
                  )}
                </motion.div>
              ))}
            </TabsContent>

            {/* ───── INVOICES ───── */}
            <TabsContent value="invoices" className="mt-0 space-y-2.5">
              {clientInvoices.length === 0 ? (
                <EmptyState icon={<Receipt className="h-10 w-10" />} text="No invoices yet" actionLabel="Create Invoice" onAction={() => navigate("/invoices")} />
              ) : clientInvoices.map((inv: any, i: number) => (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-xs font-mono text-muted-foreground font-medium">{inv.invoice_number}</span>
                        <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-full font-semibold">{inv.status}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{inv.project_name || inv.client_name}</p>
                      {inv.due_date && <p className="text-[11px] text-muted-foreground mt-1">Due: {fmtDate(inv.due_date)}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-foreground tabular-nums">₹{(inv.total_amount || 0).toLocaleString("en-IN")}</p>
                      {inv.amount_paid > 0 && inv.amount_paid < inv.total_amount && (
                        <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">Paid: ₹{inv.amount_paid.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </TabsContent>

            {/* ───── EVENTS (from events table + projects with an event_date) ───── */}
            <TabsContent value="events" className="mt-0 space-y-3">
              {clientEvents.length === 0 ? (
                <EmptyState icon={<CalendarDays className="h-10 w-10" />} text="No scheduled events" subtext="Add events on the Events page — they'll appear here automatically." actionLabel="Go to Events" onAction={() => navigate("/events")} />
              ) : clientEvents.map((e, i) => {
                const assignedIds = assignmentsByEvent()[e.id] || [];
                const assignedMembers = assignedIds
                  .map((id) => dbTeamMembers.find((m: any) => m.id === id))
                  .filter(Boolean) as any[];
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border p-4 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="h-14 w-14 rounded-xl bg-primary/15 flex flex-col items-center justify-center text-primary shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(e.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                      <span className="text-xl font-black leading-none">{new Date(e.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{e.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {e.type || "Event"} · {e.venue || "Venue TBD"}
                        {(e as any).start_time && ` · ${String((e as any).start_time).slice(0, 5)}`}
                      </p>
                      {assignedMembers.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2">
                            {assignedMembers.slice(0, 5).map((m: any) => (
                              <div key={m.id} className="h-6 w-6 rounded-full bg-primary/15 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary" title={`${m.full_name} — ${m.role}`}>
                                {String(m.full_name).split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("")}
                              </div>
                            ))}
                            {assignedMembers.length > 5 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                                +{assignedMembers.length - 5}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {assignedMembers.map((m: any) => m.full_name).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px] capitalize">{e.status}</Badge>
                      {e.source === "event" && <Badge variant="secondary" className="text-[9px]">event</Badge>}
                      {e.source === "project" && <Badge variant="secondary" className="text-[9px]">project</Badge>}
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* ───── PROCESS PLAN ───── */}
            <TabsContent value="process" className="mt-0 space-y-2">
              {processSteps.length === 0 ? (
                <EmptyState icon={<ClipboardList className="h-10 w-10" />} text="No process plan yet" actionLabel="Build Process Plan" onAction={() => navigate("/process-planner")} />
              ) : processSteps.map((s: any, i: number) => {
                const done = s.status === "completed";
                const inProg = s.status === "in_progress";
                return (
                  <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={cn("flex items-start gap-4 rounded-xl border p-4", done ? "bg-emerald-500/5 border-emerald-500/30" : inProg ? "bg-primary/5 border-primary/30" : "bg-card border-border")}>
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                      done ? "bg-emerald-500 text-white" : inProg ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {s.step_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-semibold text-foreground", done && "line-through opacity-70")}>{s.heading}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {(s.events || []).map((ev: string) => <Badge key={ev} variant="outline" className="text-[10px]">{ev}</Badge>)}
                      </div>
                    </div>
                    {s.deadline && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmtDate(s.deadline)}</span>}
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* ───── CONTRACTS (placeholder — contracts table not implemented yet) ───── */}
            <TabsContent value="contracts" className="mt-0">
              <EmptyState icon={<FileText className="h-10 w-10" />} text="No contracts yet" subtext="Contract management is coming soon." />
            </TabsContent>

            {/* ───── TEAM (from projects + event_team_assignments) ───── */}
            <TabsContent value="team" className="mt-0">
              {teamMembers.length === 0 ? (
                <EmptyState icon={<UsersRound className="h-10 w-10" />} text="No team assigned" subtext="Assign team to any of this client's projects or events and they'll appear here." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {teamMembers.map((m, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex flex-col items-center p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-rose-400/20 flex items-center justify-center text-sm font-bold text-primary">
                        {initials(m.name)}
                      </div>
                      <p className="text-sm font-medium text-foreground mt-2 text-center">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground text-center capitalize">{m.role}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ───── FEEDBACK VIDEO ───── */}
            <TabsContent value="feedback" className="mt-0 space-y-4">
              {client.feedback_video_url ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video">
                    <video src={client.feedback_video_url} controls className="h-full w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => videoInputRef.current?.click()} disabled={videoUploading}>
                      {videoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {videoUploading ? "Uploading..." : "Replace video"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive"
                      onClick={() => updateClient.mutate({ id: client.id, feedback_video_url: null } as any)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border text-center">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <Video className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Upload a feedback video</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">Testimonials from happy clients make the best case studies. Max 50 MB.</p>
                  <Button className="gap-1.5 mt-4" onClick={() => videoInputRef.current?.click()} disabled={videoUploading}>
                    {videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {videoUploading ? "Uploading..." : "Choose video"}
                  </Button>
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

// ───── sub-components ─────

function DatePill({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: "primary" | "rose" | "emerald" | "amber" | "blue" }) {
  const tints: Record<string, string> = {
    primary:  "bg-primary/10 text-primary ring-primary/25",
    rose:     "bg-rose-500/10 text-rose-600 ring-rose-500/25",
    emerald:  "bg-emerald-500/10 text-emerald-600 ring-emerald-500/25",
    amber:    "bg-amber-500/10 text-amber-700 ring-amber-500/25",
    blue:     "bg-blue-500/10 text-blue-600 ring-blue-500/25",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium ring-1 backdrop-blur-sm bg-background/60", tints[tint])}>
      {icon}
      <span className="text-foreground/70 font-semibold">{label}</span>
      <span>·</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function StatCard({ label, value, tint, valueColor = "text-foreground" }: { label: string; value: string; tint: string; valueColor?: string }) {
  return (
    <div className={cn("rounded-2xl p-4 border border-border ring-1", tint)}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{label}</p>
      <p className={cn("text-xl font-display font-extrabold mt-1.5 tracking-tight", valueColor)}>{value}</p>
    </div>
  );
}

function DetailCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function EmptyState({ icon, text, subtext, actionLabel, onAction }: {
  icon: React.ReactNode; text: string; subtext?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto text-muted-foreground/30 mb-3">{icon}</div>
      <p className="text-sm text-foreground font-medium">{text}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{subtext}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-full" onClick={onAction}>
          <Plus className="h-3.5 w-3.5" /> {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Inline-editable rows for the Manage tab
// ─────────────────────────────────────────────────────────────────────

const PROJECT_STATUS_OPTIONS = ["planning", "booked", "in_progress", "editing", "delivered", "completed"];
const EVENT_STATUS_OPTIONS   = ["upcoming", "in-progress", "completed", "cancelled"];
const STAGE_OPTIONS          = ["pending", "in-progress", "done"];
const PAYMENT_OPTIONS        = ["pending", "partial", "paid"];
const DELIVERY_OPTIONS       = ["pending", "delivered", "on-hold"];
const QUOTATION_STATUS_OPTIONS = ["pending", "sent", "accepted", "rejected"];

// Stages used to compute the per-event "Delivery %" column
const EVENT_STAGE_KEYS = [
  "data_copy_status",
  "backup_status",
  "delivery_hdd_status",
  "video_editing_status",
  "album_design_status",
  "delivery_status",
] as const;

function computeEventProgress(ev: any): number {
  let done = 0;
  let total = 0;
  for (const k of EVENT_STAGE_KEYS) {
    total++;
    const v = ev[k];
    if (v === "done" || v === "delivered" || v === "completed") done++;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Tiny inline <select> so we don't have to repeat Tailwind classes 15 times
const StageSelect = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize">
    {options.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
  </select>
);

function ProjectManageRow({
  project,
  onSave,
  events = [],
  teamMembers = [],
  assignmentsByEvent,
  onSaveEvent,
}: {
  project: any;
  onSave: (patch: any) => void;
  events?: any[];
  teamMembers?: any[];
  assignmentsByEvent?: () => Record<string, string[]>;
  onSaveEvent?: (eventId: string, patch: any) => void;
}) {
  const [open, setOpen] = useState(true);
  const initial = {
    project_name:           project.project_name           ?? "",
    event_type:             project.event_type             ?? "",
    event_date:             project.event_date             ?? "",
    delivery_date:          project.delivery_date          ?? "",
    venue:                  project.venue                  ?? "",
    status:                 project.status                 ?? "planning",
    total_amount:           String(project.total_amount    ?? ""),
    amount_paid:            String(project.amount_paid     ?? ""),
    card_number:            project.card_number            ?? "",
    raw_data_size:          project.raw_data_size          ?? "",
    backup_number:          project.backup_number          ?? "",
    delivery_hdd:           project.delivery_hdd           ?? "",
    notes:                  project.notes                  ?? "",
    service_taken:          project.service_taken          ?? "",
    album_sheets:           String(project.album_sheets    ?? ""),
    data_backup_status:     project.data_backup_status     ?? "pending",
    first_delivery_date:    project.first_delivery_date    ?? "",
    payment_status:         project.payment_status         ?? "pending",
    delivery_status:        project.delivery_status        ?? "pending",
    follow_up_call:         project.follow_up_call         ?? "",
    video_progress:         project.video_progress         ?? "pending",
    album_design_status:    project.album_design_status    ?? "pending",
    album_print_status:     project.album_print_status     ?? "pending",
    final_delivery_date:    project.final_delivery_date    ?? "",
    final_delivery_status:  project.final_delivery_status  ?? "pending",
    final_payment_status:   project.final_payment_status   ?? "pending",
    data_filtration_status: project.data_filtration_status ?? "pending",
  };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const handleSave = () => {
    onSave({
      project_name:           form.project_name,
      event_type:             form.event_type || null,
      event_date:             form.event_date || null,
      delivery_date:          form.delivery_date || null,
      venue:                  form.venue || null,
      status:                 form.status,
      total_amount:           form.total_amount ? Number(form.total_amount) : 0,
      amount_paid:            form.amount_paid  ? Number(form.amount_paid)  : 0,
      card_number:            form.card_number || null,
      raw_data_size:          form.raw_data_size || null,
      backup_number:          form.backup_number || null,
      delivery_hdd:           form.delivery_hdd || null,
      notes:                  form.notes || null,
      service_taken:          form.service_taken || null,
      album_sheets:           form.album_sheets ? Number(form.album_sheets) : null,
      data_backup_status:     form.data_backup_status,
      first_delivery_date:    form.first_delivery_date || null,
      payment_status:         form.payment_status,
      delivery_status:        form.delivery_status,
      follow_up_call:         form.follow_up_call || null,
      video_progress:         form.video_progress,
      album_design_status:    form.album_design_status,
      album_print_status:     form.album_print_status,
      final_delivery_date:    form.final_delivery_date || null,
      final_delivery_status:  form.final_delivery_status,
      final_payment_status:   form.final_payment_status,
      data_filtration_status: form.data_filtration_status,
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card mb-3 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">{project.project_name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{project.status} · ₹{((project.amount_paid || 0) / 1000).toFixed(0)}K / ₹{((project.total_amount || 0) / 1000).toFixed(0)}K</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Unsaved</Badge>}
          <span className="text-muted-foreground text-xs">{open ? "Hide" : "Edit"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Project Name</Label><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Event Type</Label><Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="Wedding" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Event Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Date</Label><Input type="date" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>

            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {PROJECT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Amount (₹)</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Amount Paid (₹)</Label><Input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} /></div>
          </div>

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2">Production Tracking</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Card Number</Label><Input value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} placeholder="SD-01" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Raw Data Size</Label><Input value={form.raw_data_size} onChange={(e) => setForm({ ...form, raw_data_size: e.target.value })} placeholder="e.g. 1.2 TB" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Backup Number</Label><Input value={form.backup_number} onChange={(e) => setForm({ ...form, backup_number: e.target.value })} placeholder="B-01" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Delivery HDD</Label><Input value={form.delivery_hdd} onChange={(e) => setForm({ ...form, delivery_hdd: e.target.value })} placeholder="HDD-05" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Service Taken</Label><Input value={form.service_taken} onChange={(e) => setForm({ ...form, service_taken: e.target.value })} placeholder="e.g. Photography + Video" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Album Sheets</Label><Input type="number" value={form.album_sheets} onChange={(e) => setForm({ ...form, album_sheets: e.target.value })} placeholder="40" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Data Backup</Label><StageSelect value={form.data_backup_status} onChange={(v) => setForm({ ...form, data_backup_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Data Filtration</Label><StageSelect value={form.data_filtration_status} onChange={(v) => setForm({ ...form, data_filtration_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Video Progress</Label><StageSelect value={form.video_progress} onChange={(v) => setForm({ ...form, video_progress: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Album Design</Label><StageSelect value={form.album_design_status} onChange={(v) => setForm({ ...form, album_design_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Album Print</Label><StageSelect value={form.album_print_status} onChange={(v) => setForm({ ...form, album_print_status: v })} options={STAGE_OPTIONS} /></div>
          </div>

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2">Delivery &amp; Payment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">1st Delivery Date</Label><Input type="date" value={form.first_delivery_date} onChange={(e) => setForm({ ...form, first_delivery_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Final Delivery Date</Label><Input type="date" value={form.final_delivery_date} onChange={(e) => setForm({ ...form, final_delivery_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Status</Label><StageSelect value={form.delivery_status} onChange={(v) => setForm({ ...form, delivery_status: v })} options={DELIVERY_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Final Delivery Status</Label><StageSelect value={form.final_delivery_status} onChange={(v) => setForm({ ...form, final_delivery_status: v })} options={DELIVERY_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Payment Status</Label><StageSelect value={form.payment_status} onChange={(v) => setForm({ ...form, payment_status: v })} options={PAYMENT_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Final Payment Status</Label><StageSelect value={form.final_payment_status} onChange={(v) => setForm({ ...form, final_payment_status: v })} options={PAYMENT_OPTIONS} /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Follow-up Call / Good Will</Label><Input value={form.follow_up_call} onChange={(e) => setForm({ ...form, follow_up_call: e.target.value })} placeholder="Last call date / note" /></div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      )}

      {/* ───── Nested events table ───── */}
      {events.length > 0 && assignmentsByEvent && onSaveEvent && (
        <div className="border-t border-border bg-background">
          <div className="px-4 pt-3 pb-1 flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Events ({events.length})</span>
          </div>
          <div className="px-3 pb-3">
            {events.map((e) => (
              <EventManageRow
                key={e.id}
                event={e}
                teamMembers={teamMembers}
                assignmentsByEvent={assignmentsByEvent}
                onSave={(patch) => onSaveEvent(e.id, patch)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventManageRow({
  event,
  onSave,
  teamMembers = [],
  assignmentsByEvent,
}: {
  event: any;
  onSave: (patch: any) => void;
  teamMembers?: any[];
  assignmentsByEvent?: () => Record<string, string[]>;
}) {
  const [open, setOpen] = useState(false);
  const initial = {
    name:                      event.name                      ?? "",
    event_type:                event.event_type                ?? "",
    event_date:                event.event_date                ?? "",
    start_time:                event.start_time                ? String(event.start_time).slice(0, 5) : "",
    end_time:                  event.end_time                  ? String(event.end_time).slice(0, 5)   : "",
    venue:                     event.venue                     ?? "",
    status:                    event.status                    ?? "upcoming",
    notes:                     event.notes                     ?? "",
    quotation_services_status: event.quotation_services_status ?? "pending",
    actual_services:           event.actual_services           ?? "",
    card_number:               event.card_number               ?? "",
    raw_data_size:             event.raw_data_size             ?? "",
    data_copy_status:          event.data_copy_status          ?? "pending",
    backup_status:             event.backup_status             ?? "pending",
    delivery_hdd_status:       event.delivery_hdd_status       ?? "pending",
    photo_filter_grade:        event.photo_filter_grade        ?? "",
    video_editing_status:      event.video_editing_status      ?? "pending",
    album_design_status:       event.album_design_status       ?? "pending",
    assigned_date:             event.assigned_date             ?? "",
    delivery_status:           event.delivery_status           ?? "pending",
  };
  const [form, setForm] = useState(initial);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const handleSave = () => {
    onSave({
      name:                      form.name,
      event_type:                form.event_type || null,
      event_date:                form.event_date,
      start_time:                form.start_time ? `${form.start_time}:00` : null,
      end_time:                  form.end_time   ? `${form.end_time}:00`   : null,
      venue:                     form.venue || null,
      status:                    form.status,
      notes:                     form.notes || null,
      quotation_services_status: form.quotation_services_status,
      actual_services:           form.actual_services || null,
      card_number:               form.card_number || null,
      raw_data_size:             form.raw_data_size || null,
      data_copy_status:          form.data_copy_status,
      backup_status:             form.backup_status,
      delivery_hdd_status:       form.delivery_hdd_status,
      photo_filter_grade:        form.photo_filter_grade || null,
      video_editing_status:      form.video_editing_status,
      album_design_status:       form.album_design_status,
      assigned_date:             form.assigned_date || null,
      delivery_status:           form.delivery_status,
    });
  };

  // Technicians assigned to THIS event, derived from event_team_assignments + team_members
  const assignedMembers = (() => {
    if (!assignmentsByEvent) return [] as any[];
    const ids = assignmentsByEvent()[event.id] || [];
    return ids.map((mid) => teamMembers.find((m: any) => m.id === mid)).filter(Boolean);
  })();

  // Progress percentage from stage fields (live — updates as admin toggles stages)
  const progressPct = computeEventProgress({
    ...event,
    ...form,
  });

  return (
    <div className="rounded-xl border border-border bg-card mb-3 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{event.name}</p>
              <Badge variant="outline" className="text-[9px] capitalize">{event.status}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {fmtDate(event.event_date)}
              {event.start_time && ` · ${String(event.start_time).slice(0, 5)}`}
              {event.venue && ` · ${event.venue}`}
            </p>
            {assignedMembers.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                {assignedMembers.slice(0, 4).map((m: any) => (
                  <span key={m.id} className="inline-flex items-center gap-1 text-[9px] rounded-full bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
                    {m.full_name} <span className="text-muted-foreground">· {m.role}</span>
                  </span>
                ))}
                {assignedMembers.length > 4 && <span className="text-[9px] text-muted-foreground">+{assignedMembers.length - 4}</span>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Delivery</p>
            <p className="text-[11px] font-bold text-foreground tabular-nums">{progressPct}%</p>
          </div>
          {dirty && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-500/30">Unsaved</Badge>}
          <span className="text-muted-foreground text-xs">{open ? "Hide" : "Edit"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-3 bg-muted/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Event Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Event Type</Label><Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="mehendi / haldi / …" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</Label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {EVENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
          </div>

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2">Services</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Quotation Services (status)</Label><StageSelect value={form.quotation_services_status} onChange={(v) => setForm({ ...form, quotation_services_status: v })} options={QUOTATION_STATUS_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Actual Services</Label><Input value={form.actual_services} onChange={(e) => setForm({ ...form, actual_services: e.target.value })} placeholder="e.g. Candid + Video + Drone" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Assigned Date</Label><Input type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Delivery Status</Label><StageSelect value={form.delivery_status} onChange={(v) => setForm({ ...form, delivery_status: v })} options={DELIVERY_OPTIONS} /></div>
          </div>

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2">Data Tracking</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Card Number</Label><Input value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} placeholder="SD-01" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Raw Data Size</Label><Input value={form.raw_data_size} onChange={(e) => setForm({ ...form, raw_data_size: e.target.value })} placeholder="e.g. 1.2 GB or 800 MB" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Data Copy</Label><StageSelect value={form.data_copy_status} onChange={(v) => setForm({ ...form, data_copy_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Backup</Label><StageSelect value={form.backup_status} onChange={(v) => setForm({ ...form, backup_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Delivery HDD</Label><StageSelect value={form.delivery_hdd_status} onChange={(v) => setForm({ ...form, delivery_hdd_status: v })} options={STAGE_OPTIONS} /></div>
          </div>

          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest pt-2">Post-Production</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Photo Filter &amp; Grade (free text)</Label><Input value={form.photo_filter_grade} onChange={(e) => setForm({ ...form, photo_filter_grade: e.target.value })} placeholder="e.g. Warm cinematic, Kodak Portra look…" /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Video Editing</Label><StageSelect value={form.video_editing_status} onChange={(v) => setForm({ ...form, video_editing_status: v })} options={STAGE_OPTIONS} /></div>
            <div className="space-y-1"><Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Album Design</Label><StageSelect value={form.album_design_status} onChange={(v) => setForm({ ...form, album_design_status: v })} options={STAGE_OPTIONS} /></div>
          </div>

          {/* Technicians — read-only (change via Events > Assign Team) */}
          <div className="pt-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Assigned Technicians</p>
            {assignedMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No technicians yet. Use Events → Assign Team to add people.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedMembers.map((m: any) => (
                  <span key={m.id} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">
                    <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[9px] font-bold">
                      {String(m.full_name).split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("")}
                    </span>
                    <span className="font-medium text-foreground">{m.full_name}</span>
                    <span className="text-muted-foreground capitalize">· {m.role}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button size="sm" onClick={handleSave} disabled={!dirty}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
