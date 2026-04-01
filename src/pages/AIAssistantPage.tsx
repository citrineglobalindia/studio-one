import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, MessageSquare, IndianRupee, Image, Lightbulb, Clock } from "lucide-react";
import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const quickActions = [
  { label: "Suggest pricing for destination wedding", icon: IndianRupee },
  { label: "Draft reply to Instagram inquiry", icon: MessageSquare },
  { label: "Generate social media caption", icon: Image },
  { label: "Write follow-up email for cold lead", icon: Send },
];

const initialMessages: ChatMessage[] = [
  { role: "assistant", content: "Hi Amit! 👋 I'm your studio AI assistant. I can help you with:\n\n• **Auto-reply** to lead inquiries\n• **Suggest pricing** based on event type & location\n• **Generate captions** for social media posts\n• **Draft emails** for follow-ups and contracts\n\nHow can I help you today?", timestamp: "Now" },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input, timestamp: "Now" };

    const responses: Record<string, string> = {
      pricing: "For a **destination wedding in Udaipur** (3-day event), I'd suggest:\n\n• **Base package**: ₹4.5L – 2 photographers, 1 videographer, drone\n• **Premium**: ₹6L – Add pre-wedding shoot, same-day edit, album\n• **All-inclusive**: ₹8L – Everything + travel, stay, 2nd videographer\n\nBased on your past Udaipur projects, ₹5-6L has the best conversion rate (40%).",
      reply: "Here's a suggested reply for the Instagram inquiry:\n\n*\"Hi! Thank you so much for reaching out! 🙏 We'd love to capture your special day. Could you share some details like the wedding date, venue, and the events you'd like covered? We'll put together a customized package for you. Feel free to WhatsApp us at +91 98765 43210 for a quicker chat!\"*",
      caption: "Here are 3 caption options for your latest wedding shoot:\n\n1. ✨ *\"Every love story is beautiful, but theirs was our favorite to tell.\"* #WeddingPhotography #MomentsCaptured\n\n2. 📸 *\"Two hearts, one frame, infinite memories.\"* #IndianWedding #LoveInEveryClick\n\n3. 🌸 *\"Where traditions meet timeless photography.\"* #WeddingSeason2026",
      default: "I'll help you with that! Based on your studio's data, here's what I can suggest. Let me analyze your recent projects and client patterns to give you the best recommendation.",
    };

    const key = input.toLowerCase().includes("pric") ? "pricing" : input.toLowerCase().includes("reply") || input.toLowerCase().includes("instagram") ? "reply" : input.toLowerCase().includes("caption") ? "caption" : "default";

    const assistantMsg: ChatMessage = { role: "assistant", content: responses[key], timestamp: "Now" };

    setMessages([...messages, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by your studio's data & patterns</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
            <Sparkles className="h-3 w-3" />Online
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => { setInput(action.label); }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/30 hover:bg-primary/5 transition-all text-sm text-foreground"
            >
              <action.icon className="h-4 w-4 text-primary shrink-0" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="rounded-lg bg-card border border-border flex flex-col h-[calc(100vh-400px)] min-h-[400px]">
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-primary/10" : "bg-muted"}`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] text-primary font-medium">AI Assistant</span>
                    </div>
                  )}
                  <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{msg.content}</div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-right">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex items-center gap-2">
            <Input
              placeholder="Ask me anything about your studio..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
