## Plan: Role-Based Access + PWA Architecture

### Roles
- **Admin** — Full access to all modules, responsive web dashboard
- **Vendor, Editor, Telecaller, Videographer, Photographer, HR, Accounts** — PWA app with module access controlled by Admin

### Phase 1: Role & Access Management (No Auth Yet)
1. **Create a Role Management page** (`/settings` → Access Control tab)
   - Admin can define which modules each role can access (checkboxes per role)
   - Store config in local state for now (ready for DB later)

2. **Create a Role Context** (`RoleContext`)
   - Stores current role (default: `admin` for now)
   - Role switcher in header for testing
   - Provides `hasAccess(module)` helper

### Phase 2: Admin Dashboard — Responsive Polish
3. **Ensure all existing pages** are fully responsive (web + mobile)
4. **Admin keeps the full sidebar** navigation

### Phase 3: PWA Layout for Non-Admin Roles
5. **Create a PWA-style layout** (`PWALayout`)
   - Bottom tab navigation (mobile-first)
   - No sidebar — clean app-like feel
   - Only shows modules the role has access to
   - Top header with role name, profile avatar, notifications

6. **App.tsx routing logic**
   - If role === admin → `DashboardLayout` with sidebar
   - If role !== admin → `PWALayout` with bottom tabs
   - Both use the same page components

### Phase 4: PWA Installability
7. **Add `manifest.json`** for Add-to-Home-Screen (no service worker needed)
   - App icon, name, `display: standalone`
   - Only for non-admin roles

### What stays the same
- All page components remain shared
- No auth implementation (skipped per your request)
- Data is the same, just filtered by role access

### Deliverables
- Role context + switcher for testing
- PWA bottom-tab layout for non-admin roles
- Access control settings page for admin
- `manifest.json` for installability
