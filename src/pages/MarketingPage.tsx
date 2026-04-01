import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Send, Eye, Users, TrendingUp, Mail, MessageSquare, Target, Calendar, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface Campaign {
  id: string;
  name: string;
  type: "email" | "whatsapp" | "sms";
  status: "draft" | "scheduled" | "active" | "completed" | "paused";
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  scheduledDate?: string;
  completedDate?: string;
}

const sampleCampaigns: Campaign[] = [
  { id: "cm1", name: "Wedding Season 2026 Offer", type: "email", status: "active", audience: 500, sent: 480, opened: 210, clicked: 45, converted: 8, scheduledDate: "2026-03-25" },
  { id: "cm2", name: "Holi Special Mini Shoot", type: "whatsapp", status: "completed", audience: 200, sent: 195, opened: 180, clicked: 62, converted: 15, completedDate: "2026-03-15" },
  { id: "cm3", name: "Monsoon Pre-Wedding", type: "email", status: "scheduled", audience: 350, sent: 0, opened: 0, clicked: 0, converted: 0, scheduledDate: "2026-04-10" },
  { id: "cm4", name: "Anniversary Shoot Reminder", type: "sms", status: "draft", audience: 120, sent: 0, opened: 0, clicked: 0, converted: 0 },
  { id: "cm5", name: "Festival Portfolio Showcase", type: "email", status: "completed", audience: 800, sent: 780, opened: 320, clicked: 85, converted: 12, completedDate: "2026-02-20" },
  { id: "cm6", name: "Lead Re-engagement", type: "whatsapp", status: "paused", audience: 150, sent: 75, opened: 50, clicked: 12, converted: 2 },
];

const channelIcon: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageSquare, sms: Send };
const statusStyle: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-primary/20 text-primary border-primary/30",
  paused: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function MarketingPage() {
  const totalSent = sampleCampaigns.reduce((s, c) => s + c.sent, 0);
  const totalConverted = sampleCampaigns.reduce((s, c) => s + c.converted, 0);
  const avgOpenRate = Math.round((sampleCampaigns.filter((c) => c.sent > 0).reduce((s, c) => s + (c.opened / c.sent) * 100, 0)) / sampleCampaigns.filter((c) => c.sent > 0).length);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Marketing & Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">{sampleCampaigns.length} campaigns · {totalConverted} conversions</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Campaign</Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Sent", value: totalSent.toLocaleString(), icon: Send },
            { label: "Avg Open Rate", value: `${avgOpenRate}%`, icon: Eye },
            { label: "Conversions", value: totalConverted.toString(), icon: Target },
            { label: "Active Campaigns", value: sampleCampaigns.filter((c) => c.status === "active").length.toString(), icon: TrendingUp },
          ].map((m) => (
            <div key={m.label} className="rounded-lg bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</span>
                <m.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Campaign List */}
        <div className="space-y-3">
          {sampleCampaigns.map((campaign) => {
            const ChannelIcon = channelIcon[campaign.type];
            const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0;
            const clickRate = campaign.opened > 0 ? Math.round((campaign.clicked / campaign.opened) * 100) : 0;
            return (
              <div key={campaign.id} className="rounded-lg bg-card border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ChannelIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.type.toUpperCase()} · {campaign.audience} audience · {campaign.scheduledDate ? `Scheduled: ${campaign.scheduledDate.slice(5)}` : campaign.completedDate ? `Completed: ${campaign.completedDate.slice(5)}` : "Draft"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusStyle[campaign.status] + " text-[10px]"}>{campaign.status}</Badge>
                </div>

                {campaign.sent > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Sent", value: campaign.sent, total: campaign.audience },
                      { label: "Opened", value: campaign.opened, total: campaign.sent, pct: openRate },
                      { label: "Clicked", value: campaign.clicked, total: campaign.opened, pct: clickRate },
                      { label: "Converted", value: campaign.converted, total: campaign.clicked },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{stat.label}</span>
                          <span>{stat.value}</span>
                        </div>
                        <Progress value={stat.total > 0 ? (stat.value / stat.total) * 100 : 0} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
