import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";

const TYPE_TONE: Record<string, string> = {
  "payment.requested": "bg-amber-500/15 text-amber-700 border-amber-200",
  "payment.approved": "bg-sky-500/15 text-sky-700 border-sky-200",
  "payment.rejected": "bg-rose-500/15 text-rose-700 border-rose-200",
  "payment.paid": "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  "leave.requested": "bg-violet-500/15 text-violet-700 border-violet-200",
  "deliverable.submitted": "bg-blue-500/15 text-blue-700 border-blue-200",
  "enquiry.received": "bg-pink-500/15 text-pink-700 border-pink-200",
  "task.assigned": "bg-indigo-500/15 text-indigo-700 border-indigo-200",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(15);
  const [open, setOpen] = useState(false);

  const handleClick = (id: string, link: string | null, isRead: boolean) => {
    if (!isRead) markRead.mutate(id);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 max-h-[500px]" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h4 className="font-semibold text-sm">Notifications</h4>
            {unreadCount > 0 && (
              <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Inbox className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => {
                const isRead = !!n.read_at;
                const tone = TYPE_TONE[n.type] || "bg-muted text-muted-foreground border-border";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n.id, n.link, isRead)}
                    className={`w-full p-3 text-left hover:bg-muted/40 transition-colors ${!isRead ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!isRead && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={`text-sm ${!isRead ? "font-semibold" : ""} truncate`}>
                            {n.title}
                          </p>
                          <Badge variant="outline" className={`text-[9px] shrink-0 ${tone}`}>
                            {n.type.split(".")[0]}
                          </Badge>
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full text-xs h-8"
              onClick={() => { setOpen(false); navigate("/notifications"); }}
            >
              See all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
