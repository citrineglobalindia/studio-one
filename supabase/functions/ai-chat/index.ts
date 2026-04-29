// Supabase Edge Function: AI chat with Claude + tool use over studio data.
//
// Auth: caller's JWT must be valid; we resolve their organization_id and
// scope every Supabase query to that org. Anthropic API key is read from
// the ANTHROPIC_API_KEY secret and never exposed to the browser.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 64000;
const MAX_TOOL_ITERATIONS = 8;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ===== Tool catalogue =====
// JSON schemas for Claude. Each tool maps to a server-side function below.
// Keep this list deterministic and the order stable so prompt caching works.
const TOOLS = [
  {
    name: "summary_kpis",
    description:
      "High-level studio KPIs: total leads, clients, projects, events, invoices, total revenue billed, total revenue collected, total outstanding. Use for 'give me an overview' / 'how is my studio doing' style questions.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_leads",
    description:
      "List leads in this org. Filter by status (new/contacted/qualified/proposal/converted/lost), date range, source, or text search across name/phone/email.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Optional status filter" },
        source: { type: "string", description: "Optional source (e.g. Instagram, Website)" },
        search: { type: "string", description: "Free-text search on name, phone, email, notes" },
        from_date: { type: "string", description: "ISO date — created_at >= from_date" },
        to_date: { type: "string", description: "ISO date — created_at <= to_date" },
        limit: { type: "integer", description: "Max rows (default 25, max 100)" },
      },
    },
  },
  {
    name: "list_clients",
    description: "List clients. Optional text search across name, partner_name, email, phone, city.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string" },
        limit: { type: "integer", description: "Default 25, max 100" },
      },
    },
  },
  {
    name: "list_projects",
    description: "List projects. Optional status filter (booked / in_progress / completed) and search on project_name or event_type.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        search: { type: "string" },
        limit: { type: "integer" },
      },
    },
  },
  {
    name: "list_invoices",
    description: "List invoices. Filter by status (draft/sent/partial/paid/overdue), date range, or client.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        client_search: { type: "string", description: "Match on client_name" },
        from_date: { type: "string" },
        to_date: { type: "string" },
        limit: { type: "integer" },
      },
    },
  },
  {
    name: "list_deliverables",
    description:
      "List deliverables. Filter by status (pending / in_progress / review / approved / delivered), priority, or assignee name.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string" },
        priority: { type: "string" },
        assignee_search: { type: "string" },
        limit: { type: "integer" },
      },
    },
  },
  {
    name: "list_overdue",
    description:
      "Overdue work across the studio. Returns overdue invoices (past due_date and unpaid), overdue deliverables (past due_date and not delivered), pending leave requests, pending payment requests, and overdue follow-ups on leads.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "revenue_breakdown",
    description:
      "Revenue breakdowns. Group by 'month' (last 12 months) or 'event_type' or 'source' (which lead source converts best). Returns billed and collected totals per group.",
    input_schema: {
      type: "object",
      properties: {
        group_by: {
          type: "string",
          enum: ["month", "event_type", "source"],
        },
      },
      required: ["group_by"],
    },
  },
];

const SYSTEM_PROMPT = `You are StudioOne AI, an in-app assistant for a photography & videography studio CRM.

Your job is to answer the studio owner / manager's questions about their data and help them act on it.
You have read-only tools that query the studio's Supabase database — every query is automatically scoped to the caller's organization.

Style:
- Be concise and direct. Numbers first, narrative second.
- Format money in INR (e.g. ₹1,23,456) and dates as "12 Mar 2026".
- When you list items, prefer short markdown tables or bullet lists.
- If a question is ambiguous, make the most reasonable assumption and note it briefly — don't ask back unless truly stuck.
- If the user asks "what should I do today" or similar, run summary_kpis + list_overdue and give them a 3-5 item action list ranked by urgency.
- If the user asks for a number you can compute from a single tool, use that one tool. Don't fan out unnecessarily.

You can call multiple tools in parallel when answering compound questions ("how many leads this month and what's my outstanding").

You are not authorized to modify data — never claim to have created/updated/deleted anything. If asked to take an action, suggest the page in the app where the user can do it (e.g. "/leads", "/invoices", "/payment-requests", "/process-planner").`;

