# StudioOne — Platform Blueprint

> Living spec. Update this file whenever architecture, modules, roles or major decisions change.
> Last updated: 2026-04-29 (v7.2 — Reset password now works for legacy contractors: any user with an email gets the action. If they don't have an auth account yet, the same dialog auto-promotes them — creates the auth user, links the existing team_members row in place, and sets the chosen password. Edge fn `manage-member.invite` accepts `initial_password` + `link_team_member_id`.) (v7.1 — Streamlined admin password reset UX. v6 — Call Logs module removed.)

This is the canonical product / engineering specification for StudioOne, a multi-tenant SaaS for photography & videography studios. Everything below should be the source of truth — the codebase implements this; new features get added here first.

---

## 1. Product positioning

We are **not** building "just a CRM."
StudioOne is a **vertical operating system for photography & videography studios** — sales pipeline, production workflow, post-production handover, finance and team management, all in one place, with a SaaS platform layer above it.

Stack:
- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui + Framer Motion
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, RLS)
- **Hosting:** Vercel (frontend) + Supabase Cloud (data plane)
- **Mobile:** PWA (`/m/*`) — installable web app for on-the-go roles

---

## 2. Role hierarchy

Roles are stored on `profiles.role` and (per studio) overridden via `organization_members.role` + `studio_role_module_access`. Anything is changeable per-studio by an Admin (no hardcoding).

### 2.1 Super Admin (platform owner)
- Create / manage studios (tenants)
- Enable / disable modules per studio (SaaS control)
- Assign subscription plan (Starter / Professional / Enterprise)
- **Impersonate** any studio (read or controlled access) without their login
- Global analytics + revenue tracking
- Manage public enquiries (lead inbox)
- Platform settings (single global row)

### 2.2 Admin (studio owner)
- Full control of their studio
- Manage users, team members, vendors, clients, finance
- Control **module access per role** within the studio
- Decide login access surface per user: Web / PWA / Both
- Configure studio branding (logo, color, GST, contact)

### 2.3 Manager ✅ implemented
- Now a first-class `AppRole` (`manager`) in `RoleContext`
- Default access: Sales CRM + Operations + Finance + Growth + Notifications/Profile
  (everything except platform settings, permissions, HR-Module, AI tools)
- Bounded by Admin via `studio_role_module_access` overrides

### 2.4 Operational roles

| Role | Primary surface | Key access |
|------|-----------------|------------|
| **Editor** | PWA `/m` | Tasks, Submissions, Payment Requests |
| **Photographer** | PWA `/m` | Assigned events, attendance, calendar |
| **Videographer** | PWA `/m` | Assigned events, attendance, calendar |
| **Telecaller / Sales** | Web | Leads, Clients, Communications |
| **Accountant** | Web | Invoices, Quotations, Contracts, Expenses, Payment Requests, Analytics |
| **HR** | Web | Employees, Attendance, Leaves, Team |
| **Vendor** | PWA `/m` | Assigned vendor orders, deliveries |

---

## 3. Module catalogue

Modules are first-class objects in `RoleContext.AppModule`. The Super Admin can disable any module per studio (`studio_module_restrictions`); the Admin can grant/revoke per role within the studio (`studio_role_module_access`).

### 3.1 Client & Project Management
**Hierarchy:** `Client → Project → Events → Deliverables`
- One client can have many projects (e.g. "Riya's Wedding" + "Riya's Anniversary")
- One project has many events (Haldi, Sangeet, Wedding, Reception)
- Each event has a date, venue, time window, assigned team
- Each event/project has many deliverables (photo edits, reels, albums)

### 3.2 Event & Calendar
- Event CRUD on `/events`
- Team assignment via `event_team_assignments` with **time-overlap conflict detection** (a member assigned 09:00-13:00 on day X cannot be re-assigned 11:00-15:00 same day, but is free for an 18:00 event)
- Calendar view (`/calendar` web, `/m/calendar` mobile) shows real DB events
- Schedule Event sheet on Calendar persists to DB

