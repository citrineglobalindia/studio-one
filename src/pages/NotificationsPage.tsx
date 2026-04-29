import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, CheckCheck, Trash2, Inbox, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead, remove } = useNotifications(200);
  const [tab, setTab] = useState<"all" | "unread">("all");

  const filtered = tab === "unread" ? notifications.filter(n => !n.read_at) : notifications;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllRead.mutate()} variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{tab === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(n => {
                const isRead = !!n.read_at;
                const tone = TYPE_TONE[n.type] || "bg-muted text-muted-foreground border-border";
                return (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-muted/30 transition-colors ${!isRead ? "bg-blue-50/30" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!isRead ? "bg-blue-500" : "bg-transparent"}`} />
                      <button
                        onClick={() => {
                          if (!isRead) markRead.mutate(n.id);
                          if (n.link) navigate(n.link);
                        }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm ${!isRead ? "font-semibold" : ""}`}>{n.title}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${tone}`}>
                            {n.type.split(".")[0]}
                          </Badge>
                        </div>
                        {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </button>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!isRead && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markRead.mutate(n.id)} aria-label="Mark read">
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-600" onClick={() => remove.mutate(n.id)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
