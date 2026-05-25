import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Users, Shield, Settings, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const { user } = useAuth();

  const cards = [
    {
      label: "Users",
      desc: "Invite team members and assign roles",
      icon: Users,
      color: "from-blue-500/15 to-blue-500/5",
      iconColor: "text-blue-500",
      path: "/team",
    },
    {
      label: "Access Control",
      desc: "Toggle module access per role",
      icon: Shield,
      color: "from-emerald-500/15 to-emerald-500/5",
      iconColor: "text-emerald-500",
      path: "/access-control",
    },
    {
      label: "Settings",
      desc: "Studio details, branding, GST",
      icon: Settings,
      color: "from-violet-500/15 to-violet-500/5",
      iconColor: "text-violet-500",
      path: "/settings",
    },
    {
      label: "My Profile",
      desc: "Your account, preferences",
      icon: Camera,
      color: "from-amber-500/15 to-amber-500/5",
      iconColor: "text-amber-500",
      path: "/profile",
    },
  ];

  return (
    <div className="min-h-[80vh] w-full px-3 md:px-5 lg:px-6 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="h-3 w-3" /> Clean slate
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {organization?.name ? `Welcome to ${organization.name}` : "Welcome"}
        </h1>
        <p className="text-sm text-muted-foreground">
          You're logged in as <span className="text-foreground font-medium capitalize">{currentRole}</span>
          {user?.email ? <> · {user.email}</> : null}.
          Modules will appear here as we build them.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {cards.map((c) => (
          <motion.button
            key={c.label}
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            onClick={() => navigate(c.path)}
            className={`text-left rounded-2xl border border-border bg-gradient-to-br ${c.color} p-5 hover:scale-[1.01] transition`}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 rounded-2xl border border-dashed border-border p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          🛠️ Ready to build the next module. Just tell me what to create.
        </p>
      </motion.div>
    </div>
  );
}
