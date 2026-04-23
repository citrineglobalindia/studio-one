import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera, Users, Calendar, BarChart3, Sparkles, ArrowRight, Play,
  Building2, HandCoins, Video, Palette, Layers, Bot, FileText, ChevronRight,
} from "lucide-react";
import cinemaCameraImg from "@/assets/cinema-camera.png";
import { PageShell, fadeUp, hexToRgb } from "./_shared";

const stats = [
  { value: "500+", label: "Active Studios" },
  { value: "₹2Cr+", label: "Revenue Managed" },
  { value: "10K+", label: "Projects Delivered" },
  { value: "99.9%", label: "Platform Uptime" },
];

const quickLinks = [
  {
    title: "Explore Features",
    desc: "30+ modules covering every studio workflow.",
    icon: Layers,
    to: "/landing/features",
    color: "#a855f7",
  },
  {
    title: "See Pricing",
    desc: "Transparent plans for solo pros to agencies.",
    icon: FileText,
    to: "/landing/pricing",
    color: "#3b82f6",
  },
  {
    title: "Studios Love Us",
    desc: "Read what 500+ studios are saying.",
    icon: Users,
    to: "/landing/testimonials",
    color: "#ec4899",
  },
  {
    title: "Meet the Team",
    desc: "The story and people behind StudioAi.",
    icon: Sparkles,
    to: "/landing/about",
    color: "#06b6d4",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-16 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <Badge
                  className="mb-6 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
                  style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
                >
                  <Sparkles className="h-3.5 w-3.5" /> AI-Powered Studio Management
                </Badge>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Run Your Photography
                <br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)" }}
                >
                  Studio Like a Pro
                </span>
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={2}
                className="text-base md:text-lg max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0"
                style={{ color: "rgba(226,232,240,0.6)" }}
              >
                All-in-one platform for leads, clients, projects, invoicing, team management, and AI-powered workflows —
                built exclusively for photography & videography studios.
              </motion.p>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/landing/contact")}
                  className="text-base px-8 h-12 gap-2 text-white border-0"
                  style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                >
                  Enquire Now <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/landing/features")}
                  className="text-base px-8 h-12 gap-2 text-white"
                  style={{ borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)" }}
                >
                  <Play className="h-4 w-4" /> Watch Demo
                </Button>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={4}
                className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-12"
              >
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div
                      className="text-xl md:text-2xl font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "rgba(226,232,240,0.5)" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Orbit */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex-shrink-0 w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] md:w-[440px] md:h-[440px] lg:w-[480px] lg:h-[480px]"
            >
              <div
                className="absolute inset-0 m-auto w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, rgba(59,130,246,0.08) 50%, transparent 70%)",
                }}
              />
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

              <motion.img
                src={cinemaCameraImg}
                alt="Cinema Camera"
                className="absolute inset-0 m-auto z-10 w-28 sm:w-36 md:w-44 lg:w-48 h-auto object-contain drop-shadow-[0_0_60px_rgba(168,85,247,0.3)]"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

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
                    <span
                      className="text-[8px] sm:text-[9px] md:text-[10px] font-semibold tracking-wide whitespace-nowrap"
                      style={{ color: mod.color }}
                    >
                      {mod.label}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mt-8 text-[10px] sm:text-xs font-mono tracking-widest uppercase"
            style={{ color: "rgba(168,85,247,0.6)" }}
          >
            — All Managed in One Platform —
          </motion.p>
        </div>
      </section>

      {/* Explore the platform */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <Badge className="mb-4 border-0" style={{ background: "rgba(59,130,246,0.15)", color: "#93c5fd" }}>
              Explore
            </Badge>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Find Your Path Through StudioAi
            </h2>
            <p className="max-w-xl mx-auto text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
              Jump straight into what matters — features, pricing, the studios we power, or the team behind it.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((q, i) => (
              <motion.div
                key={q.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card
                  onClick={() => navigate(q.to)}
                  className="h-full border cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group"
                  style={{
                    background: "rgba(22,33,62,0.5)",
                    borderColor: `rgba(${hexToRgb(q.color)}, 0.25)`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <CardContent className="p-6">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                      style={{
                        background: `rgba(${hexToRgb(q.color)}, 0.15)`,
                        border: `1px solid rgba(${hexToRgb(q.color)}, 0.3)`,
                      }}
                    >
                      <q.icon className="h-5 w-5" style={{ color: q.color }} />
                    </div>
                    <h3 className="font-semibold text-white mb-1.5">{q.title}</h3>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(226,232,240,0.55)" }}>
                      {q.desc}
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: q.color }}>
                      Learn more <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works strip */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <Badge className="mb-4 border-0" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>
              Workflow
            </Badge>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              From Inquiry to Delivery — Automated
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-4 relative">
            {[
              { step: "01", title: "Capture Leads", desc: "Every inquiry logged, tracked, auto-nurtured.", icon: Users, color: "#a855f7" },
              { step: "02", title: "Quote & Contract", desc: "Branded quotations and e-sign contracts in minutes.", icon: FileText, color: "#3b82f6" },
              { step: "03", title: "Plan & Shoot", desc: "Assign teams, plan events, manage on-shoot tasks.", icon: Camera, color: "#ec4899" },
              { step: "04", title: "Deliver & Grow", desc: "Gallery, invoice, analytics — then repeat.", icon: Bot, color: "#06b6d4" },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative"
              >
                <div
                  className="h-full rounded-2xl border p-5"
                  style={{
                    background: "rgba(22,33,62,0.5)",
                    borderColor: `rgba(${hexToRgb(s.color)}, 0.2)`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded"
                      style={{
                        background: `rgba(${hexToRgb(s.color)}, 0.15)`,
                        color: s.color,
                      }}
                    >
                      STEP {s.step}
                    </span>
                    <s.icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(226,232,240,0.55)" }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-4xl mx-auto text-center rounded-3xl border p-12 md:p-16 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(22,33,62,0.6), rgba(59,130,246,0.08))",
            borderColor: "rgba(168,85,247,0.2)",
            boxShadow: "0 0 80px rgba(168,85,247,0.08)",
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl"
            style={{ background: "rgba(168,85,247,0.2)" }}
          />
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white relative"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ready to Transform Your Studio?
          </h2>
          <p className="max-w-lg mx-auto mb-8 relative" style={{ color: "rgba(226,232,240,0.55)" }}>
            Join 500+ studios already using StudioAi. Get in touch to see the platform in action.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/landing/contact")}
            className="text-base px-8 h-12 gap-2 text-white border-0 relative"
            style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
          >
            Enquire Now <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>
    </PageShell>
  );
}
