import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Globe, Shield, Bell, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  platform_name: string;
  support_email: string;
  default_trial_days: number;
  auto_confirm_emails: boolean;
  enforce_module_restrictions: boolean;
  allow_self_signup: boolean;
  maintenance_mode: boolean;
  require_email_verification: boolean;
  max_studios_per_owner: number;
  enable_notifications: boolean;
};

const DEFAULTS: Settings = {
  platform_name: "StudioAI Pro",
  support_email: "support@studioai.com",
  default_trial_days: 14,
  auto_confirm_emails: false,
  enforce_module_restrictions: true,
  allow_self_signup: false,
  maintenance_mode: false,
  require_email_verification: true,
  max_studios_per_owner: 3,
  enable_notifications: true,
};

export default function SASettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setSettings({
          platform_name: data.platform_name,
          support_email: data.support_email,
          default_trial_days: data.default_trial_days,
          auto_confirm_emails: data.auto_confirm_emails,
          enforce_module_restrictions: data.enforce_module_restrictions,
          allow_self_signup: data.allow_self_signup,
          maintenance_mode: data.maintenance_mode,
          require_email_verification: data.require_email_verification,
          max_studios_per_owner: data.max_studios_per_owner,
          enable_notifications: data.enable_notifications,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("platform_settings")
      .update(settings)
      .eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Platform settings saved");
  };

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global platform behavior</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                value={settings.platform_name}
                onChange={(e) => set("platform_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => set("support_email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Default Trial Days</Label>
              <Input
                type="number"
                min="0"
                value={settings.default_trial_days}
                onChange={(e) => set("default_trial_days", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Studios Per Owner</Label>
              <Input
                type="number"
                min="1"
                value={settings.max_studios_per_owner}
                onChange={(e) => set("max_studios_per_owner", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Security &amp; Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "require_email_verification" as const, label: "Require email verification", desc: "New users must verify email before signing in" },
            { key: "auto_confirm_emails" as const, label: "Auto-confirm emails", desc: "Skip email verification (dev/staging)" },
            { key: "allow_self_signup" as const, label: "Allow public signup", desc: "Let anyone create an account from the landing page" },
            { key: "enforce_module_restrictions" as const, label: "Enforce module restrictions", desc: "Apply per-studio module blocks" },
          ].map(({ key, label, desc }, i, arr) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={settings[key]} onCheckedChange={(v) => set(key, v)} />
              </div>
              {i < arr.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications &amp; Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable notifications</Label>
              <p className="text-xs text-muted-foreground">Send system notifications to studios</p>
            </div>
            <Switch
              checked={settings.enable_notifications}
              onCheckedChange={(v) => set("enable_notifications", v)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-red-400">Maintenance mode</Label>
              <p className="text-xs text-muted-foreground">Block all non-super-admin access to the platform</p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(v) => set("maintenance_mode", v)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
