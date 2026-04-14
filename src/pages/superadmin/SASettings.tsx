import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings2, Shield, Bell, Globe, Database, Lock, Mail,
  Palette, Server, Save,
} from "lucide-react";
import { toast } from "sonner";

export default function SASettings() {
  const [settings, setSettings] = useState({
    platformName: "StudioAI Pro",
    supportEmail: "support@studioai.com",
    defaultTrialDays: 14,
    autoConfirmEmails: false,
    enforceModuleRestrictions: true,
    allowSelfSignup: false,
    maintenanceMode: false,
    requireEmailVerification: true,
    maxStudiosPerOwner: 3,
    enableNotifications: true,
  });

  const handleSave = () => {
    toast.success("Platform settings saved (locally). Database persistence coming soon.");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure global platform behavior</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input type="email" value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Default Trial Period (days)</Label>
            <Input type="number" value={settings.defaultTrialDays} onChange={(e) => setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value) || 14 })} className="max-w-[120px]" />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Security & Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Self-Service Signup</p>
              <p className="text-xs text-muted-foreground">Allow studios to sign up without super admin provisioning</p>
            </div>
            <Switch checked={settings.allowSelfSignup} onCheckedChange={(v) => setSettings({ ...settings, allowSelfSignup: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email Verification</p>
              <p className="text-xs text-muted-foreground">Require email verification before login</p>
            </div>
            <Switch checked={settings.requireEmailVerification} onCheckedChange={(v) => setSettings({ ...settings, requireEmailVerification: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Confirm Emails</p>
              <p className="text-xs text-muted-foreground">Skip email verification for new accounts</p>
            </div>
            <Switch checked={settings.autoConfirmEmails} onCheckedChange={(v) => setSettings({ ...settings, autoConfirmEmails: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enforce Module Restrictions</p>
              <p className="text-xs text-muted-foreground">Apply per-studio module access controls</p>
            </div>
            <Switch checked={settings.enforceModuleRestrictions} onCheckedChange={(v) => setSettings({ ...settings, enforceModuleRestrictions: v })} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Max Studios Per Owner</Label>
            <Input type="number" value={settings.maxStudiosPerOwner} onChange={(e) => setSettings({ ...settings, maxStudiosPerOwner: parseInt(e.target.value) || 1 })} className="max-w-[120px]" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Platform Notifications</p>
              <p className="text-xs text-muted-foreground">Receive alerts for new studios, trial expirations, etc.</p>
            </div>
            <Switch checked={settings.enableNotifications} onCheckedChange={(v) => setSettings({ ...settings, enableNotifications: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-destructive" /> Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Temporarily block all studio access for platform updates</p>
            </div>
            <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => setSettings({ ...settings, maintenanceMode: v })} />
          </div>
          {settings.maintenanceMode && (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30">⚠ Maintenance mode is ON — all studios are blocked</Badge>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>
    </div>
  );
}
