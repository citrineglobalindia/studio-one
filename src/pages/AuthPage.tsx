import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Aperture, Camera, Scan } from "lucide-react";
import cinemaCameraImg from "@/assets/cinema-camera.png";
import cameraLensImg from "@/assets/camera-lens.png";

const FloatingOrb = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-3xl pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -40, 0], x: [0, 20, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
    transition={{ duration: 6 + Math.random() * 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const FloatingParticle = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className="absolute rounded-full blur-sm pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color }}
    animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3], scale: [1, 1.4, 1] }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px pointer-events-none z-10"
    style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(59,130,246,0.4), transparent)" }}
    initial={{ top: "0%" }}
    animate={{ top: ["0%", "100%", "0%"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
  />
);

const HUDCorner = ({ position }: { position: string }) => {
  const corners: Record<string, string> = {
    "top-left": "top-4 left-4 border-t-2 border-l-2 rounded-tl-md",
    "top-right": "top-4 right-4 border-t-2 border-r-2 rounded-tr-md",
    "bottom-left": "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-md",
    "bottom-right": "bottom-4 right-4 border-b-2 border-r-2 rounded-br-md",
  };
  const colors = ["border-purple-500/30", "border-blue-500/30", "border-pink-500/30", "border-cyan-500/30"];
  return (
    <motion.div
      className={`absolute w-8 h-8 pointer-events-none ${corners[position]} ${colors[Object.keys(corners).indexOf(position)]}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 + Math.random() * 0.5, duration: 0.6 }}
    />
  );
};

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{
        perspective: "1200px",
        background: "linear-gradient(135deg, #0f0c29 0%, #1a0a2e 20%, #16213e 40%, #0d1b2a 60%, #1a1a2e 80%, #0f0c29 100%)",
      }}
    >
      {/* Colorful gradient orbs */}
      <FloatingOrb x="-5%" y="-10%" size={500} color="radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)" delay={0} />
      <FloatingOrb x="60%" y="-15%" size={450} color="radial-gradient(circle, rgba(59,130,246,0.2), transparent 70%)" delay={1} />
      <FloatingOrb x="70%" y="60%" size={400} color="radial-gradient(circle, rgba(236,72,153,0.2), transparent 70%)" delay={2} />
      <FloatingOrb x="-10%" y="70%" size={350} color="radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)" delay={1.5} />

      {/* Rotating conic overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ background: "conic-gradient(from 0deg at 50% 50%, rgba(168,85,247,0.1), rgba(59,130,246,0.1), rgba(6,182,212,0.1), rgba(236,72,153,0.1), rgba(168,85,247,0.1))" }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      {/* VR Grid floor */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[60%] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(168,85,247,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.15) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(60deg)",
          transformOrigin: "bottom center",
          maskImage: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
          WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1.5 }}
      />

      {/* Bokeh particles */}
      {[
        { x: "10%", y: "20%", size: 8, delay: 0, color: "rgba(168,85,247,0.6)" },
        { x: "85%", y: "15%", size: 10, delay: 1.2, color: "rgba(59,130,246,0.6)" },
        { x: "20%", y: "70%", size: 6, delay: 0.6, color: "rgba(6,182,212,0.6)" },
        { x: "75%", y: "80%", size: 9, delay: 2, color: "rgba(236,72,153,0.6)" },
        { x: "50%", y: "10%", size: 5, delay: 0.8, color: "rgba(245,158,11,0.6)" },
        { x: "90%", y: "50%", size: 7, delay: 1.5, color: "rgba(168,85,247,0.5)" },
        { x: "5%", y: "45%", size: 6, delay: 2.3, color: "rgba(59,130,246,0.5)" },
        { x: "40%", y: "30%", size: 5, delay: 1.8, color: "rgba(236,72,153,0.5)" },
      ].map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      <ScanLine />
      <HUDCorner position="top-left" />
      <HUDCorner position="top-right" />
      <HUDCorner position="bottom-left" />
      <HUDCorner position="bottom-right" />

      {/* ===== LEFT PANEL — Camera & Lens showcase ===== */}
      <div className="hidden lg:flex w-[55%] flex-col items-center justify-center relative">
        {/* Camera FX6 image — floating with parallax */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, x: -80, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src={cinemaCameraImg}
            alt="Cinema Camera FX6"
            className="w-[420px] drop-shadow-[0_0_60px_rgba(168,85,247,0.3)]"
            animate={{ y: [0, -12, 0], rotateY: [0, 3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Camera glow underneath */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-8 blur-2xl rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.3), transparent)" }}
          />
        </motion.div>

        {/* Lens image — floating below-left */}
        <motion.div
          className="absolute bottom-[10%] left-[8%] z-10"
          initial={{ opacity: 0, y: 50, rotate: -20 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img
            src={cameraLensImg}
            alt="Cinema Lens"
            className="w-36 drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]"
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </motion.div>

        {/* Branding text under camera */}
        <motion.div
          className="mt-8 text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
            Studio<span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Ai</span>
          </h1>
          <p className="text-sm text-purple-300/50 mt-2 font-mono tracking-wider">
            Cinema-Grade Studio Management
          </p>

          {/* Camera specs strip */}
          <motion.div
            className="flex items-center justify-center gap-5 mt-5 text-[10px] font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[
              { label: "FX6", color: "text-purple-400/60" },
              { label: "4K 120fps", color: "text-blue-400/60" },
              { label: "S-Cinetone", color: "text-cyan-400/60" },
              { label: "E-Mount", color: "text-pink-400/60" },
            ].map(({ label, color }, i) => (
              <motion.span
                key={label}
                className={`${color} tracking-widest uppercase`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 + i * 0.15 }}
              >
                {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div
          className="absolute right-0 top-[15%] bottom-[15%] w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(168,85,247,0.2), rgba(59,130,246,0.2), transparent)" }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
      </div>

      {/* ===== RIGHT PANEL — Login form ===== */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, z: -200, rotateX: 15 }}
          animate={{ opacity: 1, z: 0, rotateX: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 w-full max-w-sm"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Mobile header with lens */}
          <div className="lg:hidden text-center mb-8">
            <motion.img
              src={cameraLensImg}
              alt="Lens"
              className="w-20 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
            />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Studio<span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Ai</span>
            </h1>
            <p className="text-[10px] text-purple-300/40 mt-1 font-mono tracking-widest uppercase">Cinema Studio Platform</p>
          </div>

          {/* Rainbow glow ring */}
          <motion.div
            className="absolute -inset-[2px] rounded-3xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(59,130,246,0.4), rgba(6,182,212,0.3), rgba(236,72,153,0.4))",
              filter: "blur(8px)",
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(15,12,41,0.85), rgba(26,10,46,0.9), rgba(22,33,62,0.85))",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(168,85,247,0.15)",
              boxShadow: "0 0 80px -20px rgba(168,85,247,0.2), 0 0 60px -30px rgba(59,130,246,0.15)",
            }}
          >
            {/* Inner scan */}
            <motion.div
              className="absolute left-0 right-0 h-16 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(168,85,247,0.04), transparent)" }}
              animate={{ top: ["-64px", "110%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            />

            <div className="relative p-8">
              {/* Lens icon as card header */}
              <motion.div
                className="flex flex-col items-center mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div className="relative mb-4">
                  <motion.div
                    className="absolute -inset-4 rounded-full"
                    style={{ border: "1px dashed rgba(168,85,247,0.25)" }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute -inset-2 rounded-full"
                    style={{ border: "1px solid rgba(59,130,246,0.15)" }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.15))",
                      border: "1px solid rgba(168,85,247,0.25)",
                    }}
                  >
                    <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
                      <Aperture className="h-8 w-8 text-purple-400/80" strokeWidth={1.2} />
                    </motion.div>
                  </div>
                </motion.div>
                <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
                <p className="text-[10px] text-purple-300/40 mt-1 font-mono tracking-widest uppercase">Authenticate to continue</p>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="h-px mb-6"
                style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.3), rgba(59,130,246,0.3), rgba(6,182,212,0.3), transparent)" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <Label htmlFor="email" className="text-[10px] font-mono text-purple-300/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Scan className="h-3 w-3 text-cyan-400/50" />
                    Identity
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      placeholder="you@studio.com"
                      className="h-12 bg-white/5 border-purple-500/15 focus:border-purple-400/40 focus:bg-white/10 transition-all duration-300 pl-4 font-mono text-sm text-white placeholder:text-white/20"
                      required
                    />
                    <AnimatePresence>
                      {focused === "email" && (
                        <motion.div
                          className="absolute left-0 bottom-0 h-px"
                          style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.8), rgba(59,130,246,0.8), rgba(6,182,212,0.6))" }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          exit={{ width: "0%" }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  <Label htmlFor="password" className="text-[10px] font-mono text-blue-300/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Camera className="h-3 w-3 text-pink-400/50" />
                    Access Key
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")}
                      onBlur={() => setFocused(null)}
                      placeholder="••••••••"
                      className="pr-10 h-12 bg-white/5 border-purple-500/15 focus:border-pink-400/40 focus:bg-white/10 transition-all duration-300 pl-4 font-mono text-sm text-white placeholder:text-white/20"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300/40 hover:text-purple-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                      {focused === "password" && (
                        <motion.div
                          className="absolute left-0 bottom-0 h-px"
                          style={{ background: "linear-gradient(90deg, rgba(236,72,153,0.8), rgba(168,85,247,0.8), rgba(59,130,246,0.6))" }}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          exit={{ width: "0%" }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div className="flex justify-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <button type="button" className="text-[10px] font-mono text-cyan-400/40 hover:text-cyan-300 transition-colors tracking-wider uppercase">
                    Reset Access
                  </button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-sm font-semibold gap-2 relative overflow-hidden border-0 text-white"
                    style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.8), rgba(59,130,246,0.8), rgba(6,182,212,0.7))" }}
                    disabled={loading}
                  >
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span className="font-mono tracking-wider">AUTHENTICATE</span>
                        <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>→</motion.span>
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* HUD overlays */}
      <motion.div className="absolute top-6 left-12 text-[10px] font-mono text-purple-400/40 hidden md:flex flex-col gap-1 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        <span>SYS://STUDIO.AI</span>
        <span>CAM: FX6 · CINE</span>
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
          <span className="text-cyan-400/60">REC</span> <span className="text-red-400">●</span>
        </motion.span>
      </motion.div>

      <motion.div className="absolute top-6 right-12 text-[10px] font-mono text-blue-400/40 text-right hidden md:flex flex-col gap-1 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
        <span>4K · 120fps</span>
        <span className="text-pink-400/40">f/1.4 · ISO 800</span>
        <span className="text-amber-400/40">LENS: 85mm G Master</span>
      </motion.div>

      {/* Bottom bar */}
      <motion.div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}>
        <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest uppercase">
          <span className="text-purple-400/40">Studio<span className="text-cyan-400/50">Ai</span></span>
          <span className="w-px h-3 bg-purple-500/20" />
          <span className="text-blue-400/30">Cinema Studio Platform</span>
          <span className="w-px h-3 bg-purple-500/20" />
          <motion.span className="text-green-400/40" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>● SECURE</motion.span>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
