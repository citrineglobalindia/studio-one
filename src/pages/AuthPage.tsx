import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Aperture, Camera, Scan } from "lucide-react";

const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20 blur-sm pointer-events-none"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.3, 1],
    }}
    transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none z-10"
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
  return (
    <motion.div
      className={`absolute w-8 h-8 border-primary/25 pointer-events-none ${corners[position]}`}
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Deep background layers for depth */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Radial depth glow */}
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Grid floor — VR-style */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[60%] opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "bottom center",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          transition={{ delay: 0.3, duration: 1.5 }}
        />

        {/* Horizon line */}
        <motion.div
          className="absolute left-0 right-0 top-[52%] h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.2 }}
        />
      </motion.div>

      {/* Floating bokeh particles */}
      {[
        { x: "10%", y: "20%", size: 6, delay: 0 },
        { x: "85%", y: "15%", size: 8, delay: 1.2 },
        { x: "20%", y: "70%", size: 5, delay: 0.6 },
        { x: "75%", y: "80%", size: 7, delay: 2 },
        { x: "50%", y: "10%", size: 4, delay: 0.8 },
        { x: "90%", y: "50%", size: 6, delay: 1.5 },
        { x: "5%", y: "45%", size: 5, delay: 2.3 },
        { x: "60%", y: "90%", size: 8, delay: 0.3 },
      ].map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* Scan line overlay */}
      <ScanLine />

      {/* HUD corners */}
      <HUDCorner position="top-left" />
      <HUDCorner position="top-right" />
      <HUDCorner position="bottom-left" />
      <HUDCorner position="bottom-right" />

      {/* Top-left HUD info */}
      <motion.div
        className="absolute top-6 left-12 text-[10px] font-mono text-primary/30 hidden md:flex flex-col gap-1 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <span>SYS://STUDIO.AI</span>
        <span>MODE: AUTH_VERIFY</span>
        <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
          STATUS: AWAITING_INPUT ●
        </motion.span>
      </motion.div>

      {/* Top-right HUD info */}
      <motion.div
        className="absolute top-6 right-12 text-[10px] font-mono text-primary/30 text-right hidden md:flex flex-col gap-1 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <span>RES: 4K_RAW</span>
        <span>f/1.4 · ISO 100</span>
        <span>LENS: 85mm</span>
      </motion.div>

      {/* Central auth card with 3D hover */}
      <motion.div
        initial={{ opacity: 0, z: -200, rotateX: 15 }}
        animate={{ opacity: 1, z: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full max-w-md mx-4"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/20 via-primary/5 to-primary/20 blur-sm pointer-events-none"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative bg-card/70 backdrop-blur-2xl border border-primary/10 rounded-3xl shadow-[0_0_80px_-20px_hsl(var(--primary)/0.15)] overflow-hidden">
          {/* Inner scan line */}
          <motion.div
            className="absolute left-0 right-0 h-16 bg-gradient-to-b from-primary/[0.03] to-transparent pointer-events-none"
            animate={{ top: ["-64px", "110%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
          />

          <div className="relative p-8 md:p-10">
            {/* Logo section */}
            <motion.div
              className="flex flex-col items-center mb-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div className="relative mb-5">
                {/* Outer rotating ring */}
                <motion.div
                  className="absolute -inset-4 rounded-full border border-dashed border-primary/15"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                {/* Middle pulse ring */}
                <motion.div
                  className="absolute -inset-2 rounded-full border border-primary/10"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                {/* Core icon */}
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  >
                    <Aperture className="h-10 w-10 text-primary/70" strokeWidth={1.2} />
                  </motion.div>
                </div>
              </motion.div>

              <h1 className="text-3xl font-bold tracking-tight">
                Studio<span className="text-primary">Ai</span>
              </h1>
              <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono tracking-widest uppercase">
                Immersive Studio Access
              </p>
            </motion.div>

            {/* Viewfinder line */}
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-8"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Label htmlFor="email" className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <Scan className="h-3 w-3" />
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
                    className="h-12 bg-background/40 border-primary/10 focus:border-primary/30 focus:bg-background/60 transition-all duration-300 pl-4 font-mono text-sm"
                    required
                  />
                  <AnimatePresence>
                    {focused === "email" && (
                      <motion.div
                        className="absolute left-0 bottom-0 h-px bg-primary/50"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        exit={{ width: "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Label htmlFor="password" className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <Camera className="h-3 w-3" />
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
                    className="pr-10 h-12 bg-background/40 border-primary/10 focus:border-primary/30 focus:bg-background/60 transition-all duration-300 pl-4 font-mono text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <AnimatePresence>
                    {focused === "password" && (
                      <motion.div
                        className="absolute left-0 bottom-0 h-px bg-primary/50"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        exit={{ width: "0%" }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <button type="button" className="text-[10px] font-mono text-primary/50 hover:text-primary transition-colors tracking-wider uppercase">
                  Reset Access
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  type="submit"
                  className="w-full h-12 text-sm font-semibold gap-2 relative overflow-hidden group"
                  disabled={loading}
                >
                  {/* Button scan effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="font-mono tracking-wider">AUTHENTICATE</span>
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Bottom HUD bar */}
      <motion.div
        className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground/30 tracking-widest uppercase">
          <span>Studio<span className="text-primary/40">Ai</span></span>
          <span className="w-px h-3 bg-muted-foreground/15" />
          <span>Immersive Studio Platform</span>
          <span className="w-px h-3 bg-muted-foreground/15" />
          <motion.span animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            ● SECURE
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
