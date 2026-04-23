import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Quote, TrendingUp, Clock, Users, ArrowRight } from "lucide-react";
import { PageShell, SectionHeader, fadeUp, hexToRgb } from "./_shared";

const TESTIMONIALS = [
  {
    name: "Rahul Mehta",
    role: "Founder",
    studio: "PixelPerfect Studios",
    location: "Mumbai",
    text: "StudioAi transformed how we manage our wedding photography business. We went from spreadsheets to a fully automated workflow in 3 weeks. My team now focuses on craft, not paperwork.",
    avatar: "RM",
    rating: 5,
    metric: { label: "Hours saved / week", value: "18" },
    color: "#a855f7",
  },
  {
    name: "Priya Sharma",
    role: "Creative Director",
    studio: "Lumiere Photography",
    location: "Delhi",
    text: "The AI assistant alone saved us 10+ hours a week on client messaging. Quotations that used to take an hour go out in 5 minutes — branded and consistent.",
    avatar: "PS",
    rating: 5,
    metric: { label: "Faster quote turnaround", value: "12x" },
    color: "#3b82f6",
  },
  {
    name: "Arjun Kapoor",
    role: "Owner",
    studio: "FrameStory Films",
    location: "Bangalore",
    text: "Finally a platform built for Indian photography studios. GST invoicing, WhatsApp integration, vendor payments — everything just works. Our accounts team loves it.",
    avatar: "AK",
    rating: 5,
    metric: { label: "Payment collection time", value: "-60%" },
    color: "#ec4899",
  },
  {
    name: "Neha Iyer",
    role: "Partner",
    studio: "Kairos Weddings",
    location: "Chennai",
    text: "We shoot 80+ weddings a year. Before StudioAi, project handovers between photographers, editors, and clients were chaos. Now it's one timeline everyone sees.",
    avatar: "NI",
    rating: 5,
    metric: { label: "Project throughput", value: "+42%" },
    color: "#06b6d4",
  },
  {
    name: "Vikram Singh",
    role: "Lead Photographer",
    studio: "Shutter & Stories",
    location: "Jaipur",
    text: "The mobile role views are gold. On shoot days I check schedules, client notes, and contracts from my phone. No more calling the studio mid-shoot.",
    avatar: "VS",
    rating: 5,
    metric: { label: "On-site lookups", value: "Instant" },
    color: "#f59e0b",
  },
  {
    name: "Ananya Desai",
    role: "Studio Manager",
    studio: "Canvas Collective",
    location: "Pune",
    text: "Onboarding took two days. Two. My team was in and running faster than any software we've used before. Support team actually picks up the phone.",
    avatar: "AD",
    rating: 5,
    metric: { label: "Onboarding time", value: "2 days" },
    color: "#10b981",
  },
];

const CASE_STUDIES = [
  {
    studio: "PixelPerfect Studios",
    tag: "Wedding Photography",
    stat1: { value: "3.2x", label: "Revenue growth (12 mo)" },
    stat2: { value: "₹40L", label: "New revenue unlocked" },
    stat3: { value: "18 hrs", label: "Saved per week" },
    color: "#a855f7",
  },
  {
    studio: "FrameStory Films",
    tag: "Video & Cinematography",
    stat1: { value: "-60%", label: "Payment collection time" },
    stat2: { value: "100%", label: "GST compliance" },
    stat3: { value: "0", label: "Spreadsheets in use" },
    color: "#ec4899",
  },
  {
    studio: "Kairos Weddings",
    tag: "Destination Weddings",
    stat1: { value: "+42%", label: "Project throughput" },
    stat2: { value: "80+", label: "Weddings managed / year" },
    stat3: { value: "4", label: "Teams in sync" },
    color: "#06b6d4",
  },
];

