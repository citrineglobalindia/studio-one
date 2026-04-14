import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { ALL_MODULES, type AppModule } from "@/contexts/RoleContext";

interface ModuleControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
}

export function ModuleControlDialog({
  open,
  onOpenChange,
  studioId,
  studioName,
}: ModuleControlDialogProps) {
  const [restrictedModules, setRestrictedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchRestrictions();
  }, [open, studioId]);

  const fetchRestrictions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("studio_module_restrictions")
      .select("restricted_modules")
      .eq("organization_id", studioId)
      .maybeSingle();

    setRestrictedModules(data?.restricted_modules || []);
    setLoading(false);
  };

  const toggleModule = (module: string) => {
    setRestrictedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    // Upsert restrictions
    const { error } = await supabase
      .from("studio_module_restrictions")
      .upsert(
        {
          organization_id: studioId,
          restricted_modules: restrictedModules,
        },
        { onConflict: "organization_id" }
      );

    setSaving(false);

    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }

    toast.success(`Module access updated for ${studioName}`);
    onOpenChange(false);
  };

  const enableAll = () => setRestrictedModules([]);
  const disableAll = () =>
    setRestrictedModules(ALL_MODULES.map((m) => m.value));

  // Group modules
  const groups = ALL_MODULES.reduce((acc, mod) => {
    if (!acc[mod.group]) acc[mod.group] = [];
    acc[mod.group].push(mod);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  // Always-enabled modules that can't be restricted
  const coreModules: AppModule[] = ["dashboard", "profile", "notifications"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Module Access — {studioName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Toggle modules OFF to restrict access for this studio.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={enableAll}>
                  Enable All
                </Button>
                <Button variant="outline" size="sm" onClick={disableAll}>
                  Disable All
                </Button>
              </div>
            </div>

            {Object.entries(groups).map(([group, modules]) => (
              <div key={group} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </h4>
                <div className="space-y-1">
                  {modules.map((mod) => {
                    const isCore = coreModules.includes(mod.value);
                    const isEnabled = !restrictedModules.includes(mod.value);

                    return (
                      <div
                        key={mod.value}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">
                            {mod.label}
                          </span>
                          {isCore && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Core
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleModule(mod.value)}
                          disabled={isCore}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
