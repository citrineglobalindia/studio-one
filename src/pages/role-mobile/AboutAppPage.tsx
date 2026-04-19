import { Camera, Sparkles, Shield, Heart } from "lucide-react";
import { RoleSubpageHeader } from "@/components/role-mobile/RoleSubpageHeader";

export default function AboutAppPage() {
  return (
    <RoleSubpageHeader title="About App" back="/m/settings">
      <div className="text-center mb-6">
        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 mx-auto flex items-center justify-center shadow-xl">
          <span className="text-primary-foreground font-black text-3xl">S</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mt-4">
          Studio<span className="text-primary">Ai</span>
        </h1>
        <p className="text-[12px] text-muted-foreground mt-1">Version 1.0.0 · Build 2026.04</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <p className="text-[13px] text-foreground leading-relaxed">
          StudioAi is a complete operating system for modern photography studios.
          From leads to delivery, we help you stay organised, on time, and on top of every shoot.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {[
          { icon: Camera, title: "Built for studios", desc: "Workflows tuned for weddings, events & commercial shoots." },
          { icon: Sparkles, title: "Smart by default", desc: "AI helps schedule, plan and respond to clients faster." },
          { icon: Shield, title: "Secure & private", desc: "Your data is encrypted and isolated to your studio." },
          { icon: Heart, title: "Made with care", desc: "Crafted by photographers, for photographers." },
        ].map((f) => {
          const I = f.icon;
          return (
            <div key={f.title} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <I className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">{f.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} StudioAi. All rights reserved.
      </p>
    </RoleSubpageHeader>
  );
}
