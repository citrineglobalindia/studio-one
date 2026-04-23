import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Calendar, FileText, Image, BarChart3, Bot, MessageSquare, Shield,
  Receipt, Layers, Zap, Bell, Lock, Globe, Sparkles, ArrowRight,
  Briefcase, TrendingUp, HeartHandshake, ShieldCheck,
} from "lucide-react";
import { PageShell, SectionHeader, fadeUp, hexToRgb } from "./_shared";

const groups = [
  {
    title: "Sales & CRM",
    color: "#a855f7",
    tagline: "Never lose a lead again",
    features: [
      { icon: Users, title: "Lead & Client CRM", desc: "Unified pipeline from first touch to signed contract." },
      { icon: MessageSquare, title: "Communications Hub", desc: "WhatsApp, email, SMS — all conversations in one timeline." },
      { icon: TrendingUp, title: "Quotations", desc: "Branded quotes with version history and auto-conversion to invoice." },
    ],
  },
  {
    title: "Operations",
    color: "#3b82f6",
    tagline: "Shoot days without the chaos",
    features: [
      { icon: Calendar, title: "Smart Scheduling", desc: "Team availability, event calendar, shoot day planning." },
      { icon: Briefcase, title: "Project Management", desc: "Track every project from booking to album delivery." },
      { icon: Image, title: "Gallery & Albums", desc: "Client proofing, album designs, and delivery workflow." },
    ],
  },
  {
    title: "Finance",
    color: "#ec4899",
    tagline: "Get paid on time, every time",
    features: [
      { icon: FileText, title: "Contracts", desc: "E-sign contracts with templates, reminders, and compliance." },
      { icon: Receipt, title: "Invoicing & Payments", desc: "GST-ready invoices, payment tracking, and auto-reminders." },
      { icon: BarChart3, title: "Accounts & Analytics", desc: "Revenue, expenses, profit — real-time dashboards." },
    ],
  },
  {
    title: "AI & Automation",
    color: "#06b6d4",
    tagline: "Let the platform do the heavy lifting",
    features: [
      { icon: Bot, title: "AI Assistant", desc: "Natural-language queries, pricing suggestions, drafted replies." },
      { icon: Sparkles, title: "Smart Selection", desc: "AI-powered photo culling and best-shot detection." },
      { icon: Zap, title: "Automations", desc: "Trigger-based follow-ups, reminders, and workflows." },
    ],
  },
  {
    title: "Team & Security",
    color: "#f59e0b",
    tagline: "Built for teams of every size",
    features: [
      { icon: Shield, title: "Role-Based Access", desc: "Photographers, editors, accounts, HR — each with the right view." },
      { icon: ShieldCheck, title: "HR Module", desc: "Attendance, leaves, payroll-ready exports for your staff." },
      { icon: Lock, title: "Enterprise Security", desc: "SSO, SOC 2-style controls, audit logs, encrypted at rest." },
    ],
  },
  {
    title: "Growth & Brand",
    color: "#10b981",
    tagline: "Scale without losing your voice",
    features: [
      { icon: Globe, title: "Client Portal", desc: "White-labeled portal for clients to view projects and pay invoices." },
      { icon: Bell, title: "Notifications", desc: "Multi-channel alerts for your team and your clients." },
      { icon: HeartHandshake, title: "Marketing Tools", desc: "Campaigns, referrals, and post-delivery nurture flows." },
    ],
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge
              className="mb-5 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
              style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
            >
              <Layers className="h-3.5 w-3.5" /> Platform Features
            </Badge>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5 text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Everything Your Studio Needs.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)" }}
            >
              Nothing You Don't.
            </span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: "rgba(226,232,240,0.6)" }}
          >
            Thirty-plus purpose-built modules, grouped the way your studio actually works — from first call to final delivery.
          </motion.p>
        </div>
      </section>

      {/* Grouped feature sections */}
      <section className="py-10 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {groups.map((group, gIdx) => (
            <motion.div
              key={group.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0}
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 pb-4 border-b" style={{ borderColor: `rgba(${hexToRgb(group.color)}, 0.2)` }}>
                <div>
                  <span
                    className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-3"
                    style={{ background: `rgba(${hexToRgb(group.color)}, 0.15)`, color: group.color }}
                  >
                    0{gIdx + 1} / {groups.length.toString().padStart(2, "0")}
                  </span>
                  <h2
                    className="text-2xl md:text-4xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {group.title}
                  </h2>
                </div>
                <p className="text-sm md:text-base" style={{ color: group.color }}>
                  {group.tagline}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {group.features.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                  >
                    <Card
                      className="h-full border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group"
                      style={{
                        background: "rgba(22,33,62,0.5)",
                        borderColor: `rgba(${hexToRgb(group.color)}, 0.15)`,
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <CardContent className="p-6">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                          style={{
                            background: `rgba(${hexToRgb(group.color)}, 0.15)`,
                            boxShadow: `0 0 20px rgba(${hexToRgb(group.color)}, 0.1)`,
                          }}
                        >
                          <f.icon className="h-5 w-5" style={{ color: group.color }} />
                        </div>
                        <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(226,232,240,0.55)" }}>
                          {f.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Integration strip */}
      <section className="py-20 px-6">
        <SectionHeader
          badge="Integrations"
          badgeTint={{ bg: "rgba(6,182,212,0.15)", color: "#67e8f9" }}
          title="Plugs Into Your Existing Stack"
          subtitle="WhatsApp, Gmail, Razorpay, Google Drive, Dropbox, Instagram, and more."
        />
        <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-6 gap-3">
          {["WhatsApp", "Gmail", "Razorpay", "Drive", "Dropbox", "Instagram"].map((name, i) => (
            <motion.div
              key={name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="aspect-square rounded-2xl border flex items-center justify-center text-xs font-semibold text-white/70 hover:text-white transition-all hover:scale-105"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: "rgba(168,85,247,0.15)",
                backdropFilter: "blur(12px)",
              }}
            >
              {name}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl border p-10 md:p-14"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(22,33,62,0.6), rgba(59,130,246,0.08))",
            borderColor: "rgba(168,85,247,0.2)",
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            See these in action
          </h2>
          <p className="mb-6 text-sm md:text-base" style={{ color: "rgba(226,232,240,0.55)" }}>
            Book a 20-minute walkthrough with our team — tailored to your studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/landing/contact")}
              className="text-white border-0 gap-2"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
            >
              Book a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/landing/pricing")}
              className="text-white"
              style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}
            >
              See Pricing
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
