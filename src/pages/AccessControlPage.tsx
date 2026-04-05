import { useState } from "react";
import { useRole, ALL_ROLES, ALL_MODULES, type AppRole, type AppModule } from "@/contexts/RoleContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AccessControlPage() {
  const { roleAccess, setRoleAccess } = useRole();
  const [selectedRole, setSelectedRole] = useState<AppRole>("vendor");
  const [localAccess, setLocalAccess] = useState(roleAccess);

  const nonAdminRoles = ALL_ROLES.filter((r) => r.value !== "admin");
  const groups = [...new Set(ALL_MODULES.map((m) => m.group))];

  const toggleModule = (mod: AppModule) => {
    setLocalAccess((prev) => {
      const current = prev[selectedRole] ?? [];
      const updated = current.includes(mod)
        ? current.filter((m) => m !== mod)
        : [...current, mod];
      return { ...prev, [selectedRole]: updated };
    });
  };

  const handleSave = () => {
    setRoleAccess(localAccess);
    toast.success(`Access updated for ${selectedRole}`);
  };

  const currentModules = localAccess[selectedRole] ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Access Control</h1>
            <p className="text-sm text-muted-foreground">Manage module access for each role</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      {/* Role Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {nonAdminRoles.map((r) => (
          <button
            key={r.value}
            onClick={() => setSelectedRole(r.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedRole === r.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            {r.label}
            <Badge variant="outline" className="ml-2 text-[10px]">
              {(localAccess[r.value] ?? []).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="space-y-6">
        {groups.map((group) => {
          const modules = ALL_MODULES.filter((m) => m.group === group);
          return (
            <div key={group} className="bg-card rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">{group}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod) => (
                  <div
                    key={mod.value}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <span className="text-sm text-foreground">{mod.label}</span>
                    <Switch
                      checked={currentModules.includes(mod.value)}
                      onCheckedChange={() => toggleModule(mod.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
