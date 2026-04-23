import { motion } from "framer-motion";
import type { ReactNode } from "react";

export const FloatingOrb = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-3xl pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.25, 0.5, 0.25], scale: [1, 1.15, 1] }}
    transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export const FloatingParticle = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-sm pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2], scale: [1, 1.3, 1] }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px pointer-events-none z-10"
    style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), rgba(59,130,246,0.3), transparent)" }}
    initial={{ top: "0%" }}
    animate={{ top: ["0%", "100%", "0%"] }}
    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
  />
);

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

export const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
};

export const PAGE_BG = "linear-gradient(135deg, #0f0c29 0%, #1a0a2e 25%, #16213e 60%, #0d1b2a 100%)";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative z-10"
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({
  badge,
  badgeIcon: Icon,
  badgeTint,
  title,
  subtitle,
}: {
  badge: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
  badgeTint: { bg: string; color: string };
  title: ReactNode;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={0}
      className="text-center mb-14"
    >
      <span
        className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border-0"
        style={{ background: badgeTint.bg, color: badgeTint.color }}
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {badge}
      </span>
      <h2
        className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-4 text-white"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-2xl mx-auto text-sm md:text-base" style={{ color: "rgba(226,232,240,0.55)" }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