### 3.3 Lead Management (Sales CRM)
- Public **enquiry form** on landing page → `enquiries` table → Super Admin inbox
- `Leads` table per-org: name, phone, email, source, event_type, event_date, budget, status, follow_up_date, assigned_to
- Status flow: `new → contacted → qualified → proposal → converted | lost`
- One-click convert lead → client + carry over data

### 3.4 Accounts & Billing
- **Quotations** — line items, validity, status flow draft → sent → viewed → approved
- **Contracts** — body, terms, signature block, status flow draft → sent → signed
- **Invoices** — line items, tax, discount, total, amount_paid, payment_terms
- **Expenses** — categorised, approval workflow
- **PDF Builder** for all three: branded templates (Minimal / Elegant / Bold), logo upload, accent color, cover hero image, portfolio gallery — produces an A4 PDF via `html2canvas` + `jsPDF`
- **Vendor orders** — track third-party orders (album printer, drone rental etc.) with status + payment

### 3.5 Task Management
- DB-backed Kanban: To Do / In Progress / Review / Done
- Tasks linked to project, optionally to assignee (team_member), priority, due date, progress %
- Especially for Editors — primary working surface

### 3.6 Process Planner ⭐ USP ✅ v2 implemented
> **Differentiator. Implemented across 3 surfaces.**

3 tabs at `/process-planner`:

1. **Per-Client** (`/process-planner`) — pick a client, lay out their custom pipeline:
   ```
   Shoot → Data Backup → Editing → Review → Album Design → Print → Delivery
   ```
2. **Templates** (`/process-planner/templates`) — reusable workflow templates per studio (e.g. "Wedding Pipeline", "Pre-Wedding Pipeline"). Each template has ordered steps with name, description, **responsible role**, and **default ETA days from event date**. **Apply to client** materializes the template into concrete `client_process_steps` with auto-calculated due dates.
3. **Across Projects** (`/process-planner/dashboard`) — bird's-eye bottleneck view: KPIs (pending / in-progress / done / blocked / overdue), and "Where projects are stuck" — active steps grouped by name with count + age of the oldest, so the bottleneck is obvious at a glance.

Schema:
- `process_templates` (per studio)
- `process_template_steps` (ordered steps with role + eta_days)
- `client_process_steps` extended with: `template_step_id`, `responsible_role`, `assignee_id`, `due_date`, `completed_at`, `blocked_reason`, `sequence`

### 3.7 Vendor Management
- Vendor CRUD (treated as `team_members` with `role = printer_vendor` etc.)
- Vendor Orders module tracks deliverables ordered from external vendors
- Vendor payments tracked via Payment Requests + Invoices
- History per vendor (orders + spend)

### 3.8 Request Module (internal finance control)
**Flow:** team member raises request → Admin approves / rejects / pays
- Two kinds:
  - **Payment Request** — for completed work or upcoming expense (on `payment_requests`)
  - **Expense Request** — for office/personal reimbursement (on `expenses` with approval flow)
- Approval levels (future): single-approver now, multi-approver later
- Editor's flow: from a deliverable, "Raise payment" → links the request to the deliverable + project
- Admin's flow: `/payment-requests` page → KPIs + per-row Approve / Reject / Mark-paid with optional transaction reference

### 3.9 User & Role Management (RBAC) ✅ implemented (unified)
**One concept: Studio User.** Every person in the studio is a user with email + role + login surface + operational fields. The previous Team/Members split is gone.

- **Studio Users page** at `/team` (admin/manager only) — single surface for invite, edit, remove. Grid + list view, role + surface filters, KPI strip (total / with-login / web / mobile / both).
- **Add User dialog** sections:
  - **Identity** — full name, email, phone
  - **Access** — role picker (any of 9 AppRole values), login surface picker (Web only / Mobile only / Both), Send-invite toggle
  - **Operational** — daily rate, experience years, specialties, notes
