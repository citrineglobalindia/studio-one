
# SaaS Transformation Plan

## Phase 1: Landing Page & Marketing Site
- Create a public-facing landing page with hero, features showcase, pricing table, testimonials, and CTA
- Add `/pricing`, `/features` routes (public, no auth required)
- Professional design with animations, social proof, and conversion-optimized layout
- Mobile-responsive marketing pages

## Phase 2: Organization/Tenant System (Database)
- Create `organizations` table (name, slug, logo, plan, owner_id)
- Create `organization_members` table (org_id, user_id, role: owner/admin/member)
- Add `organization_id` column to all existing data tables (albums, expenses)
- Update RLS policies so users can only access data belonging to their organization
- Create a security-definer function for org membership checks

## Phase 3: Onboarding Flow
- Studio signup wizard: organization name, logo upload, team size, industry
- Workspace setup: invite team members via email
- Initial configuration: default settings, branding preferences
- Guided tour of key features after setup

## Phase 4: Subscription & Billing (No payment provider yet)
- Create `subscription_plans` table with feature limits
- Create `subscriptions` table linking orgs to plans
- Implement feature gating logic (check plan limits before allowing actions)
- Build plan management UI in Settings
- Placeholder for payment integration (Stripe/Razorpay) to be added later

## Implementation Order
1. **Landing page** → immediate visual impact
2. **Database: org/tenant tables + migrations** → foundation for multi-tenancy
3. **Onboarding flow** → new user experience
4. **Subscription system** → feature gating and plan management
