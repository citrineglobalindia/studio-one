import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, Send, Sparkles, Loader2, RotateCcw, StopCircle,
  Database, AlertCircle, Zap,
} from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { label: "What should I focus on today?", q: "What should I focus on today?" },
  { label: "Show me my overdue invoices", q: "Show me my overdue invoices" },
  { label: "Revenue this month vs last", q: "Revenue this month vs last month — what changed?" },
  { label: "Which lead source converts best?", q: "Which lead source converts best for me?" },
  { label: "How many active editor tasks?", q: "How many active editor deliverables, and which are overdue?" },
  { label: "Top clients by revenue", q: "Who are my top clients by revenue?" },
];

const TOOL_LABEL: Record<string, string> = {
  summary_kpis: "Studio overview",
  list_leads: "Leads",
  list_clients: "Clients",
  list_projects: "Projects",
  list_invoices: "Invoices",
  list_deliverables: "Deliverables",
  list_overdue: "Overdue items",
  revenue_breakdown: "Revenue breakdown",
};

/**
 * Lightweight markdown renderer for the assistant's output.
 * Handles **bold**, *italics*, `code`, links, simple GitHub-style tables, and
 * line breaks. Not a full md parser — just enough for clean chat output.
 */
function renderInline(s: string): JSX.Element[] {
  const out: JSX.Element[] = [];
  // Pattern matches: bold, italics, code, links
  const re = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let key = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(<span key={`t${key++}`}>{s.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(<strong key={`b${key++}`}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={`c${key++}`} className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const linkMatch = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        out.push(
          <a key={`l${key++}`} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-primary underline">
            {linkMatch[1]}
          </a>,
        );
      }
    } else {
      out.push(<em key={`i${key++}`}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(<span key={`t${key++}`}>{s.slice(last)}</span>);
  return out;
}

function renderMarkdown(text: string): JSX.Element {
  const lines = text.split("\n");
  const blocks: JSX.Element[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Markdown table: header line followed by `---` separator line
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s|:-]+\|?\s*$/.test(lines[i + 1]) &&
      lines[i + 1].includes("|")
    ) {
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
        rows.push(cells);
        i++;
      }
      blocks.push(
        <div key={`tbl${blockKey++}`} className="overflow-x-auto my-2 rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {headerCells.map((h, idx) => (
                  <th key={idx} className="px-2 py-1.5 text-left font-semibold">{renderInline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-t">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-2 py-1.5">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ""));
        i++;
      }
      blocks.push(
        <ul key={`ul${blockKey++}`} className="list-disc pl-5 my-1.5 space-y-0.5">
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol key={`ol${blockKey++}`} className="list-decimal pl-5 my-1.5 space-y-0.5">
          {items.map((it, idx) => <li key={idx}>{renderInline(it)}</li>)}
        </ol>,
      );
      continue;
    }

    // Headings (#, ##, ###)
    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^#+/) || [""])[0].length;
      const text = line.replace(/^#+\s*/, "");
      const className =
        level === 1 ? "text-base font-bold mt-3 mb-1" :
        level === 2 ? "text-sm font-bold mt-2.5 mb-1" :
        "text-sm font-semibold mt-2 mb-0.5";
      blocks.push(<div key={`h${blockKey++}`} className={className}>{renderInline(text)}</div>);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      blocks.push(<div key={`br${blockKey++}`} className="h-2" />);
      i++;
      continue;
    }

    // Plain paragraph
    blocks.push(
      <p key={`p${blockKey++}`} className="leading-relaxed">{renderInline(line)}</p>,
    );
    i++;
  }

  return <>{blocks}</>;
}

export default function AIAssistantPage() {
  const { messages, isStreaming, send, cancel, reset } = useAIChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    void send(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30"
            style={{ background: "linear-gradient(135deg,#6366f1,#2563eb)" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              StudioOne AI
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">
              Ask anything about your studio — leads, clients, revenue, deliverables, overdue work.
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-xs">
            <RotateCcw className="h-3 w-3" /> New chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto pt-6">
            <div className="text-center mb-6">
              <div
                className="h-14 w-14 rounded-3xl mx-auto mb-3 flex items-center justify-center shadow-2xl shadow-primary/40"
                style={{ background: "linear-gradient(135deg,#6366f1,#2563eb,#0ea5e9)" }}
              >
                <Bot className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold">How can I help?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                I have access to all your studio data and can answer questions in seconds.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.q)}
                  disabled={isStreaming}
                  className="text-left p-3 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "assistant" && (
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center shadow-md shadow-primary/30 shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#2563eb)" }}
              >
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border rounded-bl-sm",
              )}
            >
              {/* Tool call chips — show ABOVE assistant text so the user sees what was queried */}
              {m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {m.toolCalls.map((tc, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30"
                    >
                      <Database className="h-2.5 w-2.5" />
                      {TOOL_LABEL[tc.name] || tc.name}
                    </Badge>
                  ))}
                </div>
              )}

              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {m.content ? renderMarkdown(m.content) : null}
                  {m.pending && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {m.toolCalls && m.toolCalls.length > 0 ? "Thinking with the data…" : "Thinking…"}
                    </span>
                  )}
                </div>
              )}

              {m.error && (
                <div className="flex items-start gap-1.5 mt-2 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{m.error}</span>
                </div>
              )}

              {m.usage && m.usage.cache_read_input_tokens && m.usage.cache_read_input_tokens > 0 && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Zap className="h-2.5 w-2.5" />
                  Cache hit: saved ~{Math.round(m.usage.cache_read_input_tokens / 1000)}K tokens
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t pt-3 shrink-0">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask StudioOne AI about your data… (Shift+Enter for new line)"
            rows={2}
            disabled={isStreaming}
            className="resize-none pr-24"
          />
          <div className="absolute bottom-2 right-2 flex gap-1">
            {isStreaming ? (
              <Button size="sm" variant="outline" onClick={cancel} className="gap-1 h-8">
                <StopCircle className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSend}
                disabled={!input.trim()}
                className="gap-1 h-8"
                style={{ background: "linear-gradient(135deg,#6366f1,#2563eb)" }}
              >
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Powered by Claude · read-only access · responses can be wrong, double-check important numbers
        </p>
      </div>
    </div>
  );
}
