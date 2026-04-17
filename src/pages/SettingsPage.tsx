import { useEffect, useRef, useState } from "react";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings, Building2, Bell, Shield, Palette, Globe, CreditCard,
  Upload, Image, Droplets, FileText, Download, Database, Key,
  MessageSquare, Mail, Smartphone, Zap, CheckCircle2, AlertTriangle,
  Copy, ExternalLink, RefreshCw, Trash2, Save, Eye, EyeOff, Loader2,
} from "lucide-react";

const formatRoleLabel = (role: string) => {
  if (!role) return "Admin";
  if (role === "hr") return "HR";
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitials = (value: string) => {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "SU";
};

// Shape of the fields we load & save from profiles
interface ProfileRow {
  id: string;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  role: string | null;
  avatar_url: string | null;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { organization, refreshOrg } = useOrg();
  const { currentRole } = useRole();

  // Auth / org -derived values used across tabs
  const [ownerEmail, setOwnerEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  // Editable form state — Studio Information
  const [studioForm, setStudioForm] = useState({
    name: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    gst_number: "",
  });
  const [studioSaving, setStudioSaving] = useState(false);

  // Editable form state — Your Profile
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar upload state + hidden file input ref
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifications, setNotifications] = useState({
    emailLeads: true, whatsappLeads: true, paymentReminders: true,
    shootReminders: true, editUpdates: false, marketingReports: true,
    taskAssignment: true, albumStatus: false, clientPortal: true,
  });

  const [integrations, setIntegrations] = useState({
    whatsapp: true, googleCalendar: false, razorpay: true,
    googleDrive: false, dropbox: false, zapier: false,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const isImpersonatingStudio = typeof window !== "undefined" && !!localStorage.getItem("sa_impersonate_org");

  // Load owner email (from organization_members) once we know the org
  useEffect(() => {
    let active = true;

    const fetchOwnerEmail = async () => {
      if (!organization?.id) {
        if (active) setOwnerEmail("");
        return;
      }

      const { data } = await supabase
        .from("organization_members")
        .select("invited_email")
        .eq("organization_id", organization.id)
        .eq("role", "owner")
        .maybeSingle();

      if (active) {
        setOwnerEmail(data?.invited_email ?? "");
      }
    };

    fetchOwnerEmail();
    return () => { active = false; };
  }, [organization?.id]);

  // Seed the Studio form whenever the organization changes (or reloads)
  useEffect(() => {
    if (!organization) return;
    setStudioForm({
      name: organization.name ?? "",
      phone: organization.phone ?? "",
      // organization.email may not exist on old rows until migration runs; guard
      email: (organization as any).email ?? ownerEmail ?? "",
      website: organization.website ?? "",
      address: (organization as any).address ?? "",
      city: organization.city ?? "",
      gst_number: (organization as any).gst_number ?? "",
    });
  }, [organization, ownerEmail]);

  // Load & seed the profile form for the signed-in user
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!user?.id) {
        if (active) { setProfile(null); setProfileForm({ full_name: "", phone: "" }); }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, phone, role, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      setProfile((data as ProfileRow | null) ?? null);
      setProfileForm({
        full_name: data?.display_name ?? (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "",
        phone: (data as any)?.phone ?? "",
      });
      setAvatarUrl((data as any)?.avatar_url ?? null);
    };

    fetchProfile();
    return () => { active = false; };
  }, [user?.id]);

  const studioPrimaryColor = organization?.primary_color ?? "";
  const roleLabel = formatRoleLabel(currentRole);
  const displayName = profileForm.full_name || user?.email?.split("@")[0] || "Studio User";
  const displayInitials = getInitials(displayName);
  const invoiceFooter = studioForm.name
    ? `Thank you for choosing ${studioForm.name}. Payments are non-refundable.`
    : "";

  // Save handlers ---------------------------------------------------------

  const handleSaveStudio = async () => {
    if (!organization?.id) {
      toast.error("No studio loaded");
      return;
    }
    if (!studioForm.name.trim()) {
      toast.error("Studio name is required");
      return;
    }

    setStudioSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: studioForm.name.trim(),
        phone: studioForm.phone || null,
        email: studioForm.email || null,
        website: studioForm.website || null,
        address: studioForm.address || null,
        city: studioForm.city || null,
        gst_number: studioForm.gst_number || null,
      })
      .eq("id", organization.id);
    setStudioSaving(false);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
      return;
    }

    toast.success("Studio information saved");
    await refreshOrg();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be picked again if needed
    if (e.target) e.target.value = "";
    if (!file) return;

    if (!user?.id) {
      toast.error("Not signed in");
      return;
    }

    // Size & type validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setAvatarUploading(true);

    // Path must start with user_id so the RLS policy allows the write
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      setAvatarUploading(false);
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    // Public URL + cache-buster so the new image actually renders
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    setAvatarUploading(false);

    if (updateError) {
      toast.error(`Saved image but couldn't update profile: ${updateError.message}`);
      return;
    }

    setAvatarUrl(publicUrl);
    toast.success("Profile picture updated");
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) {
      toast.error("Not signed in");
      return;
    }
    if (!profileForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profileForm.full_name.trim(),
        phone: profileForm.phone || null,
      })
      .eq("user_id", user.id);
    setProfileSaving(false);

    if (error) {
      toast.error(`Failed to update profile: ${error.message}`);
      return;
    }

    toast.success("Profile updated");
  };

  // ----------------------------------------------------------------------

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Manage studio profile, integrations, branding & preferences</p>
        </div>
      </div>

      <Tabs defaultValue="studio" className="space-y-6">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0 flex-wrap">
          {[
            { value: "studio", icon: Building2, label: "Studio" },
            { value: "branding", icon: Palette, label: "Branding" },
            { value: "integrations", icon: Zap, label: "Integrations" },
            { value: "notifications", icon: Bell, label: "Notifications" },
            { value: "billing", icon: CreditCard, label: "Billing" },
            { value: "advanced", icon: Shield, label: "Advanced" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-3 sm:px-4 py-2.5 gap-1.5 text-xs sm:text-sm">
              <tab.icon className="h-3.5 w-3.5" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* =========================== STUDIO TAB (EDITABLE) =========================== */}
        <TabsContent value="studio" className="space-y-6">
          {/* Studio Information */}
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Studio Information</h2>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studio-name">Studio Name</Label>
                <Input
                  id="studio-name"
                  value={studioForm.name}
                  onChange={(e) => setStudioForm({ ...studioForm, name: e.target.value })}
                  placeholder="Your studio name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-phone">Phone</Label>
                <Input
                  id="studio-phone"
                  value={studioForm.phone}
                  onChange={(e) => setStudioForm({ ...studioForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-email">Email</Label>
                <Input
                  id="studio-email"
                  type="email"
                  value={studioForm.email}
                  onChange={(e) => setStudioForm({ ...studioForm, email: e.target.value })}
                  placeholder="studio@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-website">Website</Label>
                <Input
                  id="studio-website"
                  value={studioForm.website}
                  onChange={(e) => setStudioForm({ ...studioForm, website: e.target.value })}
                  placeholder="https://yourstudio.com"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="studio-address">Address</Label>
                <Textarea
                  id="studio-address"
                  value={studioForm.address}
                  onChange={(e) => setStudioForm({ ...studioForm, address: e.target.value })}
                  placeholder="Street, area"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-city">City</Label>
                <Input
                  id="studio-city"
                  value={studioForm.city}
                  onChange={(e) => setStudioForm({ ...studioForm, city: e.target.value })}
                  placeholder="Bangalore"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio-gst">GST Number</Label>
                <Input
                  id="studio-gst"
                  value={studioForm.gst_number}
                  onChange={(e) => setStudioForm({ ...studioForm, gst_number: e.target.value })}
                  placeholder="29ABCDE1234F1Z5"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button className="gap-2" onClick={handleSaveStudio} disabled={studioSaving}>
                {studioSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {studioSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Your Profile */}
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Your Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 overflow-hidden flex items-center justify-center text-xl font-bold text-primary">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span>{displayInitials}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  aria-label="Upload profile picture"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background hover:bg-primary/90 disabled:opacity-60"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 text-primary-foreground" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>
              <div>
                <p className="text-foreground font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={avatarUploading}
                  className="text-xs text-primary hover:underline mt-1 disabled:opacity-60"
                >
                  {avatarUploading ? "Uploading..." : avatarUrl ? "Change photo" : "Upload photo"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Full Name</Label>
                <Input
                  id="profile-name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-role">Role</Label>
                <Input id="profile-role" value={roleLabel} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={user?.email ?? ""}
                  readOnly
                  placeholder="Not set"
                />
                <p className="text-[11px] text-muted-foreground">
                  Email changes require verification — contact support to change your login email.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <Button className="gap-2" onClick={handleUpdateProfile} disabled={profileSaving}>
              {profileSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {profileSaving ? "Saving..." : "Update Profile"}
            </Button>
          </div>
        </TabsContent>
        {/* ============================================================================ */}

        <TabsContent value="branding" className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Logo & Watermark</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Studio Logo</Label>
                <div className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Image className="h-5 w-5" /></div>
                  <span className="text-xs">Drop logo or click to upload</span>
                  <span className="text-[10px] text-muted-foreground/60">PNG, SVG · Max 2MB</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Photo Watermark</Label>
                <div className="h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors"><Droplets className="h-5 w-5" /></div>
                  <span className="text-xs">Drop watermark or click to upload</span>
                  <span className="text-[10px] text-muted-foreground/60">PNG with transparency</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Theme & Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Primary Brand Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-primary border border-border cursor-pointer" />
                  <Input value={studioPrimaryColor} readOnly className="flex-1" placeholder="Not set" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary border border-border cursor-pointer" />
                  <Input value="" readOnly className="flex-1" placeholder="Not set" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Invoice & Document Branding</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice Prefix</Label><Input defaultValue="INV-2026-" /></div>
              <div className="space-y-2"><Label>Quotation Prefix</Label><Input defaultValue="QT-2026-" /></div>
              <div className="space-y-2 sm:col-span-2"><Label>Invoice Footer Text</Label><Textarea value={invoiceFooter} readOnly placeholder="Not set" rows={2} /></div>
              <div className="space-y-2"><Label>Default Payment Terms</Label><Select defaultValue="15"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="7">Net 7 days</SelectItem><SelectItem value="15">Net 15 days</SelectItem><SelectItem value="30">Net 30 days</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Currency</Label><Select defaultValue="INR"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INR">₹ INR</SelectItem><SelectItem value="USD">$ USD</SelectItem></SelectContent></Select></div>
            </div>
            <Button className="gap-2"><Save className="h-3.5 w-3.5" /> Save Branding</Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Connected Services</h2>
            <div className="space-y-3">
              {[
                { key: "whatsapp", icon: MessageSquare, label: "WhatsApp Business", desc: "Send automated messages & follow-ups", connected: integrations.whatsapp, color: "text-emerald-500" },
                { key: "googleCalendar", icon: Globe, label: "Google Calendar", desc: "Sync events and shoot schedules", connected: integrations.googleCalendar, color: "text-blue-500" },
                { key: "razorpay", icon: CreditCard, label: "Razorpay", desc: "Accept online payments from clients", connected: integrations.razorpay, color: "text-blue-600" },
                { key: "googleDrive", icon: Database, label: "Google Drive", desc: "Auto-backup albums and project files", connected: integrations.googleDrive, color: "text-amber-500" },
                { key: "dropbox", icon: Download, label: "Dropbox", desc: "Cloud storage for raw footage", connected: integrations.dropbox, color: "text-blue-400" },
                { key: "zapier", icon: Zap, label: "Zapier", desc: "Connect 5000+ apps with triggers", connected: integrations.zapier, color: "text-orange-500" },
              ].map((item) => (
                <div key={item.key} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all", item.connected ? "border-primary/20 bg-primary/5" : "border-border")}>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", item.connected ? "bg-primary/10" : "bg-muted")}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      {item.connected && <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button variant={item.connected ? "outline" : "default"} size="sm" className="shrink-0"
                    onClick={() => { setIntegrations(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] })); toast.success(item.connected ? `${item.label} disconnected` : `${item.label} connected`); }}>
                    {item.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">API Keys</h2>
              <Button variant="outline" size="sm" className="gap-1.5"><Key className="h-3.5 w-3.5" /> Generate New</Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">Production API Key</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{showApiKey ? "No API key configured" : "••••••••••••••"}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("No API key configured yet")}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Notification Preferences</h2>
            <div className="space-y-1">
              {[
                { key: "emailLeads", icon: Mail, label: "New lead notifications", desc: "Get notified when a new lead comes in" },
                { key: "whatsappLeads", icon: MessageSquare, label: "WhatsApp lead alerts", desc: "Instant WhatsApp alerts for new inquiries" },
                { key: "paymentReminders", icon: CreditCard, label: "Payment reminders", desc: "Alerts for upcoming and overdue payments" },
                { key: "shootReminders", icon: Globe, label: "Shoot day reminders", desc: "Day-before reminders for scheduled events" },
                { key: "editUpdates", icon: RefreshCw, label: "Editing progress updates", desc: "Notify when editors complete milestones" },
                { key: "marketingReports", icon: FileText, label: "Weekly marketing reports", desc: "Campaign performance summaries" },
                { key: "taskAssignment", icon: Zap, label: "Task assignments", desc: "When a new task is assigned to you" },
                { key: "albumStatus", icon: Image, label: "Album status changes", desc: "Track album design & delivery updates" },
                { key: "clientPortal", icon: ExternalLink, label: "Client portal activity", desc: "When clients view galleries or sign contracts" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"><item.icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  </div>
                  <Switch checked={notifications[item.key as keyof typeof notifications]} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-6 space-y-4">
            <h2 className="font-display font-semibold text-foreground">Delivery Channels</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Mail, label: "Email", desc: studioForm.email || "Not set", active: Boolean(studioForm.email) },
                { icon: MessageSquare, label: "WhatsApp", desc: studioForm.phone || "Not set", active: Boolean(studioForm.phone) },
                { icon: Smartphone, label: "Push Notifications", desc: "Browser & mobile", active: false },
              ].map((ch) => (
                <div key={ch.label} className={cn("rounded-xl border p-4 text-center transition-all cursor-pointer", ch.active ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20")}>
                  <ch.icon className={cn("h-5 w-5 mx-auto mb-2", ch.active ? "text-primary" : "text-muted-foreground")} />
                  <p className="text-sm font-medium text-foreground">{ch.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ch.desc}</p>
                  <Badge variant="outline" className={cn("text-[9px] mt-2", ch.active ? "text-emerald-500 border-emerald-500/20" : "text-muted-foreground")}>{ch.active ? "Active" : "Setup"}</Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Payment Settings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Bank Name</Label><Input value="" readOnly placeholder="Not set" /></div>
              <div className="space-y-2"><Label>Account Number</Label><Input value="" readOnly placeholder="Not set" /></div>
              <div className="space-y-2"><Label>IFSC Code</Label><Input value="" readOnly placeholder="Not set" /></div>
              <div className="space-y-2"><Label>UPI ID</Label><Input value="" readOnly placeholder="Not set" /></div>
            </div>
            <Button className="gap-2"><Save className="h-3.5 w-3.5" /> Save Payment Details</Button>
          </div>

          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Data Management</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><Database className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Export All Data</p><p className="text-xs text-muted-foreground">Download clients, projects, invoices as CSV/JSON</p></div></div>
                <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><Upload className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Import Data</p><p className="text-xs text-muted-foreground">Bulk import from CSV or other platforms</p></div></div>
                <Button variant="outline" size="sm" className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Import</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><RefreshCw className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Auto Backup</p><p className="text-xs text-muted-foreground">Daily backup of all studio data</p></div></div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border p-6 space-y-5">
            <h2 className="font-display font-semibold text-foreground">Security</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p></div></div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><Key className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Change Password</p><p className="text-xs text-muted-foreground">Last changed 45 days ago</p></div></div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Active Sessions</p><p className="text-xs text-muted-foreground">2 active sessions across devices</p></div></div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
            <h2 className="font-display font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Danger Zone</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium text-foreground">Delete all data</p><p className="text-xs text-muted-foreground">Permanently remove all studio data. This cannot be undone.</p></div>
                <Button variant="destructive" size="sm" className="gap-1.5"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