// ===== Tool execution =====
async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  orgId: string,
): Promise<unknown> {
  const limit = Math.min(Number((input.limit as number) ?? 25), 100);

  switch (name) {
    case "summary_kpis": {
      const [leads, clients, projects, events, invoices] = await Promise.all([
        supabase.from("leads").select("id, status", { count: "exact", head: false }).eq("organization_id", orgId),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("invoices").select("total_amount, amount_paid").eq("organization_id", orgId),
      ]);

      const billed = (invoices.data ?? []).reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
      const collected = (invoices.data ?? []).reduce((s: number, i: any) => s + Number(i.amount_paid || 0), 0);

      return {
        total_leads: leads.count ?? 0,
        leads_by_status: tally((leads.data ?? []).map((l: any) => l.status)),
        total_clients: clients.count ?? 0,
        total_projects: projects.count ?? 0,
        total_events: events.count ?? 0,
        invoices_count: invoices.data?.length ?? 0,
        revenue_billed: billed,
        revenue_collected: collected,
        revenue_outstanding: billed - collected,
      };
    }

    case "list_leads": {
      let q = supabase
        .from("leads")
        .select("id, name, phone, email, source, event_type, event_date, city, budget, status, follow_up_date, notes, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input.status) q = q.eq("status", input.status as string);
      if (input.source) q = q.ilike("source", `%${input.source}%`);
      if (input.from_date) q = q.gte("created_at", input.from_date as string);
      if (input.to_date) q = q.lte("created_at", input.to_date as string);
      if (input.search) {
        const s = `%${input.search}%`;
        q = q.or(`name.ilike.${s},phone.ilike.${s},email.ilike.${s},notes.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length ?? 0, leads: data };
    }

    case "list_clients": {
      let q = supabase
        .from("clients")
        .select("id, name, partner_name, email, phone, city, event_type, event_date, status, budget, source")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input.search) {
        const s = `%${input.search}%`;
        q = q.or(`name.ilike.${s},partner_name.ilike.${s},email.ilike.${s},phone.ilike.${s},city.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length ?? 0, clients: data };
    }

    case "list_projects": {
      let q = supabase
        .from("projects")
        .select("id, project_name, event_type, event_date, venue, status, total_amount, amount_paid")
        .eq("organization_id", orgId)
        .order("event_date", { ascending: true, nullsFirst: false })
        .limit(limit);
      if (input.status) q = q.eq("status", input.status as string);
      if (input.search) {
        const s = `%${input.search}%`;
        q = q.or(`project_name.ilike.${s},event_type.ilike.${s}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length ?? 0, projects: data };
    }

    case "list_invoices": {
      let q = supabase
        .from("invoices")
        .select("id, invoice_number, client_name, project_name, total_amount, amount_paid, status, due_date, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (input.status) q = q.eq("status", input.status as string);
      if (input.client_search) q = q.ilike("client_name", `%${input.client_search}%`);
      if (input.from_date) q = q.gte("created_at", input.from_date as string);
      if (input.to_date) q = q.lte("created_at", input.to_date as string);
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length ?? 0, invoices: data };
    }

    case "list_deliverables": {
      let q = supabase
        .from("deliverables")
        .select("id, title, deliverable_type, status, priority, progress, due_date, delivered_date, assigned_to")
        .eq("organization_id", orgId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(limit);
      if (input.status) q = q.eq("status", input.status as string);
      if (input.priority) q = q.eq("priority", input.priority as string);
      if (input.assignee_search) {
        // join with team_members by name
        const { data: tmIds } = await supabase
          .from("team_members")
          .select("id")
          .eq("organization_id", orgId)
          .ilike("full_name", `%${input.assignee_search}%`);
        const ids = (tmIds ?? []).map((t: any) => t.id);
        if (ids.length === 0) return { count: 0, deliverables: [] };
        q = q.in("assigned_to", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      return { count: data?.length ?? 0, deliverables: data };
    }

    case "list_overdue": {
      const today = new Date().toISOString().slice(0, 10);
      const [invoices, deliverables, leaves, payments, leads] = await Promise.all([
        supabase
          .from("invoices")
          .select("invoice_number, client_name, total_amount, amount_paid, due_date, status")
          .eq("organization_id", orgId)
          .lt("due_date", today)
          .neq("status", "paid"),
        supabase
          .from("deliverables")
          .select("title, deliverable_type, status, due_date")
          .eq("organization_id", orgId)
          .lt("due_date", today)
          .not("status", "in", "(delivered,approved)"),
        supabase
          .from("leaves")
          .select("employee_name, leave_type, from_date, to_date, days, status")
          .eq("organization_id", orgId)
          .eq("status", "Pending"),
        supabase
          .from("payment_requests")
          .select("amount, description, status, created_at")
          .eq("organization_id", orgId)
          .eq("status", "pending"),
        supabase
          .from("leads")
          .select("name, phone, follow_up_date, status")
          .eq("organization_id", orgId)
          .lt("follow_up_date", today)
          .not("status", "in", "(converted,lost)"),
      ]);

      return {
        overdue_invoices: invoices.data ?? [],
        overdue_deliverables: deliverables.data ?? [],
        pending_leaves: leaves.data ?? [],
        pending_payment_requests: payments.data ?? [],
        overdue_lead_followups: leads.data ?? [],
      };
    }

    case "revenue_breakdown": {
      const groupBy = input.group_by as "month" | "event_type" | "source";

      if (groupBy === "month") {
        const now = new Date();
        const fromDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const { data, error } = await supabase
          .from("invoices")
          .select("total_amount, amount_paid, created_at")
          .eq("organization_id", orgId)
          .gte("created_at", fromDate.toISOString());
        if (error) throw error;
        const byMonth: Record<string, { billed: number; collected: number }> = {};
        for (const row of data ?? []) {
          const d = new Date(row.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          if (!byMonth[key]) byMonth[key] = { billed: 0, collected: 0 };
          byMonth[key].billed += Number(row.total_amount || 0);
          byMonth[key].collected += Number(row.amount_paid || 0);
        }
        return { group_by: "month", breakdown: byMonth };
      }

      if (groupBy === "event_type") {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, event_type, total_amount, amount_paid")
          .eq("organization_id", orgId);
        const byType: Record<string, { count: number; billed: number; collected: number }> = {};
        for (const p of projects ?? []) {
          const k = p.event_type || "Unknown";
          if (!byType[k]) byType[k] = { count: 0, billed: 0, collected: 0 };
          byType[k].count += 1;
          byType[k].billed += Number(p.total_amount || 0);
          byType[k].collected += Number(p.amount_paid || 0);
        }
        return { group_by: "event_type", breakdown: byType };
      }

      // source: convert leads grouped by source, count converted vs total
      const { data: leads } = await supabase
        .from("leads")
        .select("source, status, budget")
        .eq("organization_id", orgId);
      const bySource: Record<string, { total: number; converted: number; converted_value: number }> = {};
      for (const l of leads ?? []) {
        const k = l.source || "Unknown";
        if (!bySource[k]) bySource[k] = { total: 0, converted: 0, converted_value: 0 };
        bySource[k].total += 1;
        if (l.status === "converted") {
          bySource[k].converted += 1;
          bySource[k].converted_value += Number(l.budget || 0);
        }
      }
      return { group_by: "source", breakdown: bySource };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function tally(arr: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of arr) out[x] = (out[x] || 0) + 1;
  return out;
}

// Drop optional fields that arrive as `null`/empty so they don't cache-bust.
function cleanInput(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    out[k] = v;
  }
  return out;
}

// ===== Anthropic call (one round) =====
async function callAnthropic(
  apiKey: string,
  messages: any[],
  signal: AbortSignal,
): Promise<{ stop_reason: string; content: any[]; usage: any }> {
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: TOOLS,
    messages,
  };

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Anthropic ${resp.status}: ${errText}`);
  }

  return await resp.json();
}

// ===== Main handler =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // Verify the calling user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve org
  const { data: membership } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const orgId = membership?.organization_id;
  if (!orgId) {
    return new Response(JSON.stringify({ error: "No organization for this user" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { messages?: any[] };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Stream chunks back as SSE so the UI can render incrementally.
  // Each chunk is: `data: {"type": "...", ...}\n\n`
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      const ac = new AbortController();
      const onAbort = () => ac.abort();
      req.signal.addEventListener("abort", onAbort);

      try {
        // Agentic loop — server-side tool execution, only final text streams to UI.
        const conversation: any[] = [...messages];
        let iteration = 0;

        while (iteration < MAX_TOOL_ITERATIONS) {
          iteration++;

          const resp = await callAnthropic(apiKey, conversation, ac.signal);

          // Forward any text blocks to the UI as they arrive (this round)
          for (const block of resp.content) {
            if (block.type === "text" && block.text) {
              // Chunk the text into ~50-char delta events for a typing feel
              const text = block.text;
              const chunkSize = 60;
              for (let i = 0; i < text.length; i += chunkSize) {
                send({ type: "text", text: text.slice(i, i + chunkSize) });
                // micro-delay for typing UX
                await new Promise((r) => setTimeout(r, 8));
              }
            }
          }

          // If model is done, finish.
          if (resp.stop_reason !== "tool_use") {
            send({
              type: "done",
              stop_reason: resp.stop_reason,
              usage: resp.usage,
              iterations: iteration,
            });
            break;
          }

          // Append assistant turn (with tool_use blocks) to the conversation
          conversation.push({ role: "assistant", content: resp.content });

          // Execute tools in parallel and tell the UI which tools fired
          const toolUses = resp.content.filter((b: any) => b.type === "tool_use");
          for (const tu of toolUses) {
            send({ type: "tool_use", name: tu.name, input: cleanInput(tu.input) });
          }

          const toolResults = await Promise.all(
            toolUses.map(async (tu: any) => {
              try {
                const result = await executeTool(tu.name, tu.input || {}, supabaseAdmin, orgId);
                return {
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: JSON.stringify(result),
                };
              } catch (e: any) {
                return {
                  type: "tool_result",
                  tool_use_id: tu.id,
                  content: `Error: ${e.message}`,
                  is_error: true,
                };
              }
            }),
          );

          conversation.push({ role: "user", content: toolResults });
        }

        if (iteration >= MAX_TOOL_ITERATIONS) {
          send({ type: "error", message: "Max tool iterations reached" });
        }
      } catch (e: any) {
        send({ type: "error", message: e.message || "Unknown error" });
      } finally {
        req.signal.removeEventListener("abort", onAbort);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
});
