import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera, Users, Calendar, BarChart3, FileText, Zap, Shield, Globe,
  ArrowRight, Check, Star, Play, ChevronRight, Sparkles, Layers,
  MessageSquare, Bell, Receipt, Image, Bot, Lock, Send, Mail, Phone, User
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  })
};

const features = [
  { icon: Users, title: "Lead & Client CRM", desc: "Track leads from inquiry to booking with automated follow-ups and pipeline management." },
  { icon: Calendar, title: "Smart Scheduling", desc: "Manage events, team availability, and shoot schedules in one unified calendar." },
  { icon: FileText, title: "Contracts & Invoicing", desc: "Generate branded contracts, quotations, and invoices with e-signature support." },
  { icon: Image, title: "Album & Gallery", desc: "Manage album designs, client proofing galleries, and delivery workflows." },
  { icon: BarChart3, title: "Analytics & Reports", desc: "Revenue dashboards, team performance metrics, and business intelligence." },
  { icon: Bot, title: "AI Assistant", desc: "AI-powered suggestions for pricing, scheduling, and client communications." },
  { icon: MessageSquare, title: "Communications Hub", desc: "WhatsApp, email, and SMS integration for seamless client communication." },
  { icon: Shield, title: "Team & Access Control", desc: "Role-based access for photographers, editors, accountants, and HR." },
  { icon: Receipt, title: "Expense Tracking", desc: "Track project expenses, vendor payments, and generate financial reports." },
];

const testimonials = [
  { name: "Rahul Mehta", studio: "PixelPerfect Studios", text: "StudioAi transformed how we manage our wedding photography business. We went from spreadsheets to a fully automated workflow.", avatar: "RM", rating: 5 },
  { name: "Priya Sharma", studio: "Lumiere Photography", text: "The AI assistant alone saved us 10+ hours a week. Client management has never been this smooth.", avatar: "PS", rating: 5 },
  { name: "Arjun Kapoor", studio: "FrameStory Films", text: "Finally a platform built specifically for Indian photography studios. The invoicing and team management features are incredible.", avatar: "AK", rating: 5 },
];

const stats = [
  { value: "500+", label: "Studios" },
  { value: "₹2Cr+", label: "Revenue Managed" },
  { value: "10K+", label: "Projects Delivered" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Studio<span className="text-primary">Ai</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Log in</Button>
            <Button size="sm" onClick={() => navigate("/auth?mode=signup")} className="gap-1">
              Start Free Trial <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs font-medium gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-Powered Studio Management
            </Badge>
          </motion.div>
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Run Your Photography
            <br />
            <span className="bg-gradient-to-r from-primary via-primary to-[hsl(var(--gold-glow))] bg-clip-text text-transparent">
              Studio Like a Pro
            </span>
          </motion.h1>
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            All-in-one platform for leads, clients, projects, invoicing, team management, and AI-powered workflows — built exclusively for photography & videography studios.
          </motion.p>
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="text-base px-8 h-12 gap-2">
              Start 14-Day Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12 gap-2">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Everything Your Studio Needs
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From first inquiry to final delivery — manage every aspect of your photography business.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className="bg-card/60 border-border/50 hover:border-primary/30 transition-all duration-300 h-full group">
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Plans That Grow With You
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start free, upgrade as your studio grows. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Starter", price: "Free", period: "14 days", desc: "Perfect for trying out StudioAi",
                features: ["Up to 10 clients", "Basic CRM & leads", "5 projects", "1 team member", "Email support"],
                cta: "Start Free Trial", popular: false
              },
              {
                name: "Professional", price: "₹2,999", period: "/month", desc: "For growing photography studios",
                features: ["Unlimited clients", "Full CRM & automation", "Unlimited projects", "Up to 10 team members", "AI assistant", "Contracts & invoicing", "Priority support"],
                cta: "Get Started", popular: true
              },
              {
                name: "Enterprise", price: "₹7,999", period: "/month", desc: "For large studios & agencies",
                features: ["Everything in Pro", "Unlimited team members", "White-label branding", "API access", "Custom integrations", "Dedicated account manager", "SSO & advanced security"],
                cta: "Contact Sales", popular: false
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className={`relative h-full ${plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : "border-border/50"}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                    <div className="mt-5 mb-6">
                      <span className="text-3xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-8"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => navigate("/auth?mode=signup")}
                    >
                      {plan.cta} <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs">
              <Star className="h-3.5 w-3.5 mr-1.5 fill-primary text-primary" /> Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Loved by Studios Everywhere
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                <Card className="bg-card/60 border-border/50 h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.studio}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-card to-primary/5 rounded-2xl border border-primary/20 p-12 md:p-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Transform Your Studio?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join 500+ studios already using StudioAi. Start your free trial — no credit card required.
          </p>
          <Button size="lg" onClick={() => navigate("/auth?mode=signup")} className="text-base px-8 h-12 gap-2">
            Start Free Trial <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xs">S</span>
            </div>
            <span className="font-bold">Studio<span className="text-primary">Ai</span></span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 StudioAi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
