import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Aperture, Heart, Target, Compass, Rocket, Users, Sparkles,
  Coffee, Code, Lightbulb, ArrowRight, Globe,
} from "lucide-react";
import { PageShell, SectionHeader, fadeUp, hexToRgb } from "./_shared";

const VALUES = [
  { icon: Heart, title: "Studios First", desc: "Every feature is shaped by studios who actually run shoots and studios — not product managers guessing.", color: "#ec4899" },
  { icon: Rocket, title: "Ship Weekly", desc: "We release every week. Bugs get fixed in days, not quarters. You feel the momentum.", color: "#3b82f6" },
  { icon: Target, title: "Obsess Over Craft", desc: "Pixel-perfect UI, sub-second load times, and keyboard shortcuts that make pros feel at home.", color: "#a855f7" },
  { icon: Globe, title: "Built for India", desc: "GST, UPI, WhatsApp, Hindi support — with the global polish studios deserve.", color: "#10b981" },
];

const TIMELINE = [
  { year: "2023", title: "The Spark", desc: "Founded after our co-founder's sister — a wedding photographer — lost three bookings to a spreadsheet error.", color: "#a855f7" },
  { year: "2024", title: "First 50 Studios", desc: "Quiet launch in Mumbai. Fifty studios signed up in the first month. We barely slept.", color: "#3b82f6" },
  { year: "2025", title: "AI Assistant Launch", desc: "Shipped our AI co-pilot. Average studio saves 18 hours a week on admin.", color: "#ec4899" },
  { year: "2026", title: "500+ Studios", desc: "Trusted by 500+ studios across 40 Indian cities. And we're just getting started.", color: "#f59e0b" },
];

const TEAM = [
  { name: "Aarav Patel", role: "Co-founder & CEO", bio: "Ex-product lead, obsessive about craft.", color: "#a855f7", initials: "AP" },
  { name: "Sana Reddy", role: "Co-founder & CTO", bio: "Built payments infra at a unicorn.", color: "#3b82f6", initials: "SR" },
  { name: "Kabir Joshi", role: "Head of Design", bio: "Designed for creators before it was cool.", color: "#ec4899", initials: "KJ" },
  { name: "Ria Menon", role: "Head of Studios", bio: "Photographer turned product whisperer.", color: "#06b6d4", initials: "RM" },
  { name: "Dev Shah", role: "Head of Engineering", bio: "Ships faster than you can refactor.", color: "#10b981", initials: "DS" },
  { name: "Ishaan Verma", role: "Head of Growth", bio: "Grew 3 SaaS brands past ₹10Cr ARR.", color: "#f59e0b", initials: "IV" },
];

