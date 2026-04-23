import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  User, Mail, Phone, Send, MessageSquare, MapPin, Clock, Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, fadeUp, hexToRgb } from "./_shared";

const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@studioai.in",
    href: "mailto:hello@studioai.in",
    color: "#a855f7",
  },
  {
    icon: Phone,
    label: "Call",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
    color: "#3b82f6",
  },
  {
    icon: MessageSquare,
    label: "WhatsApp",
    value: "Chat with us",
    href: "https://wa.me/919876543210",
    color: "#10b981",
  },
];

const OFFICES = [
  { city: "Mumbai", addr: "BKC, Mumbai 400051", note: "Headquarters", color: "#a855f7" },
  { city: "Bangalore", addr: "Koramangala, Bangalore 560034", note: "Engineering", color: "#3b82f6" },
  { city: "Delhi", addr: "Cyber City, Gurgaon 122002", note: "Customer Success", color: "#ec4899" },
];

export default function Contact() {
  const [enquiry, setEnquiry] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setSubmitted(true);
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="pt-20 pb-10 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <Badge
              className="mb-5 px-4 py-1.5 text-xs font-medium gap-1.5 border-0 inline-flex"
              style={{ background: "rgba(6,182,212,0.12)", color: "#67e8f9" }}
            >
              <Sparkles className="h-3.5 w-3.5" /> Let's talk
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
            Have Questions?
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #06b6d4, #a855f7, #ec4899)" }}
            >
              We're Here To Help.
            </span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base md:text-lg max-w-xl mx-auto"
            style={{ color: "rgba(226,232,240,0.6)" }}
          >
            Fill the form and we'll get back within 24 hours — or reach us directly on any channel below.
          </motion.p>
        </div>
      </section>

      {/* Contact channels */}
      <section className="py-6 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4"
        >
          {CHANNELS.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:scale-[1.03] hover:-translate-y-1 group"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: `rgba(${hexToRgb(c.color)}, 0.25)`,
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{
                  background: `rgba(${hexToRgb(c.color)}, 0.15)`,
                  boxShadow: `0 0 20px rgba(${hexToRgb(c.color)}, 0.15)`,
                }}
              >
                <c.icon className="h-5 w-5" style={{ color: c.color }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "rgba(226,232,240,0.5)" }}>
                  {c.label}
                </div>
                <div className="font-semibold text-white">{c.value}</div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* Form + meta */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="lg:col-span-3"
          >
            <Card
              className="border"
              style={{
                background: "rgba(22,33,62,0.6)",
                borderColor: "rgba(168,85,247,0.25)",
                boxShadow: "0 0 80px rgba(168,85,247,0.08)",
                backdropFilter: "blur(16px)",
              }}
            >
              <CardContent className="p-6 md:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 text-center"
                  >
                    <div
                      className="h-16 w-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #06b6d4)",
                        boxShadow: "0 0 40px rgba(16,185,129,0.35)",
                      }}
                    >
                      <CheckCircle2 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Message received!</h3>
                    <p className="text-sm mb-6" style={{ color: "rgba(226,232,240,0.6)" }}>
                      Our team will reach out within 24 hours. Meanwhile, feel free to explore.
                    </p>
                    <Button variant="outline" onClick={() => setSubmitted(false)} className="text-white" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
                      Send another message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleEnquiry} className="space-y-4">
                    <div>
                      <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.55)" }}>
                        Full Name *
                      </Label>
                      <div className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                        <Input
                          value={enquiry.name}
                          onChange={(e) => setEnquiry((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Your name"
                          className="pl-9 border text-white placeholder:text-white/30"
                          style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.55)" }}>
                          Email *
                        </Label>
                        <div className="relative mt-1.5">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                          <Input
                            type="email"
                            value={enquiry.email}
                            onChange={(e) => setEnquiry((p) => ({ ...p, email: e.target.value }))}
                            placeholder="you@email.com"
                            className="pl-9 border text-white placeholder:text-white/30"
                            style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.55)" }}>
                          Phone
                        </Label>
                        <div className="relative mt-1.5">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "rgba(226,232,240,0.4)" }} />
                          <Input
                            value={enquiry.phone}
                            onChange={(e) => setEnquiry((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="+91..."
                            className="pl-9 border text-white placeholder:text-white/30"
                            style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium" style={{ color: "rgba(226,232,240,0.55)" }}>
                        Tell us about your studio *
                      </Label>
                      <Textarea
                        value={enquiry.message}
                        onChange={(e) => setEnquiry((p) => ({ ...p, message: e.target.value }))}
                        placeholder="Team size, services, what you're looking to improve..."
                        className="mt-1.5 min-h-[120px] border text-white placeholder:text-white/30"
                        style={{ background: "rgba(15,12,41,0.5)", borderColor: "rgba(168,85,247,0.2)" }}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2 text-white border-0"
                      style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Enquiry <Send className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <p className="text-[11px] text-center" style={{ color: "rgba(226,232,240,0.4)" }}>
                      By submitting, you agree to our privacy policy. We'll never spam.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Meta sidebar */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="lg:col-span-2 space-y-4"
          >
            <div
              className="rounded-2xl border p-5"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: "rgba(168,85,247,0.2)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-emerald-400" />
                <h4 className="font-semibold text-white text-sm">Response time</h4>
              </div>
              <p className="text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
                We reply within <span className="text-white font-semibold">4 business hours</span>, Mon–Sat, 10 AM – 7 PM IST.
              </p>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                background: "rgba(22,33,62,0.5)",
                borderColor: "rgba(59,130,246,0.2)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4" style={{ color: "#3b82f6" }} />
                <h4 className="font-semibold text-white text-sm">Our offices</h4>
              </div>
              <div className="space-y-3">
                {OFFICES.map((o) => (
                  <div key={o.city} className="flex items-start gap-3">
                    <div
                      className="h-2 w-2 rounded-full mt-1.5"
                      style={{ background: o.color, boxShadow: `0 0 8px ${o.color}` }}
                    />
                    <div>
                      <div className="font-semibold text-sm text-white">{o.city} · <span className="font-normal" style={{ color: o.color }}>{o.note}</span></div>
                      <div className="text-xs" style={{ color: "rgba(226,232,240,0.55)" }}>
                        {o.addr}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(22,33,62,0.6))",
                borderColor: "rgba(168,85,247,0.3)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h4 className="font-semibold text-white text-sm mb-2">Prefer a call?</h4>
              <p className="text-xs mb-3" style={{ color: "rgba(226,232,240,0.6)" }}>
                Book a 20-minute demo and we'll walk you through your studio's workflow.
              </p>
              <Button
                size="sm"
                className="w-full text-white border-0"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
                onClick={() => window.open("https://wa.me/919876543210", "_blank")}
              >
                Book Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
