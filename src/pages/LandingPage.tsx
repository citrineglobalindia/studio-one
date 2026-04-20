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
import { supabase } from "@/integrations/supabase/client";
import {
  Camera, Users, Calendar, BarChart3, FileText, Zap, Shield, Globe,
  ArrowRight, Check, Star, Play, ChevronRight, Sparkles, Layers,
  MessageSquare, Bell, Receipt, Image, Bot, Lock, Send, Mail, Phone, User, Aperture,
  Video, Palette, Building2, HandCoins, UserCheck, Clapperboard, MonitorPlay
} from "lucide-react";
import cinemaCameraImg from "@/assets/cinema-camera.png";

/* ── shared VR helpers ── */
const FloatingOrb = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-3xl pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1] }}
    transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const FloatingParticle = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-sm pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.3, 1] }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px pointer-events-none z-10"
    style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), rgba(59,130,246,0.3), transparent)" }}
    initial={{ top: "0%" }}
    animate={{ top: ["0%", "100%", "0%"] }}
    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
  />
);

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const }
  })
};

const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

/* ── data ── */
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
  { value: "2Cr+", label: "Revenue Managed" },
  { value: "10K+", label: "Projects Delivered" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiry.name || !enquiry.email || !enquiry.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("enquiries").insert({
      name: enquiry.name,
      email: enquiry.email,
      phone: enquiry.phone || null,
      message: enquiry.message,
    });
    if (error) {
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }
    toast.success("Thank you! We'll get back to you shortly.");
    setEnquiry({ name: "", email: "", phone: "", message: "" });
    setSubmitting(false);
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden relative"
      style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a0a2e 25%, #16213e 60%, #0d1b2a 100%)", color: "#e2e8f0" }}
    >
      {/* ── Global VR Effects ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <FloatingOrb delay={0} x="10%" y="15%" size={280} color="radial-gradient(circle, rgba(168,85,247,0.35), transparent 70%)" />
        <FloatingOrb delay={2} x="70%" y="10%" size={220} color="radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%)" />
        <FloatingOrb delay={4} x="80%" y="60%" size={200} color="radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%)" />
        <FloatingOrb delay={1} x="20%" y="70%" size={180} color="radial-gradient(circle, rgba(6,182,212,0.25), transparent 70%)" />
        <FloatingOrb delay={3} x="50%" y="45%" size={160} color="radial-gradient(circle, rgba(245,158,11,0.2), transparent 70%)" />
        <FloatingParticle delay={0.5} x="15%" y="25%" size={6} color="#a855f7" />
        <FloatingParticle delay={1.2} x="80%" y="35%" size={5} color="#3b82f6" />
        <FloatingParticle delay={0.8} x="45%" y="55%" size={4} color="#ec4899" />
        <FloatingParticle delay={2} x="60%" y="20%" size={5} color="#06b6d4" />
        <FloatingParticle delay={1.5} x="30%" y="80%" size={6} color="#f59e0b" />
        <ScanLine />
      </div>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b" style={{ background: "rgba(15,12,41,0.7)", borderColor: "rgba(168,85,247,0.15)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Aperture className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Studio<span style={{ color: "#a855f7" }}>Ai</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Plans</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
            <a href="#enquiry" className="hover:text-white transition-colors">Enquiry</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-white/70 hover:text-white hover:bg-white/10">Log in</Button>
            <Button size="sm" onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })} className="gap-1 text-white border-0" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              Enquire Now <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-28 pb-16 px-6 relative z-10">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* ── Left: Content ── */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <Badge className="mb-6 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
                  <Sparkles className="h-3.5 w-3.5" /> AI-Powered Studio Management
                </Badge>
              </motion.div>
              <motion.h1
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Run Your Photography
                <br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)" }}>
                  Studio Like a Pro
                </span>
              </motion.h1>
              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-base md:text-lg max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0"
                style={{ color: "rgba(226,232,240,0.6)" }}
              >
                All-in-one platform for leads, clients, projects, invoicing, team management, and AI-powered workflows — built exclusively for photography & videography studios.
              </motion.p>
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button size="lg" onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 gap-2 text-white border-0" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
                  Enquire Now <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12 gap-2 text-white" style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}>
                  <Play className="h-4 w-4" /> Watch Demo
                </Button>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-12"
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-xl md:text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>{stat.value}</div>
                    <div className="text-xs mt-1" style={{ color: "rgba(226,232,240,0.5)" }}>{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right: Camera + Orbiting Modules ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex-shrink-0 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] lg:w-[480px] lg:h-[480px]"
            >
              {/* Glow */}
              <div className="absolute inset-0 m-auto w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)" }} />

              {/* Orbit rings */}
              <motion.div
                className="absolute inset-0 m-auto w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border"
                style={{ borderColor: "rgba(168,85,247,0.15)" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 m-auto w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border"
                style={{ borderColor: "rgba(59,130,246,0.1)" }}
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              />

              {/* Camera — center */}
              <motion.img
                src={cinemaCameraImg}
                alt="Sony FX6 Cinema Camera"
                className="absolute inset-0 m-auto z-10 w-28 sm:w-36 md:w-44 lg:w-48 h-auto object-contain drop-shadow-[0_0_60px_rgba(168,85,247,0.3)]"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Orbiting Role Modules */}
              {[
                { icon: Building2, label: "Studio", color: "#a855f7", angle: 0 },
                { icon: HandCoins, label: "Vendors", color: "#3b82f6", angle: 45 },
                { icon: Camera, label: "Photographer", color: "#ec4899", angle: 90 },
                { icon: BarChart3, label: "Accounts", color: "#f59e0b", angle: 135 },
                { icon: Users, label: "Clients", color: "#06b6d4", angle: 180 },
                { icon: Calendar, label: "Events", color: "#10b981", angle: 225 },
                { icon: Video, label: "Videographer", color: "#8b5cf6", angle: 270 },
                { icon: Palette, label: "Editor", color: "#f43f5e", angle: 315 },
              ].map((mod, i) => {
                const rad = (mod.angle * Math.PI) / 180;
                return (
                  <motion.div
                    key={mod.label}
                    className="absolute z-20 flex flex-col items-center gap-0.5"
                    style={{
                      left: `calc(50% + ${Math.cos(rad) * 44}% - 24px)`,
                      top: `calc(50% + ${Math.sin(rad) * 44}% - 24px)`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.4, type: "spring" }}
                  >
                    <motion.div
                      className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center border backdrop-blur-md cursor-default"
                      style={{
                        background: `rgba(${hexToRgb(mod.color)}, 0.12)`,
                        borderColor: `rgba(${hexToRgb(mod.color)}, 0.3)`,
                        boxShadow: `0 0 20px rgba(${hexToRgb(mod.color)}, 0.15)`,
                      }}
                      whileHover={{ scale: 1.15, boxShadow: `0 0 30px rgba(${hexToRgb(mod.color)}, 0.35)` }}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <mod.icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" style={{ color: mod.color }} />
                    </motion.div>
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-wide whitespace-nowrap" style={{ color: mod.color }}>{mod.label}</span>
                  </motion.div>
                );
              })}

            </motion.div>

            {/* Tagline — below the orbit container */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-center lg:text-center mt-4 text-[10px] sm:text-xs font-mono tracking-widest uppercase"
              style={{ color: "rgba(168,85,247,0.6)" }}
            >
              All Managed in One Platform
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 px-3 py-1 text-xs border-0" style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}>
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Everything Your Studio Needs
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(226,232,240,0.5)" }}>
              From first inquiry to final delivery — manage every aspect of your photography business.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full group border transition-all duration-300 hover:scale-[1.02]" style={{ background: "rgba(22,33,62,0.5)", borderColor: "rgba(168,85,247,0.12)", backdropFilter: "blur(12px)" }}>
                  <CardContent className="p-6">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors" style={{ background: "rgba(168,85,247,0.15)" }}>
                      <f.icon className="h-5 w-5" style={{ color: "#a855f7" }} />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(226,232,240,0.5)" }}>{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section id="pricing" className="py-24 px-6 relative z-10">
        <div className="absolute inset-0" style={{ background: "rgba(15,12,41,0.4)" }} />
        <div className="max-w-6xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 px-3 py-1 text-xs border-0" style={{ background: "rgba(236,72,153,0.15)", color: "#f9a8d4" }}>Plans</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Plans That Grow With You
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(226,232,240,0.5)" }}>
              Flexible plans for every studio size. Enquire to find the right fit.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Starter", desc: "Perfect for trying out StudioAi", features: ["Up to 10 clients", "Basic CRM & leads", "5 projects", "1 team member", "Email support"], popular: false },
              { name: "Professional", desc: "For growing photography studios", features: ["Unlimited clients", "Full CRM & automation", "Unlimited projects", "Up to 10 team members", "AI assistant", "Contracts & invoicing", "Priority support"], popular: true },
              { name: "Enterprise", desc: "For large studios & agencies", features: ["Everything in Pro", "Unlimited team members", "White-label branding", "API access", "Custom integrations", "Dedicated account manager", "SSO & advanced security"], popular: false },
            ].map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card
                  className={`relative h-full border transition-all duration-300 ${plan.popular ? "scale-[1.02]" : ""}`}
                  style={{
                    background: plan.popular ? "rgba(168,85,247,0.1)" : "rgba(22,33,62,0.5)",
                    borderColor: plan.popular ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.12)",
                    boxShadow: plan.popular ? "0 0 40px rgba(168,85,247,0.15)" : "none",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 text-white border-0" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-sm mt-1 mb-6" style={{ color: "rgba(226,232,240,0.5)" }}>{plan.desc}</p>
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#a855f7" }} />
                          <span style={{ color: "rgba(226,232,240,0.6)" }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-8 text-white border-0"
                      style={{
                        background: plan.popular ? "linear-gradient(135deg, #a855f7, #3b82f6)" : "rgba(168,85,247,0.15)",
                        borderColor: plan.popular ? "transparent" : "rgba(168,85,247,0.3)",
                      }}
                      onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Enquire Now <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <Badge className="mb-4 px-3 py-1 text-xs border-0" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
              <Star className="h-3.5 w-3.5 mr-1.5 fill-current" /> Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Loved by Studios Everywhere
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full border" style={{ background: "rgba(22,33,62,0.5)", borderColor: "rgba(168,85,247,0.12)", backdropFilter: "blur(12px)" }}>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" style={{ color: "#f59e0b" }} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(226,232,240,0.6)" }}>"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{t.name}</div>
                        <div className="text-xs" style={{ color: "rgba(226,232,240,0.5)" }}>{t.studio}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enquiry ── */}
      <section id="enquiry" className="py-24 px-6 relative z-10">
        <div className="absolute inset-0" style={{ background: "rgba(15,12,41,0.4)" }} />
        <div className="max-w-7xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <Badge className="mb-4 border" style={{ background: "rgba(6,182,212,0.12)", borderColor: "rgba(6,182,212,0.3)", color: "#67e8f9" }}>Get In Touch</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white" style={{ fontFamily: "var(--font-display)" }}>
              Have Questions? Let's Talk
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(226,232,240,0.5)" }}>
              Fill in your details and our team will reach out to you within 24 hours.
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="max-w-lg mx-auto">
            <Card className="border" style={{ background: "rgba(22,33,62,0.6)", borderColor: "rgba(168,85,247,0.2)", boxShadow: "0 0 60px rgba(168,85,247,0.1)", backdropFilter: "blur(16px)" }}>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleEnquiry} className="space-y-4">
                  <div>
                    <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.5)" }}>Full Name *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                      <Input
                        value={enquiry.name}
                        onChange={e => setEnquiry(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="pl-9 border text-white placeholder:text-white/30"
                        style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.5)" }}>Email *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                        <Input
                          type="email"
                          value={enquiry.email}
                          onChange={e => setEnquiry(p => ({ ...p, email: e.target.value }))}
                          placeholder="you@email.com"
                          className="pl-9 border text-white placeholder:text-white/30"
                          style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.5)" }}>Phone</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                        <Input
                          value={enquiry.phone}
                          onChange={e => setEnquiry(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+91..."
                          className="pl-9 border text-white placeholder:text-white/30"
                          style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.5)" }}>Message *</Label>
                    <Textarea
                      value={enquiry.message}
                      onChange={e => setEnquiry(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us about your studio and what you're looking for..."
                      className="mt-1 min-h-[100px] border text-white placeholder:text-white/30"
                      style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2 text-white border-0" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }} disabled={submitting}>
                    {submitting ? "Sending..." : <>Send Enquiry <Send className="h-4 w-4" /></>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative z-10">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
          className="max-w-4xl mx-auto text-center rounded-2xl border p-12 md:p-16"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(22,33,62,0.6), rgba(59,130,246,0.08))",
            borderColor: "rgba(168,85,247,0.2)",
            boxShadow: "0 0 80px rgba(168,85,247,0.08)",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Transform Your Studio?
          </h2>
          <p className="max-w-lg mx-auto mb-8" style={{ color: "rgba(226,232,240,0.5)" }}>
            Join 500+ studios already using StudioAi. Get in touch with us to learn more.
          </p>
          <Button size="lg" onClick={() => document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" })} className="text-base px-8 h-12 gap-2 text-white border-0" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
            Enquire Now <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-12 px-6 relative z-10" style={{ borderColor: "rgba(168,85,247,0.15)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Aperture className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Studio<span style={{ color: "#a855f7" }}>Ai</span></span>
          </div>
          <div className="flex gap-8 text-sm" style={{ color: "rgba(226,232,240,0.5)" }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Plans</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>© 2026 StudioAi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
