import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Briefcase, Award, Calendar, ChevronRight, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { getRoleConfig } from "@/components/role-mobile/role-content";

export default function RoleProfilePage() {
  const { user } = useAuth();
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const cfg = getRoleConfig(currentRole);
  const Icon = cfg.icon;

  const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Member";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground px-5 pt-6 pb-12 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-4xl font-extrabold shadow-xl">
              {initial}
            </div>
            <button
              onClick={() => navigate("/m/settings/profile-edit")}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-card text-foreground border border-border flex items-center justify-center shadow-lg"
              aria-label="Edit"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <h2 className="text-xl font-extrabold mt-3 capitalize">{name}</h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 px-2.5 py-0.5 rounded-md">
            <Icon className="h-3 w-3" />
            {cfg.label}
          </div>
        </div>
      </div>

      <div className="bg-background -mt-6 rounded-t-3xl relative z-10 px-5 pt-6 pb-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { icon: Briefcase, label: "Projects", value: 28 },
            { icon: Award, label: "Rating", value: "4.8" },
            { icon: Calendar, label: "Years", value: 3 },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                <I className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h3 className="text-[14px] font-bold text-foreground">Contact Info</h3>
        </div>
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          {[
            { icon: Mail, label: "Email", value: user?.email || "—" },
            { icon: Phone, label: "Phone", value: (user?.user_metadata?.phone as string) || "Not set" },
            { icon: MapPin, label: "City", value: (user?.user_metadata?.city as string) || "Not set" },
          ].map((row, i, arr) => {
            const I = row.icon;
            return (
              <div key={row.label} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center">
                  <I className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{row.label}</p>
                  <p className="text-[13px] text-foreground font-medium truncate">{row.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/m/settings")}
          className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <ChevronRight className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-bold text-foreground">App Settings</p>
            <p className="text-[11px] text-muted-foreground">Privacy, feedback, about</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
        </motion.button>
      </div>
    </div>
  );
}
