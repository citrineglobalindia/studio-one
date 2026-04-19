import { RoleSubpageHeader } from "@/components/role-mobile/RoleSubpageHeader";

const SECTIONS = [
  {
    title: "Information we collect",
    body: "We collect the information you give us when you use StudioAi — your name, email, role, and the project data you create within your studio workspace.",
  },
  {
    title: "How we use your data",
    body: "We use your data to provide the service: showing your shoots, calendar, transactions, and team chat. We do not sell or share your personal data with advertisers.",
  },
  {
    title: "Where it lives",
    body: "Data is stored securely on Lovable Cloud infrastructure with row-level isolation, so each studio only sees its own information.",
  },
  {
    title: "Your choices",
    body: "You can update or delete your profile information at any time from Settings → Profile. To remove your account, contact your studio admin.",
  },
  {
    title: "Contact",
    body: "Questions about privacy? Reach us at privacy@studioai.app.",
  },
];

export default function PrivacyPolicyMobilePage() {
  return (
    <RoleSubpageHeader title="Privacy Policy" back="/m/settings">
      <p className="text-[11px] text-muted-foreground mb-5">Last updated: April 2026</p>
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-[13px] font-bold text-foreground mb-1.5">{s.title}</h3>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </RoleSubpageHeader>
  );
}
