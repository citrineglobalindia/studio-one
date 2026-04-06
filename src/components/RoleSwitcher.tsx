import { useRole, ALL_ROLES } from "@/contexts/RoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, isAdmin } = useRole();

  // Only admins can switch roles (for testing)
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground capitalize">{currentRole}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <Select value={currentRole} onValueChange={(v) => setCurrentRole(v as any)}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ALL_ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value} className="text-xs">
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
