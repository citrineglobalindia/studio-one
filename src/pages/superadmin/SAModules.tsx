import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ModuleControlDialog } from "@/components/superadmin/ModuleControlDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Blocks, Search, Settings2 } from "lucide-react";

interface StudioWithRestrictions {
  id: string;
  name: string;
  primary_color: string | null;
  restrictedCount: number;
}

export default function SAModules() {
  const [studios, setStudios] = useState<StudioWithRestrictions[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [orgsRes, restrictionsRes] = await Promise.all([
      supabase.from("organizations").select("id, name, primary_color").order("name"),
      supabase.from("studio_module_restrictions").select("organization_id, restricted_modules"),
    ]);

    const orgs = orgsRes.data || [];
    const restrictions = restrictionsRes.data || [];
    const restrictionMap: Record<string, number> = {};
    restrictions.forEach((r: any) => {
      restrictionMap[r.organization_id] = (r.restricted_modules || []).length;
    });

    setStudios(orgs.map((o: any) => ({
      id: o.id,
      name: o.name,
      primary_color: o.primary_color,
      restrictedCount: restrictionMap[o.id] || 0,
    })));
    setLoading(false);
  };

  const filtered = studios.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Module Control</h1>
        <p className="text-sm text-muted-foreground mt-1">Restrict or enable modules per studio</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search studios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((studio) => (
            <Card key={studio.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: studio.primary_color || "hsl(var(--primary))" }}
                  >
                    {studio.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{studio.name}</p>
                    {studio.restrictedCount > 0 ? (
                      <Badge variant="destructive" className="text-[10px] mt-1">{studio.restrictedCount} restricted</Badge>
                    ) : (
                      <span className="text-[10px] text-emerald-400">All modules enabled</span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelected({ id: studio.id, name: studio.name })}>
                  <Settings2 className="h-4 w-4 mr-1" /> Manage
                </Button>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <Blocks className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No studios found</p>
            </div>
          )}
        </div>
      )}

      {selected && (
        <ModuleControlDialog
          open={!!selected}
          onOpenChange={(open) => { if (!open) { setSelected(null); fetchData(); } }}
          studioId={selected.id}
          studioName={selected.name}
        />
      )}
    </div>
  );
}
