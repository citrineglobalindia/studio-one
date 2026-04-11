import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Camera, Video, BookImage, Film, HardDrive, Package, CheckCircle2,
  Bell, BellRing, Clock, User,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { deliverableStatusConfig, type Deliverable } from "@/data/live-clients-data";
import { toast } from "sonner";

const deliverableIcon: Record<string, React.ElementType> = {
  Photos: Camera, Videos: Video, Albums: BookImage, Highlights: Film, "Footage Copy": HardDrive,
};

export function DeliverableRow({ d, onSetReminder }: { d: Deliverable; onSetReminder?: (id: string, date: Date) => void }) {
  const cfg = deliverableStatusConfig[d.status];
  const Icon = deliverableIcon[d.type] || Package;
  const [reminderOpen, setReminderOpen] = useState(false);

  const dueDate = new Date(d.dueDate);
  const now = new Date();
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0 && d.status !== "delivered";
  const isDueSoon = daysLeft >= 0 && daysLeft <= 3 && d.status !== "delivered";

  const handleSetReminder = (date: Date | undefined) => {
    if (date && onSetReminder) {
      onSetReminder(d.id, date);
      toast.success(`Reminder set for ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`, {
        description: `${d.label} — Team will be notified`,
      });
    }
    setReminderOpen(false);
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{d.label}</p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", cfg.bg, cfg.color, cfg.border)}>
            {cfg.label}
          </Badge>
          {isOverdue && (
            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20">
              Overdue {Math.abs(daysLeft)}d
            </Badge>
          )}
          {isDueSoon && (
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Clock className="h-3 w-3 mr-0.5" />{daysLeft}d left
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Progress value={d.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{d.progress}%</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
          <span>Due: {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          {d.deliveredDate && (
            <span className="text-emerald-500 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Delivered {new Date(d.deliveredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
          {d.assignedTo && (
            <span className="flex items-center gap-0.5">
              <User className="h-3 w-3" /> {d.assignedTo}
            </span>
          )}
          {d.reminderDate && (
            <span className="flex items-center gap-0.5 text-primary">
              <BellRing className="h-3 w-3" /> Reminder: {new Date(d.reminderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>

      {/* Set Reminder Button */}
      {d.status !== "delivered" && (
        <Popover open={reminderOpen} onOpenChange={setReminderOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg",
                d.reminderDate ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
              )}
              title="Set reminder"
            >
              {d.reminderDate ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground">Set Reminder</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Team will be notified on selected date</p>
            </div>
            <Calendar
              mode="single"
              selected={d.reminderDate ? new Date(d.reminderDate) : undefined}
              onSelect={handleSetReminder}
              disabled={(date) => date < new Date()}
              className="p-3 pointer-events-auto"
            />
            {d.reminderDate && (
              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => {
                    if (onSetReminder) onSetReminder(d.id, undefined as any);
                    toast.info("Reminder removed", { description: d.label });
                    setReminderOpen(false);
                  }}
                >
                  Remove Reminder
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
