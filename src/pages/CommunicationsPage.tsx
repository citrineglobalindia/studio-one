import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Send, Phone, Mail, Instagram, Filter, Paperclip, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Conversation {
  id: string;
  client: string;
  channel: "whatsapp" | "email" | "instagram" | "call";
  lastMessage: string;
  time: string;
  unread: number;
  status: "active" | "resolved";
  messages: { from: "client" | "studio"; text: string; time: string; read: boolean }[];
}

const conversations: Conversation[] = [
  {
    id: "conv1", client: "Priya Sharma", channel: "whatsapp", lastMessage: "Can we add a drone shot at the sangeet?", time: "10 min ago", unread: 2, status: "active",
    messages: [
      { from: "client", text: "Hi! I had a quick question about the sangeet coverage.", time: "11:30 AM", read: true },
      { from: "studio", text: "Sure Priya, what would you like to know?", time: "11:32 AM", read: true },
      { from: "client", text: "Can we add a drone shot at the sangeet?", time: "11:45 AM", read: false },
      { from: "client", text: "Also, what's the extra cost for that?", time: "11:45 AM", read: false },
    ],
  },
  {
    id: "conv2", client: "Ananya Desai", channel: "email", lastMessage: "Re: Jaipur wedding timeline confirmed", time: "2 hrs ago", unread: 0, status: "resolved",
    messages: [
      { from: "studio", text: "Hi Ananya, please find the updated timeline attached.", time: "9:00 AM", read: true },
      { from: "client", text: "Looks great! We're confirmed on all dates.", time: "10:15 AM", read: true },
    ],
  },
  {
    id: "conv3", client: "Sneha Kapoor", channel: "instagram", lastMessage: "Love your recent work! Can we discuss packages?", time: "5 hrs ago", unread: 1, status: "active",
    messages: [
      { from: "client", text: "Love your recent work! Can we discuss packages?", time: "7:30 AM", read: false },
    ],
  },
  {
    id: "conv4", client: "Meera Iyer", channel: "whatsapp", lastMessage: "Photos look amazing! Thank you 🙏", time: "1 day ago", unread: 0, status: "resolved",
    messages: [
      { from: "studio", text: "Hi Meera, your Haldi photos are ready. Check the gallery link.", time: "Yesterday", read: true },
      { from: "client", text: "Photos look amazing! Thank you 🙏", time: "Yesterday", read: true },
    ],
  },
  {
    id: "conv5", client: "Ritu Singh", channel: "call", lastMessage: "Missed call - callback required", time: "3 hrs ago", unread: 1, status: "active",
    messages: [
      { from: "client", text: "Missed call - callback required", time: "9:00 AM", read: false },
    ],
  },
];

const channelIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  email: Mail,
  instagram: Instagram,
  call: Phone,
};

const channelEmoji: Record<string, string> = {
  whatsapp: "💬",
  email: "📧",
  instagram: "📸",
  call: "📞",
};

export default function CommunicationsPage() {
  const [search, setSearch] = useState("");
  const [selectedConv, setSelectedConv] = useState<Conversation>(conversations[0]);
  const [reply, setReply] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");

  const filtered = conversations.filter((c) => {
    const matchSearch = c.client.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === "all" || c.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">Communication Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">{totalUnread} unread messages across {conversations.length} conversations</p>
        </div>

        <div className="rounded-lg bg-card border border-border flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Sidebar */}
          <div className="w-80 border-r border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
              </div>
              <div className="flex gap-1">
                {["all", "whatsapp", "email", "instagram", "call"].map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${channelFilter === ch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {ch === "all" ? "All" : channelEmoji[ch]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-border">
              {filtered.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-3 cursor-pointer transition-colors ${selectedConv.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{channelEmoji[conv.channel]}</span>
                      <span className="text-sm font-medium text-foreground">{conv.client}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conv.unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{conv.unread}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">{selectedConv.client.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedConv.client}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">{channelEmoji[selectedConv.channel]} {selectedConv.channel}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {selectedConv.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "studio" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.from === "studio" ? "bg-primary/10 text-foreground" : "bg-muted text-foreground"}`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                      {msg.from === "studio" && (msg.read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-border flex items-center gap-2">
              <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Input
                placeholder="Type a message..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && setReply("")}
              />
              <Button size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
