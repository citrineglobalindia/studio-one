import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Building2, Bell, Shield, Palette, Globe, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailLeads: true,
    whatsappLeads: true,
    paymentReminders: true,
    shootReminders: true,
    editUpdates: false,
    marketingReports: true,
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your studio profile, preferences and integrations</p>
        </div>

        <Tabs defaultValue="studio" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="studio" className="gap-2"><Building2 className="h-3.5 w-3.5" />Studio</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
            <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="studio" className="space-y-6">
            <div className="rounded-lg bg-card border border-border p-6 space-y-5">
              <h2 className="font-display font-semibold text-foreground">Studio Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Studio Name</Label>
                  <Input defaultValue="Amit Studio Photography" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="hello@amitstudio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input defaultValue="www.amitstudio.com" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea defaultValue="42, Defence Colony, New Delhi 110024" rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input defaultValue="New Delhi" />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input defaultValue="07AAECA1234F1Z5" />
                </div>
              </div>
              <Button>Save Changes</Button>
            </div>

            <div className="rounded-lg bg-card border border-border p-6 space-y-5">
              <h2 className="font-display font-semibold text-foreground">Branding</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
                    Click to upload logo
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Watermark</Label>
                  <div className="h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:border-primary/30 transition-colors">
                    Click to upload watermark
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md bg-primary border border-border" />
                    <Input defaultValue="#C5963A" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input defaultValue="INV-2026-" />
                </div>
              </div>
              <Button>Save Branding</Button>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-lg bg-card border border-border p-6 space-y-5">
              <h2 className="font-display font-semibold text-foreground">Your Profile</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">AS</div>
                <div>
                  <p className="text-foreground font-semibold">Amit Sharma</p>
                  <p className="text-sm text-muted-foreground">Owner & Lead Photographer</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue="Amit Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select defaultValue="owner">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue="amit@amitstudio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue="+91 98765 43210" />
                </div>
              </div>
              <Button>Update Profile</Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="rounded-lg bg-card border border-border p-6 space-y-5">
              <h2 className="font-display font-semibold text-foreground">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: "emailLeads", label: "New lead notifications", desc: "Get notified when a new lead comes in" },
                  { key: "whatsappLeads", label: "WhatsApp lead alerts", desc: "Instant WhatsApp alerts for new inquiries" },
                  { key: "paymentReminders", label: "Payment reminders", desc: "Alerts for upcoming and overdue payments" },
                  { key: "shootReminders", label: "Shoot day reminders", desc: "Day-before reminders for scheduled events" },
                  { key: "editUpdates", label: "Editing progress updates", desc: "Notify when editors complete milestones" },
                  { key: "marketingReports", label: "Weekly marketing reports", desc: "Campaign performance summaries" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="rounded-lg bg-card border border-border p-6 space-y-5">
              <h2 className="font-display font-semibold text-foreground">Payment Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input defaultValue="HDFC Bank" />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input defaultValue="**** **** 4521" />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input defaultValue="HDFC0001234" />
                </div>
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input defaultValue="amitstudio@hdfcbank" />
                </div>
              </div>
              <Button>Save Payment Details</Button>
            </div>

            <div className="rounded-lg bg-card border border-border p-6 space-y-4">
              <h2 className="font-display font-semibold text-foreground">Subscription</h2>
              <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pro Plan</p>
                  <p className="text-xs text-muted-foreground">Unlimited projects, team members & automations</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-primary">₹2,499/mo</p>
                  <p className="text-xs text-muted-foreground">Renews Apr 15, 2026</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
