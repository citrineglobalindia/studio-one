import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookImage, Plus, Eye, MessageSquare, Printer, Check, Clock, RefreshCw, Truck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface Album {
  id: string;
  client: string;
  type: "flush-mount" | "coffee-table" | "photobook" | "canvas";
  pages: number;
  status: "design" | "client-review" | "revision" | "approved" | "printing" | "shipped" | "delivered";
  designer: string;
  revisions: number;
  maxRevisions: number;
  designProgress: number;
  createdDate: string;
  notes?: string;
}

const sampleAlbums: Album[] = [
  { id: "a1", client: "Priya & Rahul", type: "flush-mount", pages: 40, status: "design", designer: "Priya Verma", revisions: 0, maxRevisions: 2, designProgress: 45, createdDate: "2026-03-20" },
  { id: "a2", client: "Meera & Aditya", type: "coffee-table", pages: 60, status: "client-review", designer: "Neha Gupta", revisions: 1, maxRevisions: 2, designProgress: 100, createdDate: "2026-03-10", notes: "Client reviewing since 3 days" },
  { id: "a3", client: "Kavya & Arjun", type: "flush-mount", pages: 40, status: "approved", designer: "Priya Verma", revisions: 2, maxRevisions: 2, designProgress: 100, createdDate: "2026-02-15" },
  { id: "a4", client: "Nisha & Dev", type: "photobook", pages: 30, status: "printing", designer: "Neha Gupta", revisions: 1, maxRevisions: 2, designProgress: 100, createdDate: "2026-02-01" },
  { id: "a5", client: "Ritu & Karan", type: "canvas", pages: 1, status: "shipped", designer: "Priya Verma", revisions: 0, maxRevisions: 1, designProgress: 100, createdDate: "2026-03-15", notes: "Tracking: DEL12345" },
  { id: "a6", client: "Tara & Mohan", type: "coffee-table", pages: 50, status: "delivered", designer: "Neha Gupta", revisions: 2, maxRevisions: 2, designProgress: 100, createdDate: "2026-01-20" },
];

const statusConfig: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  design: { label: "In Design", style: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: BookImage },
  "client-review": { label: "Client Review", style: "bg-primary/20 text-primary border-primary/30", icon: Eye },
  revision: { label: "Revision", style: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: RefreshCw },
  approved: { label: "Approved", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Check },
  printing: { label: "Printing", style: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Printer },
  shipped: { label: "Shipped", style: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: Truck },
  delivered: { label: "Delivered", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Check },
};

const typeLabels: Record<string, string> = {
  "flush-mount": "Flush Mount",
  "coffee-table": "Coffee Table Book",
  photobook: "Photo Book",
  canvas: "Canvas Print",
};

export default function AlbumsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Albums & Prints</h1>
            <p className="text-sm text-muted-foreground mt-1">{sampleAlbums.length} albums · {sampleAlbums.filter((a) => a.status === "design" || a.status === "revision").length} in progress</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Album</Button>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          {["design", "client-review", "revision", "approved", "printing", "shipped", "delivered"].map((s) => {
            const config = statusConfig[s];
            const count = sampleAlbums.filter((a) => a.status === s).length;
            return (
              <div key={s} className="rounded-lg bg-card border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground truncate">{config.label}</p>
              </div>
            );
          })}
        </div>

        {/* Album Cards */}
        <div className="space-y-3">
          {sampleAlbums.map((album) => {
            const config = statusConfig[album.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === album.id;
            return (
              <div key={album.id} className="rounded-lg bg-card border border-border overflow-hidden">
                <div
                  onClick={() => setExpandedId(isExpanded ? null : album.id)}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <StatusIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{album.client}</p>
                      <p className="text-xs text-muted-foreground">{typeLabels[album.type]} · {album.pages} pages · Designer: {album.designer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Revisions</p>
                      <p className="text-sm font-mono text-foreground">{album.revisions}/{album.maxRevisions}</p>
                    </div>
                    <Badge variant="outline" className={config.style + " text-[10px]"}>{config.label}</Badge>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {album.status === "design" && (
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Design Progress</span>
                          <span>{album.designProgress}%</span>
                        </div>
                        <Progress value={album.designProgress} className="h-2" />
                      </div>
                    )}
                    {album.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">{album.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</Button>
                      {album.status === "client-review" && <Button size="sm" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Send Reminder</Button>}
                      {album.status === "approved" && <Button size="sm" className="gap-1.5"><Printer className="h-3.5 w-3.5" />Send to Print</Button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
