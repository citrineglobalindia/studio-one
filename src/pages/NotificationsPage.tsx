import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell, BellRing, Send, Search, Eye, CheckCircle2, Clock, AlertTriangle,
  Mail, Smartphone, Globe, RefreshCw, Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Priority = "low" | "medium" | "high" | "critical";
type NType = "push" | "in-app" | "email" | "sms";
type NStatus = "sent" | "delivered" | "read" | "failed";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NType;
  priority: Priority;
  status: NStatus;
  recipient: string;
  sentAt: string;
  readAt: string | null;
}

const mockNotifications: Notification[] = [
  { id: "N001", title: "New Lead Assigned", message: "A new photography lead has been assigned to you.", type: "in-app", priority: "high", status: "delivered", recipient: "John Smith", sentAt: "2026-04-05 10:30 AM", readAt: null },
  { id: "N002", title: "Invoice Paid", message: "Invoice #INV-2026-045 has been paid by client.", type: "email", priority: "medium", status: "read", recipient: "All Team", sentAt: "2026-04-04 03:15 PM", readAt: "2026-04-04 04:00 PM" },
  { id: "N003", title: "Project Deadline", message: "Wedding shoot for Miller family is due tomorrow.", type: "push", priority: "critical", status: "sent", recipient: "Sarah Wilson", sentAt: "2026-04-05 09:00 AM", readAt: null },
  { id: "N004", title: "Contract Signed", message: "Contract #CT-089 has been signed by the client.", type: "in-app", priority: "low", status: "read", recipient: "Admin", sentAt: "2026-04-03 11:45 AM", readAt: "2026-04-03 12:00 PM" },
  { id: "N005", title: "Team Meeting Reminder", message: "Weekly standup meeting starts in 30 minutes.", type: "push", priority: "medium", status: "delivered", recipient: "All Team", sentAt: "2026-04-05 09:30 AM", readAt: null },
  { id: "N006", title: "Gallery Upload Complete", message: "128 photos uploaded to the Johnson Wedding gallery.", type: "email", priority: "low", status: "read", recipient: "Mike Johnson", sentAt: "2026-04-02 05:20 PM", readAt: "2026-04-02 06:00 PM" },
  { id: "N007", title: "Payment Overdue", message: "Payment for Invoice #INV-2026-032 is 7 days overdue.", type: "sms", priority: "critical", status: "failed", recipient: "Client: Anderson", sentAt: "2026-04-04 10:00 AM", readAt: null },
  { id: "N008", title: "New Review Received", message: "5-star review received on Google Business.", type: "in-app", priority: "low", status: "delivered", recipient: "Admin", sentAt: "2026-04-01 02:30 PM", readAt: null },
];

const priorityColor: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-orange-500/10 text-orange-600",
  critical: "bg-red-500/10 text-red-600",
};

const statusColor: Record<NStatus, string> = {
  sent: "bg-blue-500/10 text-blue-600",
  delivered: "bg-amber-500/10 text-amber-600",
  read: "bg-green-500/10 text-green-600",
  failed: "bg-red-500/10 text-red-600",
};

const typeIcon: Record<NType, typeof Bell> = { push: Smartphone, "in-app": Bell, email: Mail, sms: Globe };

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ title: "", message: "", recipient: "", type: "in-app" as NType, priority: "medium" as Priority });

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.message.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority !== "all" && n.priority !== filterPriority) return false;
      if (filterType !== "all" && n.type !== filterType) return false;
      if (activeTab === "unread" && n.readAt) return false;
      if (activeTab === "critical" && n.priority !== "critical") return false;
      return true;
    });
  }, [notifications, search, filterPriority, filterType, activeTab]);

  const handleSend = () => {
    if (!sendForm.title || !sendForm.message) { toast.error("Title and message required"); return; }
    const newN: Notification = {
      id: `N${String(notifications.length + 1).padStart(3, "0")}`,
      ...sendForm, recipient: sendForm.recipient || "All Team",
      status: "sent", sentAt: new Date().toLocaleString(), readAt: null,
    };
    setNotifications([newN, ...notifications]);
    setShowSend(false);
    setSendForm({ title: "", message: "", recipient: "", type: "in-app", priority: "medium" });
    toast.success("Notification sent");
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, status: "read" as NStatus, readAt: new Date().toLocaleString() } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success("Notification deleted");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded" />
            <div>
              <h1 className="text-foreground text-xl font-semibold">Notification Center</h1>
              <p className="text-muted-foreground text-sm">Manage all notifications</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.success("Refreshed")}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
            <Button size="sm" onClick={() => setShowSend(true)}><Send className="h-4 w-4 mr-1" /> Send</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: notifications.length, icon: Bell, color: "bg-primary/10 text-primary" },
            { label: "Unread", value: notifications.filter(n => !n.readAt).length, icon: BellRing, color: "bg-amber-500/10 text-amber-600" },
            { label: "Critical", value: notifications.filter(n => n.priority === "critical").length, icon: AlertTriangle, color: "bg-red-500/10 text-red-600" },
            { label: "Read", value: notifications.filter(n => n.readAt).length, icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="in-app">In-App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value={activeTab} className="mt-4">
            <div className="space-y-3">
              {filtered.length === 0 && (
                <Card><CardContent className="py-12 text-center text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No notifications found</p></CardContent></Card>
              )}
              {filtered.map((n) => {
                const TypeIcon = typeIcon[n.type];
                return (
                  <Card key={n.id} className={`border transition-colors hover:bg-muted/20 ${!n.readAt ? "border-l-4 border-l-primary" : ""}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <TypeIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{n.title}</span>
                          <Badge variant="outline" className={priorityColor[n.priority] + " text-[10px]"}>{n.priority}</Badge>
                          <Badge variant="outline" className={statusColor[n.status] + " text-[10px]"}>{n.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1.5">{n.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {n.sentAt}</span>
                          <span>To: {n.recipient}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!n.readAt && (
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => markAsRead(n.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => deleteNotification(n.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Send Dialog */}
        <Dialog open={showSend} onOpenChange={setShowSend}>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} /></div>
              <div><Label>Message</Label><Textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} /></div>
              <div><Label>Recipient</Label><Input placeholder="All Team" value={sendForm.recipient} onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Type</Label>
                  <Select value={sendForm.type} onValueChange={(v: NType) => setSendForm({ ...sendForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-app">In-App</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Priority</Label>
                  <Select value={sendForm.priority} onValueChange={(v: Priority) => setSendForm({ ...sendForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={handleSend}>Send Notification</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
