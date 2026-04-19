import { RoleSubpageHeader } from "@/components/role-mobile/RoleSubpageHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { Check, Moon, Sun, Palette } from "lucide-react";

const THEMES = [
  { id: "black", label: "Dark Gold", icon: Moon, desc: "Cinematic black with gold accents" },
  { id: "white", label: "Light", icon: Sun, desc: "Clean and bright" },
  { id: "midnight", label: "Midnight", icon: Palette, desc: "Deep navy blue" },
  { id: "ocean", label: "Ocean", icon: Palette, desc: "Calming teal tones" },
] as const;

export default function AppearancePage() {
  const { theme, setTheme } = useTheme() as any;
  return (
    <RoleSubpageHeader title="Appearance" back="/m/settings">
      <p className="text-[12px] text-muted-foreground mb-4">Choose your preferred theme.</p>
      <div className="space-y-2">
        {THEMES.map((t) => {
          const I = t.icon;
          const active = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme?.(t.id)}
              className={`w-full bg-card border rounded-2xl p-4 flex items-center gap-3 text-left transition-all ${
                active ? "border-primary ring-2 ring-primary/30" : "border-border"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                <I className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-foreground">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </div>
              {active && <Check className="h-5 w-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </RoleSubpageHeader>
  );
}
