import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Image, Users, Trash2, Star, Copy, Eye, Upload, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface PhotoBatch {
  id: string;
  event: string;
  client: string;
  totalPhotos: number;
  processed: number;
  bestShots: number;
  duplicates: number;
  blurry: number;
  faceGroups: number;
  status: "queued" | "processing" | "completed" | "review";
}

const sampleBatches: PhotoBatch[] = [
  { id: "b1", event: "Mehendi - Priya & Rahul", client: "Priya & Rahul", totalPhotos: 245, processed: 245, bestShots: 180, duplicates: 32, blurry: 15, faceGroups: 8, status: "completed" },
  { id: "b2", event: "Haldi - Priya & Rahul", client: "Priya & Rahul", totalPhotos: 320, processed: 320, bestShots: 200, duplicates: 58, blurry: 22, faceGroups: 12, status: "review" },
  { id: "b3", event: "Wedding - Meera & Aditya", client: "Meera & Aditya", totalPhotos: 520, processed: 380, bestShots: 0, duplicates: 0, blurry: 0, faceGroups: 0, status: "processing" },
  { id: "b4", event: "Reception - Meera & Aditya", client: "Meera & Aditya", totalPhotos: 290, processed: 0, bestShots: 0, duplicates: 0, blurry: 0, faceGroups: 0, status: "queued" },
];

const statusConfig: Record<string, { label: string; style: string }> = {
  queued: { label: "Queued", style: "bg-muted text-muted-foreground border-border" },
  processing: { label: "Processing", style: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  completed: { label: "Completed", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  review: { label: "Review", style: "bg-primary/20 text-primary border-primary/30" },
};

export default function AISelectionPage() {
  const totalProcessed = sampleBatches.reduce((s, b) => s + b.processed, 0);
  const totalPhotos = sampleBatches.reduce((s, b) => s + b.totalPhotos, 0);
  const totalDuplicates = sampleBatches.reduce((s, b) => s + b.duplicates, 0);
  const totalBlurry = sampleBatches.reduce((s, b) => s + b.blurry, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Smart Photo Selection</h1>
              <p className="text-sm text-muted-foreground">AI-powered culling, face recognition & best-shot detection</p>
            </div>
          </div>
          <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Batch</Button>
        </div>

        {/* AI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Photos Processed", value: totalProcessed.toLocaleString(), icon: Image, color: "text-primary" },
            { label: "Best Shots Found", value: sampleBatches.reduce((s, b) => s + b.bestShots, 0).toString(), icon: Star, color: "text-primary" },
            { label: "Duplicates Removed", value: totalDuplicates.toString(), icon: Copy, color: "text-blue-400" },
            { label: "Blurry Flagged", value: totalBlurry.toString(), icon: AlertTriangle, color: "text-orange-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-3">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Upload", desc: "Drop your RAW photos or a folder", icon: Upload },
              { step: "2", title: "AI Analysis", desc: "Face detection, blur check, exposure", icon: Zap },
              { step: "3", title: "Smart Cull", desc: "Best shots selected, dupes removed", icon: Star },
              { step: "4", title: "Review", desc: "Approve or adjust AI suggestions", icon: CheckCircle },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">{s.step}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch List */}
        <div className="space-y-3">
          {sampleBatches.map((batch) => {
            const config = statusConfig[batch.status];
            const progress = batch.totalPhotos > 0 ? Math.round((batch.processed / batch.totalPhotos) * 100) : 0;
            return (
              <div key={batch.id} className="rounded-lg bg-card border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{batch.event}</p>
                    <p className="text-xs text-muted-foreground">{batch.totalPhotos} photos uploaded</p>
                  </div>
                  <Badge variant="outline" className={config.style + " text-[10px]"}>{config.label}</Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
                </div>

                {batch.status === "completed" || batch.status === "review" ? (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-md bg-muted/30 p-2 text-center">
                      <p className="text-sm font-bold text-foreground">{batch.bestShots}</p>
                      <p className="text-[10px] text-muted-foreground">Best Shots</p>
                    </div>
                    <div className="rounded-md bg-muted/30 p-2 text-center">
                      <p className="text-sm font-bold text-foreground">{batch.duplicates}</p>
                      <p className="text-[10px] text-muted-foreground">Duplicates</p>
                    </div>
                    <div className="rounded-md bg-muted/30 p-2 text-center">
                      <p className="text-sm font-bold text-foreground">{batch.blurry}</p>
                      <p className="text-[10px] text-muted-foreground">Blurry</p>
                    </div>
                    <div className="rounded-md bg-muted/30 p-2 text-center">
                      <p className="text-sm font-bold text-foreground">{batch.faceGroups}</p>
                      <p className="text-[10px] text-muted-foreground">Face Groups</p>
                    </div>
                  </div>
                ) : null}

                {(batch.status === "completed" || batch.status === "review") && (
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Review Selections</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive"><Trash2 className="h-3.5 w-3.5" />Remove Rejects</Button>
                    {batch.status === "review" && <Button size="sm" className="gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Approve All</Button>}
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
