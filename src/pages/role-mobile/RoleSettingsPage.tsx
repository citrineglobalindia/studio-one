import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Shield, Info, MessageSquare, HelpCircle, FileText, LogOut, ChevronRight,
  UserCircle2, Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { getRoleConfig } from "@/components/role-mobile/role-content";
import { toast } from "sonner";

interface Item {
  icon: typeof Bell;
  label: string;
  path?: string;
  destructive?: boolean;
  onClick?: () => void;
}

export default function RoleSettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currentRole } = useRole();
  const cfg = getRoleConfig(currentRole);
  const Icon = cfg.icon;

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/auth", { replace: true });
  };

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Account",
      items: [
        { icon: UserCircle2, label: "My Profile", path: "/m/profile" },
        { icon: Bell, label: "Notifications", path: "/m/notifications" },
        { icon: Moon, label: "Appearance", path: "/m/settings/appearance" },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: MessageSquare, label: "Send Feedback", path: "/m/settings/feedback" },
        { icon: HelpCircle, label: "Help & FAQ", path: "/m/settings/help" },
      ],
    },
    {
      title: "About",
      items: [
        { icon: Info, label: "About App", path: "/m/settings/about" },
        { icon: Shield, label: "Privacy Policy", path: "/m/settings/privacy" },
        { icon: FileText, label: "Terms of Service", path: "/m/settings/terms" },
      ],
    },
    {
      title: "Session",
      items: [{ icon: LogOut, label: "Log Out", destructive: true, onClick: handleLogout }],
    },
  ];

  return (
    <div className="px-5 pt-5 pb-6">
      {/* Profile card */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/m/profile")}
        className="w-full mb-5 bg-gradient-to-br from-primary/90 to-primary/60 text-primary-foreground rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden"
      >
        <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl font-extrabold shrink-0">
          {(user?.email || "M").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-left relative z-10 min-w-0">
          <p className="text-[15px] font-bold truncate">
            {(user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Member"}
          </p>
          <div className="inline-flex items-center gap-1 text-[10px] mt-0.5 bg-white/15 px-1.5 py-0.5 rounded">
            <Icon className="h-2.5 w-2.5" />
            {cfg.label}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 opacity-70 relative z-10" />
      </motion.button>

      {groups.map((group, gi) => (
        <div key={group.title} className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 mb-2">{group.title}</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {group.items.map((item, i) => {
              const I = item.icon;
              return (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * (gi * 3 + i) }}
                  whileTap={{ scale: 0.98, backgroundColor: "hsl(var(--secondary))" }}
                  onClick={() => (item.onClick ? item.onClick() : item.path && navigate(item.path))}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                    i < group.items.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.destructive ? "bg-destructive/10" : "bg-secondary"
                  }`}>
                    <I className={`h-4 w-4 ${item.destructive ? "text-destructive" : "text-muted-foreground"}`} />
                  </div>
                  <span className={`flex-1 text-[14px] ${item.destructive ? "text-destructive font-semibold" : "text-foreground"}`}>
                    {item.label}
                  </span>
                  {!item.destructive && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground mt-6">
        StudioAi · v1.0.0
      </p>
    </div>
  );
}
