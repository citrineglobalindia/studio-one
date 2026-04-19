import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RoleSubpageHeader } from "@/components/role-mobile/RoleSubpageHeader";

const FAQS = [
  { q: "How do I clock in for a shoot?", a: "Open the Attendance page from the home dashboard and tap 'Clock In'. Your session timer will start." },
  { q: "When do I get paid?", a: "Studio admin processes payments at the end of each calendar month. Pending amounts are visible under Money." },
  { q: "Can I switch projects?", a: "Project assignments are managed by the studio admin. Reach out via Team Chat to request a change." },
  { q: "How do I update my profile photo?", a: "Go to Profile → tap the edit icon next to your avatar." },
  { q: "What if the app feels slow?", a: "Pull to refresh, or sign out and back in. Persistent issues? Send us feedback." },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <RoleSubpageHeader title="Help & FAQ" back="/m/settings">
      <p className="text-[12px] text-muted-foreground mb-4">Quick answers to the most common questions.</p>
      <div className="space-y-2">
        {FAQS.map((f, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
            >
              <p className="text-[13px] font-semibold text-foreground">{f.q}</p>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-[12px] text-muted-foreground leading-relaxed">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </RoleSubpageHeader>
  );
}
