export type LeadSource = "instagram" | "whatsapp" | "call" | "website" | "referral" | "facebook";
export type LeadStage = "new" | "contacted" | "proposal-sent" | "converted" | "lost";
export type EventType = "wedding" | "pre-wedding" | "engagement" | "reception" | "corporate" | "birthday";

export interface Lead {
  id: string;
  serialNo: string;
  name: string;
  company?: string;
  website?: string;
  phone: string;
  email?: string;
  city?: string;
  sectors?: string;
  source: LeadSource;
  stage: LeadStage;
  eventType: EventType;
  eventDate?: string;
  budget?: number;
  dealValue?: number;
  followUp?: string;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  lastContactedAt?: string;
}

export const stageConfig: Record<LeadStage, { label: string; color: string; bgColor: string; borderColor: string }> = {
  new: { label: "New Lead", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-500/10", borderColor: "border-blue-200 dark:border-blue-500/30" },
  contacted: { label: "Contacted", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-500/10", borderColor: "border-amber-200 dark:border-amber-500/30" },
  "proposal-sent": { label: "Proposal Sent", color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-500/10", borderColor: "border-purple-200 dark:border-purple-500/30" },
  converted: { label: "Converted", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-500/10", borderColor: "border-emerald-200 dark:border-emerald-500/30" },
  lost: { label: "Lost", color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-500/10", borderColor: "border-red-200 dark:border-red-500/30" },
};

export const sourceConfig: Record<LeadSource, { label: string; emoji: string }> = {
  instagram: { label: "Instagram", emoji: "📸" },
  whatsapp: { label: "WhatsApp", emoji: "💬" },
  call: { label: "Phone Call", emoji: "📞" },
  website: { label: "Website", emoji: "🌐" },
  referral: { label: "Referral", emoji: "🤝" },
  facebook: { label: "Facebook", emoji: "👤" },
};

export const eventTypeLabels: Record<EventType, string> = {
  wedding: "Wedding",
  "pre-wedding": "Pre-Wedding",
  engagement: "Engagement",
  reception: "Reception",
  corporate: "Corporate",
  birthday: "Birthday",
};

export const sampleLeads: Lead[] = [];