const STATS = [
  { value: "500+", label: "Studios served", color: "#a855f7" },
  { value: "40+", label: "Cities", color: "#3b82f6" },
  { value: "18", label: "Team members", color: "#ec4899" },
  { value: "2023", label: "Founded", color: "#06b6d4" },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge
              className="mb-5 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
              style={{ background: "rgba(6,182,212,0.15)", color: "#67e8f9" }}
            >
              <Aperture className="h-3.5 w-3.5" /> Our Story
            </Badge>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6 text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            We're Building the
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #06b6d4, #a855f7, #ec4899)" }}
            >
              Operating System
            </span>
            <br />
            for Creators.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{ color: "rgba(226,232,240,0.6)" }}
          >
            StudioAi is a small, obsessed team on a mission to free photography and videography studios from the tyranny of spreadsheets — so creators can get back to creating.
          </motion.p>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-6 -mt-4 mb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border p-5 text-center"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: `rgba(${hexToRgb(s.color)}, 0.2)`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="text-3xl font-extrabold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${s.color}, #a855f7)` }}
              >
                {s.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(226,232,240,0.5)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Mission block */}
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <Badge className="mb-4 border-0" style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}>
              <Compass className="h-3.5 w-3.5 mr-1.5" /> Our Mission
            </Badge>
            <h2
              className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Give every studio a
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
              > superpower.</span>
            </h2>
            <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: "rgba(226,232,240,0.7)" }}>
              Running a studio is already hard. You juggle vendors, clients, timelines, cash flow, team dynamics, and the craft itself.
            </p>
            <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: "rgba(226,232,240,0.7)" }}>
              We believe software should take the weight — not add to it. StudioAi replaces 7+ tools with one opinionated, beautifully crafted platform built around how real studios actually work.
            </p>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(226,232,240,0.7)" }}>
              Our North Star: <span className="text-white font-semibold">every studio owner should reclaim a full day each week</span>. Everything we build is measured against that.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-square rounded-3xl border p-10 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.15), rgba(22,33,62,0.5) 70%)",
              borderColor: "rgba(168,85,247,0.25)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Rotating rings */}
            <motion.div
              className="absolute inset-8 rounded-full border"
              style={{ borderColor: "rgba(168,85,247,0.25)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-16 rounded-full border"
              style={{ borderColor: "rgba(59,130,246,0.25)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-24 rounded-full border"
              style={{ borderColor: "rgba(236,72,153,0.25)" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />

            {/* Center icon */}
            <motion.div
              className="relative z-10 h-28 w-28 rounded-3xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #a855f7, #3b82f6)",
                boxShadow: "0 0 60px rgba(168,85,247,0.4)",
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Aperture className="h-14 w-14 text-white" />
            </motion.div>

            {/* Floating value pills */}
            {[
              { text: "Fast", angle: 0, color: "#a855f7" },
              { text: "Honest", angle: 90, color: "#3b82f6" },
              { text: "Opinionated", angle: 180, color: "#ec4899" },
              { text: "Crafted", angle: 270, color: "#06b6d4" },
            ].map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              return (
                <motion.div
                  key={p.text}
                  className="absolute z-20 px-3 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md"
                  style={{
                    left: `calc(50% + ${Math.cos(rad) * 45}% - 32px)`,
                    top: `calc(50% + ${Math.sin(rad) * 45}% - 12px)`,
                    background: `rgba(${hexToRgb(p.color)}, 0.15)`,
                    borderColor: `rgba(${hexToRgb(p.color)}, 0.4)`,
                    color: p.color,
                  }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  {p.text}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <SectionHeader
          badge="What We Believe"
          badgeTint={{ bg: "rgba(236,72,153,0.15)", color: "#f9a8d4" }}
          title="The Principles That Guide Us"
        />
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-5">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className="h-full border"
                style={{
                  background: "rgba(22,33,62,0.5)",
                  borderColor: `rgba(${hexToRgb(v.color)}, 0.2)`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <CardContent className="p-6 flex gap-4">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `rgba(${hexToRgb(v.color)}, 0.15)`,
                      boxShadow: `0 0 20px rgba(${hexToRgb(v.color)}, 0.1)`,
                    }}
                  >
                    <v.icon className="h-6 w-6" style={{ color: v.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1.5">{v.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(226,232,240,0.6)" }}>
                      {v.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6">
        <SectionHeader
          badge="Our Journey"
          badgeTint={{ bg: "rgba(59,130,246,0.15)", color: "#93c5fd" }}
          title="From Idea to 500+ Studios"
        />
        <div className="max-w-4xl mx-auto relative">
          {/* Center line */}
          <div
            className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px"
            style={{ background: "linear-gradient(180deg, #a855f7, #3b82f6, #ec4899, #f59e0b)" }}
          />
          <div className="space-y-10">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.year}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className={`relative flex md:items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                {/* Dot */}
                <div
                  className="absolute left-4 md:left-1/2 md:-translate-x-1/2 h-4 w-4 rounded-full ring-4 z-10"
                  style={{
                    background: t.color,
                    boxShadow: `0 0 20px ${t.color}`,
                    "--tw-ring-color": "rgba(15,12,41,1)",
                  } as React.CSSProperties}
                />
                {/* Card */}
                <div className="ml-12 md:ml-0 md:w-5/12">
                  <div
                    className="rounded-2xl border p-5"
                    style={{
                      background: "rgba(22,33,62,0.5)",
                      borderColor: `rgba(${hexToRgb(t.color)}, 0.25)`,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div
                      className="text-[10px] font-mono tracking-widest inline-block mb-2 px-2 py-0.5 rounded"
                      style={{ background: `rgba(${hexToRgb(t.color)}, 0.15)`, color: t.color }}
                    >
                      {t.year}
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1.5">{t.title}</h3>
                    <p className="text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
                      {t.desc}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block md:w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6">
        <SectionHeader
          badge="The Team"
          badgeTint={{ bg: "rgba(168,85,247,0.15)", color: "#c084fc" }}
          title="Humans Behind the Pixels"
          subtitle="A small, senior team that cares deeply — and ships accordingly."
        />
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className="h-full border transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: "rgba(22,33,62,0.5)",
                  borderColor: `rgba(${hexToRgb(m.color)}, 0.2)`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className="h-20 w-20 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold mb-4 transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${m.color}, rgba(${hexToRgb(m.color)}, 0.5))`,
                      color: "white",
                      boxShadow: `0 0 30px rgba(${hexToRgb(m.color)}, 0.25)`,
                    }}
                  >
                    {m.initials}
                  </div>
                  <h3 className="font-bold text-white">{m.name}</h3>
                  <p className="text-xs mb-2" style={{ color: m.color }}>
                    {m.role}
                  </p>
                  <p className="text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
                    {m.bio}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Culture tags */}
      <section className="py-10 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-4xl mx-auto flex flex-wrap gap-3 justify-center"
        >
          {[
            { icon: Coffee, text: "Remote-first", color: "#a855f7" },
            { icon: Code, text: "Weekly releases", color: "#3b82f6" },
            { icon: Lightbulb, text: "Curiosity over seniority", color: "#ec4899" },
            { icon: Users, text: "No-meeting Wednesdays", color: "#06b6d4" },
            { icon: Sparkles, text: "Ship > Polish", color: "#f59e0b" },
          ].map((c) => (
            <div
              key={c.text}
              className="px-4 py-2 rounded-full border text-xs font-medium flex items-center gap-2"
              style={{
                background: `rgba(${hexToRgb(c.color)}, 0.1)`,
                borderColor: `rgba(${hexToRgb(c.color)}, 0.3)`,
                color: c.color,
              }}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.text}
            </div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl border p-10 md:p-14"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(22,33,62,0.6), rgba(168,85,247,0.1))",
            borderColor: "rgba(6,182,212,0.25)",
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build with us
          </h2>
          <p className="mb-6 text-sm md:text-base" style={{ color: "rgba(226,232,240,0.6)" }}>
            Whether you want to use StudioAi, partner with us, or join the team — we'd love to hear from you.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/landing/contact")}
            className="text-white border-0 gap-2"
            style={{ background: "linear-gradient(135deg, #06b6d4, #a855f7)" }}
          >
            Get in Touch <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
