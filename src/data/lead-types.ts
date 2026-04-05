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

export const sampleLeads: Lead[] = [
  {
    id: "l1", serialNo: "LD1545", name: "Riya Mehta", company: "Udbhav", website: "https://example.com",
    phone: "9844095216", source: "instagram", stage: "new", eventType: "wedding",
    eventDate: "2026-06-15", city: "Mumbai", budget: 300000,
    notes: "Saw our reel, loved the cinematic style", createdAt: "2026-03-02",
  },
  {
    id: "l2", serialNo: "LD1546", name: "Karan & Simran", company: "Cross Media",
    phone: "9900233445", source: "whatsapp", stage: "new", eventType: "wedding",
    eventDate: "2026-07-20", city: "Delhi", budget: 450000,
    notes: "Wants drone + traditional coverage", createdAt: "2026-03-02",
  },
  {
    id: "l3", serialNo: "LD1547", name: "Pooja Agarwal", company: "Varad Studios",
    phone: "8800344556", source: "referral", stage: "new", eventType: "pre-wedding",
    city: "Goa", budget: 80000,
    notes: "Referred by Priya Sharma (past client)", createdAt: "2026-03-02",
  },
  {
    id: "l4", serialNo: "LD1548", name: "Amit & Neha", company: "Sri Balaji",
    phone: "7700455667", source: "call", stage: "contacted", eventType: "wedding",
    eventDate: "2026-05-25", city: "Jaipur", budget: 250000,
    notes: "Called back, interested in premium package", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-28", assignedTo: "Raj Patel",
  },
  {
    id: "l5", serialNo: "LD1549", name: "Divya Reddy", company: "Olive Resorts",
    phone: "6600566778", source: "instagram", stage: "contacted", eventType: "engagement",
    eventDate: "2026-04-20", city: "Hyderabad", budget: 120000,
    notes: "DM on Instagram, wants quick turnaround", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-27", assignedTo: "Vikram Singh",
  },
  {
    id: "l6", serialNo: "LD1550", name: "Sahil & Prachi",
    phone: "5500677889", source: "website", stage: "proposal-sent", eventType: "wedding",
    eventDate: "2026-08-10", city: "Udaipur", budget: 500000, dealValue: 500000,
    notes: "Destination wedding, sent Royal package quote", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-26", assignedTo: "Raj Patel",
  },
  {
    id: "l7", serialNo: "LD1551", name: "Megha Joshi",
    phone: "4400788990", source: "whatsapp", stage: "proposal-sent", eventType: "reception",
    eventDate: "2026-05-05", city: "Pune", budget: 150000,
    notes: "Only reception coverage, awaiting confirmation", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-25", assignedTo: "Vikram Singh",
  },
  {
    id: "l8", serialNo: "LD1552", name: "Rohit & Anjali",
    phone: "3300899001", source: "referral", stage: "converted", eventType: "wedding",
    eventDate: "2026-04-28", city: "Jaipur", budget: 250000, dealValue: 250000,
    notes: "Converted! Booked Premium Wedding Package", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-15", assignedTo: "Raj Patel",
  },
  {
    id: "l9", serialNo: "LD1553", name: "Tanvi Shah",
    phone: "2200900112", source: "facebook", stage: "converted", eventType: "pre-wedding",
    eventDate: "2026-04-10", city: "Lonavala", budget: 90000, dealValue: 90000,
    notes: "Pre-wedding shoot booked", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-14", assignedTo: "Vikram Singh",
  },
  {
    id: "l10", serialNo: "LD1554", name: "Vivek Pandey",
    phone: "1100011223", source: "call", stage: "lost", eventType: "wedding",
    eventDate: "2026-06-01", city: "Lucknow", budget: 180000,
    notes: "Went with a cheaper local vendor", createdAt: "2026-03-02",
    lastContactedAt: "2026-03-12",
  },
  {
    id: "l11", serialNo: "LD1555", name: "Nisha Gupta",
    phone: "9911122334", source: "instagram", stage: "new", eventType: "corporate",
    city: "Bangalore", budget: 60000,
    notes: "Event got cancelled", createdAt: "2026-03-02",
  },
];
