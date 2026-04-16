import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Send, Phone, Mail, Instagram, Paperclip, Check, CheckCheck, Plus, Users, User, Smile, Image, Mic, MoreVertical, Pin, Star, Archive, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  from: "me" | "other";
  senderName: string;
  text: string;
  time: string;
  read: boolean;
  type?: "text" | "image" | "voice" | "system";
  reactions?: string[];
  pinned?: boolean;
  starred?: boolean;
}

interface InAppConversation {
  id: string;
  name: string;
  avatar: string;
  type: "direct" | "group" | "channel";
  members?: string[];
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  typing?: boolean;
  pinned?: boolean;
  messages: Message[];
}

interface ExternalConversation {
  id: string;
  client: string;
  channel: "whatsapp" | "email" | "instagram" | "call";
  lastMessage: string;
  time: string;
  unread: number;
  status: "active" | "resolved";
  messages: { from: "client" | "studio"; text: string; time: string; read: boolean }[];
}

const externalConversations: ExternalConversation[] = [];

const initialInAppConversations: InAppConversation[] = [];

const channelEmoji: Record<string, string> = {
  whatsapp: "💬",
  email: "📧",
  instagram: "📸",
  call: "📞",
};

const teamMembers: string[] = [];

export default function CommunicationsPage() {
  const [mainTab, setMainTab] = useState("inapp");
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [inAppConvos, setInAppConvos] = useState<InAppConversation[]>(initialInAppConversations);
  const [selectedInApp, setSelectedInApp] = useState<InAppConversation | null>(initialInAppConversations[0] || null);
  const [selectedExternal, setSelectedExternal] = useState<ExternalConversation | null>(externalConversations[0] || null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [newChatName, setNewChatName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedInApp?.messages, selectedExternal?.messages]);

  const filteredExternal = externalConversations.filter((c) => {
    const matchSearch = c.client.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === "all" || c.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const filteredInApp = inAppConvos.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalInAppUnread = inAppConvos.reduce((s, c) => s + c.unread, 0);
  const totalExternalUnread = externalConversations.reduce((s, c) => s + c.unread, 0);

  const handleSendInApp = () => {
    if (!reply.trim()) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      from: "me",
      senderName: "You",
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    const updated = inAppConvos.map((c) =>
      c.id === selectedInApp.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: reply, time: "Just now" }
        : c
    );
    setInAppConvos(updated);
    setSelectedInApp((prev) => ({ ...prev, messages: [...prev.messages, newMsg], lastMessage: reply, time: "Just now" }));
    setReply("");
    toast.success("Message sent");
  };

  const handleCreateChat = () => {
    if (newChatType === "direct" && !newChatName) return;
    if (newChatType === "group" && (!newChatName || selectedMembers.length === 0)) return;

    const newConvo: InAppConversation = {
      id: `ia-${Date.now()}`,
      name: newChatName,
      avatar: newChatType === "group" ? newChatName.slice(0, 2).toUpperCase() : newChatName.split(" ").map(n => n[0]).join("").toUpperCase(),
      type: newChatType,
      members: newChatType === "group" ? [...selectedMembers, "You"] : undefined,
      lastMessage: "New conversation started",
      time: "Just now",
      unread: 0,
      online: true,
      messages: [
        { id: "sys1", from: "other", senderName: "System", text: `Conversation started with ${newChatType === "group" ? selectedMembers.join(", ") : newChatName}`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), read: true, type: "system" },
      ],
    };
    setInAppConvos((prev) => [newConvo, ...prev]);
    setSelectedInApp(newConvo);
    setNewChatOpen(false);
    setNewChatName("");
    setSelectedMembers([]);
    toast.success(`New ${newChatType === "group" ? "group" : "chat"} created`);
  };

  const quickEmojis = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "😂", "🙏"];

  const handleAddReaction = (emoji: string) => {
    setReply((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Communication Hub</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalInAppUnread + totalExternalUnread} unread messages
            </p>
          </div>
          <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Start New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant={newChatType === "direct" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewChatType("direct")}
                    className="gap-2"
                  >
                    <User className="h-4 w-4" /> Direct Message
                  </Button>
                  <Button
                    variant={newChatType === "group" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewChatType("group")}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" /> Group Chat
                  </Button>
                </div>

                {newChatType === "direct" ? (
                  <Select onValueChange={setNewChatName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Input
                      placeholder="Group name..."
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                    />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Select members:</p>
                      <div className="flex flex-wrap gap-2">
                        {teamMembers.map((m) => (
                          <button
                            key={m}
                            onClick={() => setSelectedMembers((prev) =>
                              prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
                            )}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                              selectedMembers.includes(m)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/50 text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                <Button onClick={handleCreateChat} className="w-full">
                  Create {newChatType === "group" ? "Group" : "Chat"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="inapp" className="gap-2">
              <MessageSquare className="h-4 w-4" /> In-App
              {totalInAppUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{totalInAppUnread}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="external" className="gap-2">
              <Mail className="h-4 w-4" /> External
              {totalExternalUnread > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{totalExternalUnread}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ===== IN-APP MESSAGING ===== */}
          <TabsContent value="inapp" className="mt-0">
            <div className="rounded-xl bg-card border border-border flex h-[calc(100vh-260px)] min-h-[500px] overflow-hidden">
              {/* Sidebar */}
              <div className="w-80 border-r border-border flex flex-col shrink-0">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {filteredInApp.map((conv) => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => { setSelectedInApp(conv); }}
                      className={`p-3 cursor-pointer transition-all border-b border-border/50 ${
                        selectedInApp.id === conv.id
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-xs font-semibold ${
                              conv.type === "group" ? "bg-accent text-accent-foreground" :
                              conv.type === "channel" ? "bg-primary/10 text-primary" :
                              "bg-muted text-foreground"
                            }`}>
                              {conv.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {conv.online && conv.type === "direct" && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                              {conv.type === "group" && <Users className="h-3 w-3 text-muted-foreground" />}
                              {conv.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-muted-foreground truncate pr-2">
                              {conv.typing ? (
                                <span className="text-primary italic">typing...</span>
                              ) : conv.lastMessage}
                            </p>
                            {conv.unread > 0 && (
                              <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shrink-0">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-w-0">
                {!selectedInApp ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs mt-1">Start a new chat to begin messaging</p>
                    </div>
                  </div>
                ) : (<>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {selectedInApp.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {selectedInApp.online && selectedInApp.type === "direct" && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedInApp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedInApp.typing ? (
                          <span className="text-primary">typing...</span>
                        ) : selectedInApp.online ? (
                          <span className="text-green-500">Online</span>
                        ) : "Offline"}
                        {selectedInApp.type === "group" && selectedInApp.members && (
                          <span> · {selectedInApp.members.length} members</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Search className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Pin className="h-4 w-4" /> Pin conversation</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Star className="h-4 w-4" /> Star messages</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Archive className="h-4 w-4" /> Archive</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive"><Trash2 className="h-4 w-4" /> Delete chat</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-1 bg-muted/10">
                  <AnimatePresence>
                    {selectedInApp.messages.map((msg, i) => {
                      const showSender = msg.from === "other" && selectedInApp.type !== "direct" &&
                        (i === 0 || selectedInApp.messages[i - 1].senderName !== msg.senderName);
                      const isSystem = msg.type === "system";

                      if (isSystem) {
                        return (
                          <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-2">
                            <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">{msg.text}</span>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} ${showSender ? "mt-3" : "mt-0.5"}`}
                        >
                          <div className={`max-w-[70%] ${msg.from === "me" ? "items-end" : "items-start"}`}>
                            {showSender && (
                              <p className="text-[11px] text-muted-foreground mb-1 ml-1 font-medium">{msg.senderName}</p>
                            )}
                            <div className={`rounded-2xl px-3.5 py-2 ${
                              msg.from === "me"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border border-border text-foreground rounded-bl-sm"
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className={`text-[10px] ${msg.from === "me" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</span>
                                {msg.from === "me" && (
                                  msg.read
                                    ? <CheckCheck className="h-3 w-3 text-primary-foreground/80" />
                                    : <Check className="h-3 w-3 text-primary-foreground/50" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
                      <Image className="h-4 w-4" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        placeholder="Type a message..."
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendInApp()}
                        className="pr-10"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="relative">
                          <button
                            onClick={() => setShowEmoji(!showEmoji)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          {showEmoji && (
                            <div className="absolute bottom-8 right-0 bg-card border border-border rounded-lg p-2 shadow-lg flex gap-1 z-50">
                              {quickEmojis.map((e) => (
                                <button key={e} onClick={() => handleAddReaction(e)} className="text-lg hover:scale-125 transition-transform p-1">
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground">
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="shrink-0 h-9 w-9" onClick={handleSendInApp} disabled={!reply.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>)}
              </div>
            </div>
          </TabsContent>

          {/* ===== EXTERNAL MESSAGING (existing) ===== */}
          <TabsContent value="external" className="mt-0">
            <div className="rounded-xl bg-card border border-border flex h-[calc(100vh-260px)] min-h-[500px] overflow-hidden">
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
                  {filteredExternal.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedExternal(conv)}
                      className={`p-3 cursor-pointer transition-colors ${selectedExternal?.id === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
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
                {!selectedExternal ? (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No external conversations</p>
                    </div>
                  </div>
                ) : (<>
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                        {selectedExternal.client.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{selectedExternal.client}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">{channelEmoji[selectedExternal.channel]} {selectedExternal.channel}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Phone className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm"><Mail className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3 bg-muted/10">
                  {selectedExternal.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === "studio" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] rounded-2xl px-3.5 py-2 ${
                        msg.from === "studio"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm"
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-[10px] ${msg.from === "studio" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</span>
                          {msg.from === "studio" && (msg.read ? <CheckCheck className="h-3 w-3 text-primary-foreground/80" /> : <Check className="h-3 w-3 text-primary-foreground/50" />)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border flex items-center gap-2 bg-card">
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
                  <Input placeholder="Type a message..." className="flex-1" />
                  <Button size="icon" className="shrink-0"><Send className="h-4 w-4" /></Button>
                </div>
              </>)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