- **Invite flow** — `manage-member.invite` (service role edge fn) does all three writes in one transaction: creates or attaches `auth.users`, upserts `organization_members` (role + login_surface), upserts `team_members` (operational fields). Triggers password-reset email if requested.
- **Contractor mode** — no email = no auth user. Just creates a `team_members` row so they can still be assigned to events. Shows a "No login" badge.
- **Edit flow** — change name, role, surface, phone, rate, specialties, notes — all in one dialog. Role change mirrors to `profiles.role` so they see the right dashboard next login.
- **Reset password flow** — per-user dropdown action with two modes:
  - **Send reset email** — generates a Supabase recovery link, mailed to the user; they pick their own password
  - **Set password manually** — admin types (or auto-generates) a new password, applied directly via service role; user can sign in immediately. Includes copy-to-clipboard, show/hide toggle, strong-password generator. Disabled for users with no login account.
- **Remove flow** — drops both org_member and team_member rows. Owner-protected, can't-self-remove.
- Four control surfaces (same as before):
  - Profile role (`profiles.role`) — default dashboard
  - Org role (`organization_members.role`) — owner / admin / member / specific role
  - Login surface (`organization_members.login_surface`) — `web` / `pwa` / `both` — enforced in routing
  - Per-role module access (`studio_role_module_access`) — module visibility per role within this studio

### 3.10 Reports & Dashboards
- **Owner dashboard** (web `/`) — revenue, leads, projects, calendar
- **Analytics** (web `/analytics`) — monthly revenue area chart, lead-source pie, event-type bar, conversion-rate line — all from real data
- **Super Admin dashboard** (`/super-admin`) — total studios, MRR, trial count, recent activity, audit log
- **Process Planner Reports** (planned) — bottleneck view across projects

---

## 4. SaaS module control (Super Admin)

Two layers control what a studio can see:

1. **Platform layer** — `studio_module_restrictions.restricted_modules`
   Super Admin disables a module for a studio. No one in that studio can use it, period.

2. **Studio layer** — `studio_role_module_access.allowed_modules`
   Admin grants module access per role within their studio. Defaults come from `DEFAULT_ACCESS` in `RoleContext.tsx`.

`hasAccess(module)` evaluates both: `(not platform-restricted) AND (in role's allowed list)`.

UI: Super Admin → Module Control → pick studio → toggle each module independently.
Granular modules so toggling "Projects" doesn't accidentally hide "Albums" — every sidebar item maps to its own module key.

---

## 5. Login access control ✅ implemented

`organization_members.login_surface` text column: `web` | `pwa` | `both` (default `both`).

**Routing enforcement (live):**
- `RoleContext` reads `login_surface` from the user's membership row when the org loads and exposes it via `useRole().loginSurface`
- `RoleLayoutWrapper` (desktop shell) — if `loginSurface === "pwa"` → `<Navigate to="/m" replace />`
- `RoleMobileLayout` (mobile shell at `/m/*`) — if `loginSurface === "web"` → `<Navigate to="/" replace />`
- `both` (default) → user can roam freely between web and PWA
- Super admins impersonating a studio always get `both` so they can audit either surface

**Setting the surface:** Admin opens `/members`, clicks Edit on a row, picks Web only / Mobile only / Web + Mobile. Saved server-side via the `manage-member` edge function (action: `update`).

**Granted at invite time:** When a new member is invited, admin picks their starting surface in the invite dialog. Defaults to `both`.

---

## 6. Critical backend concepts

### 6.1 Multi-tenant
Every table that holds studio data has `organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE`. RLS enforces `is_org_member(auth.uid(), organization_id)`.

### 6.2 Audit log
`audit_logs` records who did what + when on critical objects:
- super-admin actions (impersonation, module restriction)
- payment approvals
- invoice changes
- subscription changes

### 6.3 Impersonation
Super Admin sets `localStorage.sa_impersonate_org` + the OrgContext picks that org instead of the SA's own (which has none). Activity is logged. Future: dedicated short-lived JWT for read-only access.

