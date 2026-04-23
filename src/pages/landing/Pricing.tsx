import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { PageShell, SectionHeader, fadeUp, hexToRgb } from "./_shared";

type Plan = {
  name: string;
  tagline: string;
  price: { monthly: string; yearly: string };
  features: string[];
  popular?: boolean;
  color: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    tagline: "For solo photographers getting started.",
    price: { monthly: "₹999", yearly: "₹9,990" },
    features: ["Up to 10 clients", "Basic CRM & leads", "5 projects", "1 team member", "Email support"],
    color: "#3b82f6",
  },
  {
    name: "Professional",
    tagline: "For growing photography studios.",
    price: { monthly: "₹2,999", yearly: "₹29,990" },
    features: [
      "Unlimited clients",
      "Full CRM & automation",
      "Unlimited projects",
      "Up to 10 team members",
      "AI Assistant",
      "Contracts & invoicing",
      "Priority support",
    ],
    popular: true,
    color: "#a855f7",
  },
  {
    name: "Enterprise",
    tagline: "For large studios & agencies.",
    price: { monthly: "Custom", yearly: "Custom" },
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "White-label branding",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SSO & advanced security",
    ],
    color: "#ec4899",
  },
];

const COMPARE = [
  { label: "Clients", starter: "10", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "Team members", starter: "1", pro: "10", enterprise: "Unlimited" },
  { label: "Projects", starter: "5", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "AI Assistant", starter: false, pro: true, enterprise: true },
  { label: "Automations", starter: false, pro: true, enterprise: true },
  { label: "E-sign contracts", starter: false, pro: true, enterprise: true },
  { label: "White-label branding", starter: false, pro: false, enterprise: true },
  { label: "API access", starter: false, pro: false, enterprise: true },
  { label: "SSO & SCIM", starter: false, pro: false, enterprise: true },
  { label: "Dedicated manager", starter: false, pro: false, enterprise: true },
];

const FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes — every new studio gets a 14-day full-access trial. No credit card required, cancel anytime.",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade anytime from your settings. Billing is prorated automatically.",
  },
  {
    q: "Do you support GST invoicing?",
    a: "Yes. All invoices are GST-compliant with auto-calculated tax, HSN codes, and TDS support.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You get a 30-day window to export all data — clients, invoices, albums, contracts — in standard formats.",
  },
  {
    q: "Do you offer white-label branding?",
    a: "Yes, on the Enterprise plan. Your logo, domain, and colors across the platform and client portal.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-20 pb-10 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge
              className="mb-5 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
              style={{ background: "rgba(236,72,153,0.15)", color: "#f9a8d4" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Simple, Transparent Pricing
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
            Plans That
            <span
              className="bg-clip-text text-transparent ml-3"
              style={{ backgroundImage: "linear-gradient(135deg, #a855f7, #3b82f6, #06b6d4)" }}
            >
              Grow With You
            </span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg max-w-xl mx-auto mb-8"
            style={{ color: "rgba(226,232,240,0.6)" }}
          >
            Start free for 14 days. Upgrade when you're ready. No hidden fees.
          </motion.p>

          {/* Billing toggle */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="inline-flex rounded-full border p-1"
            style={{ borderColor: "rgba(168,85,247,0.25)", background: "rgba(22,33,62,0.5)" }}
          >
            {(["monthly", "yearly"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-5 py-2 text-xs font-medium rounded-full transition-colors ${
                  billing === b ? "text-white" : "text-white/50 hover:text-white/80"
                }`}
              >
                {billing === b && (
                  <motion.span
                    layoutId="billing-active"
                    className="absolute inset-0 rounded-full"
                    style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {b === "monthly" ? "Monthly" : "Yearly"}
                  {b === "yearly" && (
                    <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300">
                      SAVE 17%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="py-10 px-6">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card
                className={`relative h-full border transition-all duration-300 ${
                  plan.popular ? "md:scale-[1.04]" : "hover:scale-[1.02]"
                }`}
                style={{
                  background: plan.popular ? `rgba(${hexToRgb(plan.color)}, 0.1)` : "rgba(22,33,62,0.5)",
                  borderColor: plan.popular ? `rgba(${hexToRgb(plan.color)}, 0.4)` : "rgba(168,85,247,0.12)",
                  boxShadow: plan.popular ? `0 0 60px rgba(${hexToRgb(plan.color)}, 0.15)` : "none",
                  backdropFilter: "blur(12px)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge
                      className="px-3 text-white border-0"
                      style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                    >
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8 flex flex-col h-full">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-sm mt-1 mb-5" style={{ color: "rgba(226,232,240,0.5)" }}>
                    {plan.tagline}
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={billing}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6"
                    >
                      <span
                        className="text-4xl font-extrabold bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(135deg, ${plan.color}, #3b82f6)` }}
                      >
                        {plan.price[billing]}
                      </span>
                      {plan.price[billing] !== "Custom" && (
                        <span className="text-xs ml-1.5" style={{ color: "rgba(226,232,240,0.5)" }}>
                          / {billing === "monthly" ? "month" : "year"}
                        </span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: plan.color }} />
                        <span style={{ color: "rgba(226,232,240,0.7)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-8 text-white border-0 gap-1"
                    style={{
                      background: plan.popular
                        ? "linear-gradient(135deg, #a855f7, #3b82f6)"
                        : `rgba(${hexToRgb(plan.color)}, 0.15)`,
                    }}
                    onClick={() => navigate("/landing/contact")}
                  >
                    {plan.price[billing] === "Custom" ? "Talk to Sales" : "Get Started"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-6">
        <SectionHeader
          badge="Compare"
          badgeTint={{ bg: "rgba(168,85,247,0.15)", color: "#c084fc" }}
          title="Plan Comparison"
          subtitle="Everything you get in each tier, side by side."
        />
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: "rgba(168,85,247,0.2)", background: "rgba(22,33,62,0.4)", backdropFilter: "blur(12px)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ background: "rgba(168,85,247,0.08)" }}>
                  <th className="p-4 font-semibold text-white/80">Feature</th>
                  <th className="p-4 font-semibold text-white text-center">Starter</th>
                  <th className="p-4 font-semibold text-center" style={{ color: "#c084fc" }}>
                    Professional
                  </th>
                  <th className="p-4 font-semibold text-white text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr
                    key={row.label}
                    className="border-t"
                    style={{ borderColor: "rgba(168,85,247,0.08)" }}
                  >
                    <td className="p-4 text-white/80">{row.label}</td>
                    {["starter", "pro", "enterprise"].map((tier) => {
                      const val = row[tier as keyof typeof row];
                      return (
                        <td key={tier} className="p-4 text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                            ) : (
                              <X className="h-4 w-4 text-white/20 mx-auto" />
                            )
                          ) : (
                            <span className="text-white/70">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <SectionHeader
          badge="FAQ"
          badgeTint={{ bg: "rgba(6,182,212,0.15)", color: "#67e8f9" }}
          title="Questions, Answered"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <motion.div
                key={item.q}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: open ? "rgba(168,85,247,0.08)" : "rgba(22,33,62,0.5)",
                  borderColor: open ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.12)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-white">{item.q}</span>
                  <ChevronDown
                    className="h-5 w-5 text-white/60 transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-sm" style={{ color: "rgba(226,232,240,0.65)" }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
