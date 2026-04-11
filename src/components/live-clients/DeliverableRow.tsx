import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Camera, Video, BookImage, Film, HardDrive, Package, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deliverableStatusConfig, type Deliverable } from "@/data/live-clients-data";

const deliverableIcon: Record<string, React.ElementType> = {
  Photos: Camera, Videos: Video, Albums: BookImage, Highlights: Film, "Footage Copy": HardDrive,
};

export function DeliverableRow({ d }: { d: Deliverable }) {
  const cfg = deliverableStatusConfig[d.status];
  const Icon = deliverableIcon[d.type] || Package;
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{d.label}</p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", cfg.bg, cfg.color, cfg.border)}>
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Progress value={d.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{d.progress}%</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span>Due: {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          {d.deliveredDate && (
            <span className="text-emerald-500 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Delivered {new Date(d.deliveredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