### 6.4 Storage buckets
- `studio-assets` — logos, document covers (5 MB / file, public read)
- `editor-uploads` — deliverable attachments (500 MB / file, public read, scoped to org)

---

## 7. Permission tables (live in Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | user_id → display_name, role |
| `organizations` | tenant root |
| `organization_members` | user × org with role (owner/admin/member or any AppRole) + `login_surface` (web/pwa/both) |
| `super_admins` | platform-level operators |
| `subscription_plans` | Starter / Pro / Enterprise definitions |
| `subscriptions` | per-org subscription with trial/active/expired |
| `studio_module_restrictions` | platform-level module disable per studio |
| `studio_role_restrictions` | platform-level role disable per studio |
| `studio_role_module_access` | per-role module allow-list within a studio |

---

## 8. Implementation status

### ✅ Phase 1 — built and live
- **Unified Studio Users (v5)** — `/team` is now the single surface for everything user-related. One Add User dialog covers identity (name/email/phone), access (role + Web/Mobile/Both surface + send-invite toggle), and operational (rate/experience/specialties/notes). Edge fn `manage-member` does all three writes (auth.users + organization_members + team_members) atomically. New users are immediately available for both login AND event assignment. Contractor mode (no email) still works — creates only the team_members row with a "No login" badge. Old `/members` route now redirects to `/team`.
- **Login Surface (v4)** — `manage-member` edge function (service role, three actions: invite/update/remove), `RoleContext.loginSurface` exposure, `RoleLayoutWrapper` + `RoleMobileLayout` enforcement so a "web only" user is bounced from `/m/*` and a "pwa only" user is bounced from the desktop shell. Owner-protection (cannot remove studio owner, cannot self-remove). Existing-user detection so re-inviting an already-registered email just attaches them to the studio.
- **Claude AI Assistant** — Supabase Edge Function (`/functions/v1/ai-chat`) proxies to Anthropic API (claude-opus-4-7) with prompt caching + 8 read-only tools (`summary_kpis`, `list_leads`, `list_clients`, `list_projects`, `list_invoices`, `list_deliverables`, `list_overdue`, `revenue_breakdown`). Server-side agentic loop, JWT-validated, every query auto-scoped to caller's org. Streaming chat UI at `/ai-assistant` with markdown + table rendering, tool-call chips, suggestions, cancel/reset. Secret: `ANTHROPIC_API_KEY` in Supabase project settings.
- Manager role + scoped permissions (now invitable from `/members`)
- **Realtime notifications** — `notifications` table with auto-triggers (payment requested/approved/rejected/paid, leave requested, enquiry received). NotificationBell in header with live unread count via Supabase realtime, full `/notifications` page with All/Unread tabs, mark-read + delete
- **Global search (Cmd+K / Ctrl+K)** — `GlobalSearch` modal searches leads/clients/projects/events/invoices/contracts/deliverables in one shot with quick "Jump to" page navigation
- Multi-tenant Supabase schema with RLS
- Org / member / super-admin / subscription model
- Auth (email/password) with role-based dashboard routing
- Clients, Projects, Events (with time-overlap team assignment)
- Leads + Lead → Client conversion (call activity now lives inside the Lead detail timeline; standalone Call Logs module removed in v6)
- Quotations, Invoices, Contracts (CRUD + status lifecycle)
- **PDF Document Builder** (templates + logo + cover photo + gallery + branded export)
- Tasks (Kanban) + Process Planner (basic)
- Vendor Orders
- HR (Employees, Attendance, Leaves with approval workflow)
- Calendar (real events, deep-link from Events page)
- Analytics page (real charts from DB)
- Super Admin: Studios, Modules, Subscriptions, Users, Activity, Reports, Notifications, System, **Settings (persisted)**, **Enquiries inbox**
- **Granular module control** (every sidebar item → one toggle)
- PWA mobile shell with deep-blue → now white+blue glass theme
- Editor's full workflow: deliverables, attachments upload, **submit for review**, **payment requests** raised by editor + admin approve/reject/mark-paid
- Public landing page with enquiry form persisted to DB

