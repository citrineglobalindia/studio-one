import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, ChevronLeft } from "lucide-react";

interface Thread {
  id: string;
  name: string;
  role: string;
  last: string;
  time: string;
  unread: number;
  messages: { id: string; from: "me" | "them"; text: string; time: string }[];
}

const THREADS: Thread[] = [
  {
    id: "admin", name: "Studio Admin", role: "Owner", last: "Sharma wedding moved to 12 May", time: "10:24 AM", unread: 2,
    messages: [
      { id: "1", from: "them", text: "Hey, quick update on the schedule.", time: "10:20 AM" },
      { id: "2", from: "them", text: "Sharma wedding moved to 12 May", time: "10:24 AM" },
    ],
  },
  {
    id: "team", name: "Production Crew", role: "Group · 6", last: "Karthik: Lenses ready 👍", time: "Yesterday", unread: 0,
    messages: [
      { id: "1", from: "them", text: "Karthik: Lenses ready 👍", time: "Yesterday" },
    ],
  },
  {
    id: "edit", name: "Editing Pod", role: "Group · 4", last: "Final cut sent for review", time: "2d", unread: 1,
    messages: [
      { id: "1", from: "them", text: "Final cut sent for review", time: "2d" },
    ],
  },
];

export default function RoleChatPage() {
  const [active, setActive] = useState<Thread | null>(null);
  const [input, setInput] = useState("");

  if (active) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem-68px)] md:h-[calc(900px-3.5rem-68px)]">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
          <button onClick={() => setActive(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
            {active.name.charAt(0)}
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">{active.name}</p>
            <p className="text-[10px] text-muted-foreground">{active.role}</p>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {active.messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-[13px] ${
                m.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"
              }`}>
                {m.text}
                <p className={`text-[9px] mt-1 ${m.from === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="p-3 border-t border-border bg-card flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-secondary text-[13px] outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                active.messages.push({ id: String(Date.now()), from: "me", text: input.trim(), time: "now" });
                setInput("");
              }
            }}
          />
          <button
            onClick={() => {
              if (input.trim()) {
                active.messages.push({ id: String(Date.now()), from: "me", text: input.trim(), time: "now" });
                setInput("");
              }
            }}
            className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Messages</h1>
        <p className="text-[12px] text-muted-foreground">Stay in touch with your studio</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search conversations..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {THREADS.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setActive(t)}
              className="w-full bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 active:bg-secondary/40 text-left"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[13px] font-bold text-foreground truncate">{t.name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{t.time}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] text-muted-foreground truncate">{t.last}</p>
                  {t.unread > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                      {t.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
