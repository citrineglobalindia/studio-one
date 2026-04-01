import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Upload, Search, Download, Share2, Eye, Check, Clock, Filter, Grid3X3, List } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface Gallery {
  id: string;
  client: string;
  event: string;
  totalPhotos: number;
  selectedPhotos: number;
  deliveredPhotos: number;
  status: "uploading" | "selection" | "editing" | "delivered" | "shared";
  uploadDate: string;
  shareLink?: string;
  coverColor: string;
}

const sampleGalleries: Gallery[] = [
  { id: "g1", client: "Priya & Rahul", event: "Mehendi", totalPhotos: 245, selectedPhotos: 180, deliveredPhotos: 180, status: "delivered", uploadDate: "2026-03-14", coverColor: "from-rose-500/20 to-orange-500/20" },
  { id: "g2", client: "Priya & Rahul", event: "Haldi", totalPhotos: 320, selectedPhotos: 200, deliveredPhotos: 0, status: "editing", uploadDate: "2026-03-15", coverColor: "from-yellow-500/20 to-amber-500/20" },
  { id: "g3", client: "Priya & Rahul", event: "Sangeet", totalPhotos: 0, selectedPhotos: 0, deliveredPhotos: 0, status: "uploading", uploadDate: "2026-04-14", coverColor: "from-purple-500/20 to-pink-500/20" },
  { id: "g4", client: "Meera & Aditya", event: "Wedding", totalPhotos: 520, selectedPhotos: 350, deliveredPhotos: 0, status: "selection", uploadDate: "2026-03-21", coverColor: "from-primary/20 to-primary/10" },
  { id: "g5", client: "Meera & Aditya", event: "Haldi", totalPhotos: 180, selectedPhotos: 180, deliveredPhotos: 180, status: "shared", uploadDate: "2026-03-20", shareLink: "https://gallery.studio.com/meera-haldi", coverColor: "from-emerald-500/20 to-teal-500/20" },
  { id: "g6", client: "Meera & Aditya", event: "Reception", totalPhotos: 290, selectedPhotos: 0, deliveredPhotos: 0, status: "editing", uploadDate: "2026-03-22", coverColor: "from-blue-500/20 to-indigo-500/20" },
];

const statusConfig: Record<string, { label: string; style: string }> = {
  uploading: { label: "Uploading", style: "bg-muted text-muted-foreground border-border" },
  selection: { label: "Client Selection", style: "bg-primary/20 text-primary border-primary/30" },
  editing: { label: "Editing", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivered: { label: "Delivered", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  shared: { label: "Shared", style: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = sampleGalleries.filter((g) => {
    const matchSearch = `${g.client} ${g.event}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || g.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalDelivered = sampleGalleries.filter((g) => ["delivered", "shared"].includes(g.status)).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Gallery & Delivery</h1>
            <p className="text-sm text-muted-foreground mt-1">{sampleGalleries.length} galleries · {totalDelivered} delivered</p>
          </div>
          <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Photos</Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search galleries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="h-3.5 w-3.5 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="uploading">Uploading</SelectItem>
              <SelectItem value="selection">Selection</SelectItem>
              <SelectItem value="editing">Editing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><List className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {filtered.map((gallery) => {
            const config = statusConfig[gallery.status];
            const progress = gallery.totalPhotos > 0 ? Math.round((gallery.deliveredPhotos / gallery.totalPhotos) * 100) : 0;
            return viewMode === "grid" ? (
              <div key={gallery.id} className="rounded-lg bg-card border border-border overflow-hidden hover:border-primary/30 transition-all">
                <div className={`h-32 bg-gradient-to-br ${gallery.coverColor} flex items-center justify-center`}>
                  <Image className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{gallery.event}</h3>
                    <Badge variant="outline" className={config.style + " text-[10px]"}>{config.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{gallery.client} · {gallery.uploadDate.slice(5)}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{gallery.totalPhotos} photos</span>
                    <span>{gallery.selectedPhotos} selected</span>
                    <span>{gallery.deliveredPhotos} delivered</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"><Eye className="h-3 w-3" />View</Button>
                    {gallery.status === "delivered" && (
                      <Button size="sm" className="flex-1 gap-1 text-xs"><Share2 className="h-3 w-3" />Share</Button>
                    )}
                    {gallery.status === "shared" && (
                      <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs"><Download className="h-3 w-3" />Link</Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div key={gallery.id} className="rounded-lg bg-card border border-border p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${gallery.coverColor} flex items-center justify-center shrink-0`}>
                    <Image className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{gallery.client} — {gallery.event}</p>
                    <p className="text-xs text-muted-foreground">{gallery.totalPhotos} photos · {gallery.selectedPhotos} selected · {gallery.deliveredPhotos} delivered</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={config.style + " text-[10px]"}>{config.label}</Badge>
                  <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