### 🟡 Phase 2 — in progress / partial
- Process Planner: data layer ready, deeper UI (timeline, cross-project bottleneck report) pending
- Vendor full lifecycle (vendor self-portal etc.)
- Audit log surfaces beyond Super Admin
- Bulk operations + CSV import on Leads/Clients
- Custom invite-email template (currently uses Supabase default password-reset email — works but not branded)

### 🔴 Phase 3 — not yet started
- Notifications (WhatsApp / email / in-app)
- File management beyond editor uploads (per-project asset library)
- Automation rules (when X happens → do Y)
- AI Assistant (Claude/Gemini integration)
- Marketing campaigns module
- Photo gallery sharing with password-protected client links
- Razorpay / Stripe payment links on invoices
- Google Calendar two-way sync
- Email sending (PDF to client, reminders)
- Multi-language

---

## 9. Critical files

### App shell & contexts
- `src/App.tsx` — route registry
- `src/contexts/AuthContext.tsx` — Supabase auth + signOut hardening
- `src/contexts/OrgContext.tsx` — resolves current org (with super-admin impersonation support)
- `src/contexts/RoleContext.tsx` — `AppModule` enum, `ALL_MODULES`, `DEFAULT_ACCESS`, `hasAccess()`

### Mobile shell
- `src/components/role-mobile/RoleMobileLayout.tsx` — header (with Chat + Bell + Profile), bottom nav (role-aware), light blue glass theme
- `src/pages/role-mobile/RoleDashboardPage.tsx` — generic role landing
- `src/pages/role-mobile/RoleDeliverablesPage.tsx` — editor's task list
- `src/pages/role-mobile/RolePaymentsPage.tsx` — editor's payment request list

### Editor workflow
- `src/hooks/useDeliverables.ts` + `useMyDeliverables`
- `src/hooks/useDeliverableAttachments.ts`
- `src/hooks/usePaymentRequests.ts`
- `src/components/deliverables/DeliverableDetailModal.tsx` — the work surface

### Documents
- `src/components/documents/DocumentTemplate.tsx` — A4 branded template (Minimal/Elegant/Bold)
- `src/components/documents/DocumentBuilder.tsx` — visual editor dialog
- `src/lib/pdf-export.ts` — html2canvas + jsPDF multi-page export

### Super Admin
- `src/pages/superadmin/*` — full SA portal pages
- `src/components/superadmin/ModuleControlDialog.tsx` — module toggle UI
- `supabase/functions/create-studio/index.ts` — onboards a new tenant
- `supabase/functions/setup-super-admin/index.ts` — bootstrap super admin

---

## 10. Conventions

- **Server of truth = Supabase**. Everything important persists. No `setTimeout` fake submits.
- **All tables get `organization_id` + RLS**, full stop.
- **All status enums are CHECK-constrained** in SQL so the schema documents allowed values.
- **Mutations use React Query** so cache invalidation propagates across pages.
- **Theme tokens** — never hardcode `text-black` / `bg-white`; use shadcn HSL tokens (`text-foreground`, `bg-card`) so theme overrides cascade.
- **Mobile pages re-use shadcn tokens** so the role-mobile layout's CSS variable override (`RoleMobileLayout.tsx:main`) re-themes them automatically.
- **One module = one sidebar item.** Avoid coarse modules that gate multiple items.

---

## 11. Update log

| Date | Change |
|------|--------|
| 2026-04-24 | Initial blueprint created. Captures live architecture as of commit `0264546`. |
| 2026-04-24 | v2 advanced: Manager role, realtime notifications + bell, global Cmd+K search, Process Planner v2 (templates + cross-project dashboard), `login_surface` column added to `organization_members`, auto-notify SQL triggers wired. |
| 2026-04-25 | v3 AI Assistant: deployed `ai-chat` Supabase Edge Function with Claude (opus 4.7) tool use over studio data. Streaming chat UI rebuilt at `/ai-assistant`. Requires `ANTHROPIC_API_KEY` set in Supabase project secrets. |
