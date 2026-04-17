import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera, Bell, BellOff, MapPin, MapPinOff, Shield, User, Mail, Phone, Building,
  Pencil, Save, ChevronRight, Lock, Globe, Volume2, Vibrate, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";

const formatRoleLabel = (role: string) => {
  if (!role) return "Admin";
  if (role === "hr") return "HR";
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { organization } = useOrg();
  const { currentRole } = useRole();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live data from Supabase
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Read-only (editing these needs other flows)
  const email = user?.email ?? "";
  const role = formatRoleLabel(currentRole);
  const company = organization?.name ?? "";

  // Local UI toggles (not persisted yet — wire up later if needed)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [gpsTracker, setGpsTracker] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);

  // Load real profile data on mount
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      if (!user?.id) {
        if (active) {
          setName("");
          setPhone("");
          setProfileImage(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, phone, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      setName(
        (data?.display_name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        user.email?.split("@")[0] ??
        ""
      );
      setPhone(((data as any)?.phone as string | undefined) ?? "");
      setProfileImage(((data as any)?.avatar_url as string | undefined) ?? null);
      setLoading(false);
    };

    fetchProfile();
    return () => { active = false; };
  }, [user?.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setUploading(true);
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      setUploading(false);
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    setUploading(false);

    if (updateError) {
      toast.error(`Saved image but couldn't update profile: ${updateError.message}`);
      return;
    }

    setProfileImage(publicUrl);
    toast.success("Profile photo updated");
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Not signed in");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: name.trim(),
        phone: phone || null,
      })
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast.error(`Failed to save: ${error.message}`);
      return;
    }

    setIsEditing(false);
    toast.success("Profile updated");
  };

  const toggleItem = (label: string, value: boolean, setter: (v: boolean) => void) => {
    setter(!value);
    toast.success(`${label} ${!value ? "enabled" : "disabled"}`);
  };

  const initials =
    (name || email || "S U")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "SU";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--primary) / 0.9) 100%)" }}
      >
        <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/[0.03]" />
        <div className="absolute top-1/2 right-1/4 size-48 rounded-full bg-white/[0.02]" />

        <div className="p-5 md:p-8 flex flex-col md:flex-row items-center gap-5">
          {/* Avatar */}
          <div className="relative group">
            <Avatar className="size-24 md:size-28 border-4 border-white/20 shadow-lg">
              <AvatarImage src={profileImage || undefined} />
              <AvatarFallback className="bg-white/10 text-white text-2xl md:text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-wait"
            >
              {uploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary flex items-center justify-center border-2 border-white/20">
              {uploading ? (
                <Loader2 size={12} className="text-primary-foreground animate-spin" />
              ) : (
                <Camera size={12} className="text-primary-foreground" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              {loading ? "Loading..." : (name || "Unnamed")}
            </h2>
            <p className="text-sm text-white/60 mt-0.5">{role}</p>
            <p className="text-xs text-white/40 mt-1">{email}</p>
            <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">Active</span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-[11px] font-medium">{role}</span>
            </div>
          </div>

          {/* Edit / Save button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={saving || loading}
            className="border-white/20 text-white bg-white/10 hover:bg-white/20"
          >
            {saving ? (
              <><Loader2 size={14} className="mr-1.5 animate-spin" /> Saving</>
            ) : isEditing ? (
              <><Save size={14} className="mr-1.5" /> Save</>
            ) : (
              <><Pencil size={14} className="mr-1.5" /> Edit</>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Personal Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">Personal Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              {isEditing ? (
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
              ) : (
                <p className="text-sm font-medium text-foreground py-2">{name || "—"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex items-center gap-2 py-2">
                <Mail size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{email || "—"}</p>
              </div>
              {isEditing && (
                <p className="text-[10px] text-muted-foreground">Email changes require verification — not editable here.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phone</Label>
              {isEditing ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-10"
                />
              ) : (
                <div className="flex items-center gap-2 py-2">
                  <Phone size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">{phone || "—"}</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <p className="text-sm font-medium text-foreground py-2">{role}</p>
              {isEditing && (
                <p className="text-[10px] text-muted-foreground">Role is managed by your admin.</p>
              )}
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Company</Label>
              <div className="flex items-center gap-2 py-2">
                <Building size={14} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{company || "—"}</p>
              </div>
              {isEditing && (
                <p className="text-[10px] text-muted-foreground">Change studio name in Settings → Studio.</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-6 space-y-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield size={16} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground">Account</h3>
          </div>
          {[
            { label: "Change Password", icon: Lock, desc: "Update your password" },
            { label: "Two-Factor Auth", icon: Shield, desc: "Extra security layer" },
            { label: "Language", icon: Globe, desc: "English (US)" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
            >
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <item.icon size={16} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </motion.div>
      </div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {pushNotifications ? <Bell size={16} className="text-primary" /> : <BellOff size={16} className="text-muted-foreground" />}
          </div>
          <h3 className="text-base font-bold text-foreground">Notifications</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Push Notifications", desc: "Receive push alerts on your device", icon: Bell, value: pushNotifications, setter: setPushNotifications },
            { label: "Email Notifications", desc: "Get notified via email", icon: Mail, value: emailNotifications, setter: setEmailNotifications },
            { label: "SMS Alerts", desc: "Receive text message alerts", icon: Phone, value: smsNotifications, setter: setSmsNotifications },
            { label: "Sound Alerts", desc: "Play sound for new notifications", icon: Volume2, value: soundAlerts, setter: setSoundAlerts },
            { label: "Vibration", desc: "Vibrate on notification", icon: Vibrate, value: vibration, setter: setVibration },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-lg flex items-center justify-center ${item.value ? "bg-primary/10" : "bg-muted"}`}>
                  <item.icon size={16} className={item.value ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch checked={item.value} onCheckedChange={() => toggleItem(item.label, item.value, item.setter)} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* GPS & Location */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {gpsTracker ? <MapPin size={16} className="text-primary" /> : <MapPinOff size={16} className="text-muted-foreground" />}
          </div>
          <h3 className="text-base font-bold text-foreground">GPS & Location</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${gpsTracker ? "bg-emerald-500/10" : "bg-muted"}`}>
                <MapPin size={18} className={gpsTracker ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">GPS Tracker</p>
                <p className="text-[11px] text-muted-foreground">Track employee location during work hours</p>
              </div>
            </div>
            <Switch checked={gpsTracker} onCheckedChange={() => toggleItem("GPS Tracker", gpsTracker, setGpsTracker)} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-xl flex items-center justify-center ${locationSharing ? "bg-blue-500/10" : "bg-muted"}`}>
                <Globe size={18} className={locationSharing ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Location Sharing</p>
                <p className="text-[11px] text-muted-foreground">Share your live location with team leads</p>
              </div>
            </div>
            <Switch checked={locationSharing} onCheckedChange={() => toggleItem("Location Sharing", locationSharing, setLocationSharing)} />
          </div>

          {gpsTracker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">GPS Active</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div><p className="text-[10px] text-muted-foreground">Status</p><p className="text-xs font-bold text-foreground">Connected</p></div>
                <div><p className="text-[10px] text-muted-foreground">Accuracy</p><p className="text-xs font-bold text-foreground">High</p></div>
                <div><p className="text-[10px] text-muted-foreground">Last Update</p><p className="text-xs font-bold text-foreground">Just now</p></div>
                <div><p className="text-[10px] text-muted-foreground">Battery Impact</p><p className="text-xs font-bold text-foreground">Low</p></div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
