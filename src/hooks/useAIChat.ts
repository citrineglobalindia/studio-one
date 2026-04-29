import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** A single tool call surfaced by the model — shown as a "ran tool" chip in the UI. */
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

/** A user or assistant message in the chat UI. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  /** True while the assistant is still streaming this message. */
  pending?: boolean;
  error?: string;
  /** Token + cache usage from the last `done` event for that turn. */
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

/** Anthropic-shaped message we send to the edge function. */
type WireMessage = {
  role: "user" | "assistant";
  content: string;
};

const FUNCTION_URL =
  (import.meta.env.VITE_SUPABASE_URL || "https://tivlznrjwtdtjmmfrczo.supabase.co") +
  "/functions/v1/ai-chat";

const ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setMessages([]);
  }, [cancel]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMessage = { id: makeId(), role: "user", content: trimmed };
      const assistantId = makeId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        toolCalls: [],
        pending: true,
      };

      // Build the wire history from existing messages BEFORE this turn,
      // then append the new user message. We rebuild from local state to
      // avoid stale closures.
      let history: WireMessage[] = [];
      setMessages((prev) => {
        history = prev.map((m) => ({ role: m.role, content: m.content }));
        return [...prev, userMsg, assistantMsg];
      });

      const wireMessages = [...history, { role: "user" as const, content: trimmed }];

      // Get the user's JWT for the edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, pending: false, error: "You must be signed in to use the AI assistant." }
              : m,
          ),
        );
        return;
      }

      setIsStreaming(true);
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const resp = await fetch(FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: ANON_KEY,
          },
          body: JSON.stringify({ messages: wireMessages }),
          signal: ac.signal,
        });

        if (!resp.ok || !resp.body) {
          const errText = await resp.text().catch(() => "");
          throw new Error(`HTTP ${resp.status} ${errText.slice(0, 200)}`);
        }

        // Parse SSE: chunks may split events at any byte; buffer until \n\n.
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sepIdx;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);

            // Each SSE event may have multiple lines; we only care about `data:` lines.
            for (const line of rawEvent.split("\n")) {
              const trimmedLine = line.trim();
              if (!trimmedLine.startsWith("data:")) continue;
              const payload = trimmedLine.slice(5).trim();
              if (!payload) continue;
              let parsed: any;
              try {
                parsed = JSON.parse(payload);
              } catch {
                continue;
              }

              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantId) return m;
                  if (parsed.type === "text") {
                    return { ...m, content: m.content + parsed.text };
                  }
                  if (parsed.type === "tool_use") {
                    return {
                      ...m,
                      toolCalls: [...(m.toolCalls || []), { name: parsed.name, input: parsed.input || {} }],
                    };
                  }
                  if (parsed.type === "done") {
                    return { ...m, pending: false, usage: parsed.usage };
                  }
                  if (parsed.type === "error") {
                    return { ...m, pending: false, error: parsed.message };
                  }
                  return m;
                }),
              );
            }
          }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, pending: false } : m)),
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, pending: false, error: e.message || "Request failed" } : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming],
  );

  return { messages, isStreaming, send, cancel, reset };
}
