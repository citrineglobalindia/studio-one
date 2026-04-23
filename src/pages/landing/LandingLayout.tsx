import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Aperture, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FloatingOrb, FloatingParticle, ScanLine, PAGE_BG } from "./_shared";

const NAV = [
  { to: "/landing", label: "Home", end: true },
  { to: "/landing/features", label: "Features" },
  { to: "/landing/pricing", label: "Pricing" },
  { to: "/landing/testimonials", label: "Studios" },
  { to: "/landing/about", label: "About" },
  { to: "/landing/contact", label: "Contact" },
];

export default function LandingLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen overflow-x-hidden relative flex flex-col"
      style={{ background: PAGE_BG, color: "#e2e8f0" }}
    >
      {/* Persistent VR background */}
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
        {/* Soft grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(168,85,247,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-xl border-b"
        style={{ background: "rgba(15,12,41,0.7)", borderColor: "rgba(168,85,247,0.15)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <NavLink to="/landing" end className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
            >
              <Aperture className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Studio<span style={{ color: "#a855f7" }}>Ai</span>
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `relative px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? "text-white" : "text-white/60 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-lg -z-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.18))",
                          border: "1px solid rgba(168,85,247,0.3)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      />
                    )}
                    <span className="relative z-10">{null}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-white/70 hover:text-white hover:bg-white/10 hidden sm:inline-flex"
            >
              Log in
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/landing/contact")}
              className="gap-1 text-white border-0"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
            >
              Enquire <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <button
              className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-white/10"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden border-t"
              style={{ borderColor: "rgba(168,85,247,0.15)", background: "rgba(15,12,41,0.92)" }}
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                {NAV.map((n) => (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {n.label}
                  </NavLink>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="justify-start text-white/80 hover:text-white hover:bg-white/10 mt-1"
                >
                  Log in
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main with animated route transitions */}
      <main className="flex-1 relative z-10 pt-16">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Outlet />
          </div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-12 px-6 relative z-10 mt-12"
        style={{ borderColor: "rgba(168,85,247,0.15)", background: "rgba(15,12,41,0.4)" }}
      >
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
              >
                <Aperture className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">
                Studio<span style={{ color: "#a855f7" }}>Ai</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(226,232,240,0.5)" }}>
              The AI-powered operating system for modern photography & videography studios.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
              <li><NavLink to="/landing/features" className="hover:text-white">Features</NavLink></li>
              <li><NavLink to="/landing/pricing" className="hover:text-white">Pricing</NavLink></li>
              <li><NavLink to="/landing/testimonials" className="hover:text-white">Studios</NavLink></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-sm" style={{ color: "rgba(226,232,240,0.55)" }}>
              <li><NavLink to="/landing/about" className="hover:text-white">About</NavLink></li>
              <li><NavLink to="/landing/contact" className="hover:text-white">Contact</NavLink></li>
              <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
              <li><a href="/terms" className="hover:text-white">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">Get started</h4>
            <p className="text-sm mb-3" style={{ color: "rgba(226,232,240,0.55)" }}>
              Book a demo with our team.
            </p>
            <Button
              size="sm"
              onClick={() => navigate("/landing/contact")}
              className="text-white border-0 w-full"
              style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}
            >
              Enquire Now <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(168,85,247,0.08)" }}>
          <p className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>© 2026 StudioAi. Crafted for creators.</p>
          <p className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>Made in India · Built for the world</p>
        </div>
      </footer>
    </div>
  );
}