export default function Testimonials() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge
              className="mb-5 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
              style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}
            >
              <Star className="h-3.5 w-3.5 fill-current" /> Loved by 500+ Studios
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
            Stories From
            <span
              className="bg-clip-text text-transparent ml-3"
              style={{ backgroundImage: "linear-gradient(135deg, #f59e0b, #ec4899, #a855f7)" }}
            >
              Real Studios
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
            From boutique wedding photographers to agencies with 40+ staff — see how studios across India use StudioAi.
          </motion.p>
        </div>
      </section>

      {/* Stats band */}
      <section className="py-10 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Users, value: "500+", label: "Active studios", color: "#a855f7" },
            { icon: TrendingUp, value: "₹2Cr+", label: "Revenue managed", color: "#3b82f6" },
            { icon: Clock, value: "18 hrs", label: "Avg. saved / week", color: "#ec4899" },
            { icon: Star, value: "4.9/5", label: "Customer rating", color: "#f59e0b" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border p-5 text-center"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: `rgba(${hexToRgb(s.color)}, 0.2)`,
                backdropFilter: "blur(12px)",
              }}
            >
              <s.icon className="h-5 w-5 mx-auto mb-2" style={{ color: s.color }} />
              <div
                className="text-2xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(135deg, ${s.color}, #3b82f6)` }}
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

      {/* Testimonial grid — masonry feel via varied heights */}
      <section className="py-16 px-6">
        <SectionHeader
          badge="Testimonials"
          badgeTint={{ bg: "rgba(168,85,247,0.15)", color: "#c084fc" }}
          title="What Studios Are Saying"
        />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className="h-full border transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                style={{
                  background: "rgba(22,33,62,0.5)",
                  borderColor: `rgba(${hexToRgb(t.color)}, 0.2)`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-30 transition-opacity group-hover:opacity-60"
                  style={{ background: `rgba(${hexToRgb(t.color)}, 0.3)` }}
                />
                <CardContent className="p-6 relative">
                  <Quote className="h-6 w-6 mb-3" style={{ color: t.color }} />
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(226,232,240,0.75)" }}>
                    "{t.text}"
                  </p>
                  <div
                    className="rounded-xl p-3 mb-5"
                    style={{
                      background: `rgba(${hexToRgb(t.color)}, 0.1)`,
                      border: `1px solid rgba(${hexToRgb(t.color)}, 0.2)`,
                    }}
                  >
                    <div className="text-xs" style={{ color: "rgba(226,232,240,0.55)" }}>
                      {t.metric.label}
                    </div>
                    <div
                      className="text-xl font-bold bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(135deg, ${t.color}, #3b82f6)` }}
                    >
                      {t.metric.value}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: `rgba(${hexToRgb(t.color)}, 0.2)`,
                        color: t.color,
                      }}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white">{t.name}</div>
                      <div className="text-xs" style={{ color: "rgba(226,232,240,0.5)" }}>
                        {t.role} · {t.studio} · {t.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Case studies */}
      <section className="py-16 px-6">
        <SectionHeader
          badge="Case Studies"
          badgeTint={{ bg: "rgba(59,130,246,0.15)", color: "#93c5fd" }}
          title="The Numbers Behind the Stories"
          subtitle="Real outcomes from studios who made the switch."
        />
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          {CASE_STUDIES.map((c, i) => (
            <motion.div
              key={c.studio}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <div
                className="h-full rounded-2xl border p-6"
                style={{
                  background: `linear-gradient(135deg, rgba(${hexToRgb(c.color)}, 0.08), rgba(22,33,62,0.6))`,
                  borderColor: `rgba(${hexToRgb(c.color)}, 0.25)`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <span
                  className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded inline-block mb-3"
                  style={{ background: `rgba(${hexToRgb(c.color)}, 0.15)`, color: c.color }}
                >
                  {c.tag}
                </span>
                <h3 className="text-lg font-bold text-white mb-5">{c.studio}</h3>
                <div className="space-y-4">
                  {[c.stat1, c.stat2, c.stat3].map((s, idx) => (
                    <div key={idx} className="flex items-baseline justify-between gap-3">
                      <span className="text-xs" style={{ color: "rgba(226,232,240,0.55)" }}>
                        {s.label}
                      </span>
                      <span className="text-xl font-bold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-4xl mx-auto text-center rounded-3xl border p-10 md:p-14"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(22,33,62,0.6), rgba(236,72,153,0.08))",
            borderColor: "rgba(245,158,11,0.25)",
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Join 500+ studios growing with StudioAi
          </h2>
          <p className="mb-6 text-sm md:text-base" style={{ color: "rgba(226,232,240,0.55)" }}>
            Your studio could be the next success story. Talk to us.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/landing/contact")}
            className="text-white border-0 gap-2"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ec4899)" }}
          >
            Enquire Now <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
