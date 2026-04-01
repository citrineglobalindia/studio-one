export type LeadSource = "instagram" | "whatsapp" | "call" | "website" | "referral" | "facebook";
export type LeadStage = "new" | "contacted" | "proposal-sent" | "converted" | "lost";
export type EventType = "wedding" | "pre-wedding" | "engagement" | "reception" | "corporate" | "birthday";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  stage: LeadStage;
  eventType: EventType;
  eventDate?: string;
  city: string;
  budget?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  lastContactedAt?: string;
}

export const stageConfig: Record<LeadStage, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  contacted: { label: "Contacted", color: "bg-yellow-500" },
  "proposal-sent": { label: "Proposal Sent", color: "bg-purple-500" },
  converted: { label: "Converted", color: "bg-emerald-500" },
  lost: { label: "Lost", color: "bg-red-500" },
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
    id: "l1", name: "Riya Mehta", phone: "+91 98001 12233", source: "instagram",
    stage: "new", eventType: "wedding", eventDate: "2026-06-15", city: "Mumbai",
    budget: 300000, notes: "Saw our reel, loved the cinematic style", createdAt: "2026-03-29",
  },
  {
    id: "l2", name: "Karan & Simran", phone: "+91 99002 33445", source: "whatsapp",
    stage: "new", eventType: "wedding", eventDate: "2026-07-20", city: "Delhi",
    budget: 450000, notes: "Wants drone + traditional coverage", createdAt: "2026-03-30",
  },
  {
    id: "l3", name: "Pooja Agarwal", phone: "+91 88003 44556", source: "referral",
    stage: "new", eventType: "pre-wedding", city: "Goa",
    budget: 80000, notes: "Referred by Priya Sharma (past client)", createdAt: "2026-03-31",
  },
  {
    id: "l4", name: "Amit & Neha", phone: "+91 77004 55667", source: "call",
    stage: "contacted", eventType: "wedding", eventDate: "2026-05-25", city: "Jaipur",
    budget: 250000, notes: "Called back, interested in premium package", createdAt: "2026-03-25",
    lastContactedAt: "2026-03-28", assignedTo: "Raj Patel",
  },
  {
    id: "l5", name: "Divya Reddy", phone: "+91 66005 66778", source: "instagram",
    stage: "contacted", eventType: "engagement", eventDate: "2026-04-20", city: "Hyderabad",
    budget: 120000, notes: "DM on Instagram, wants quick turnaround", createdAt: "2026-03-22",
    lastContactedAt: "2026-03-27", assignedTo: "Vikram Singh",
  },
  {
    id: "l6", name: "Sahil & Prachi", phone: "+91 55006 77889", source: "website",
    stage: "proposal-sent", eventType: "wedding", eventDate: "2026-08-10", city: "Udaipur",
    budget: 500000, notes: "Destination wedding, sent Royal package quote", createdAt: "2026-03-18",
    lastContactedAt: "2026-03-26", assignedTo: "Raj Patel",
  },
  {
    id: "l7", name: "Megha Joshi", phone: "+91 44007 88990", source: "whatsapp",
    stage: "proposal-sent", eventType: "reception", eventDate: "2026-05-05", city: "Pune",
    budget: 150000, notes: "Only reception coverage, awaiting confirmation", createdAt: "2026-03-20",
    lastContactedAt: "2026-03-25", assignedTo: "Vikram Singh",
  },
  {
    id: "l8", name: "Rohit & Anjali", phone: "+91 33008 99001", source: "referral",
    stage: "converted", eventType: "wedding", eventDate: "2026-04-28", city: "Jaipur",
    budget: 250000, notes: "Converted! Booked Premium Wedding Package", createdAt: "2026-03-10",
    lastContactedAt: "2026-03-15", assignedTo: "Raj Patel",
  },
  {
    id: "l9", name: "Tanvi Shah", phone: "+91 22009 00112", source: "facebook",
    stage: "converted", eventType: "pre-wedding", eventDate: "2026-04-10", city: "Lonavala",
    budget: 90000, notes: "Pre-wedding shoot booked", createdAt: "2026-03-12",
    lastContactedAt: "2026-03-14", assignedTo: "Vikram Singh",
  },
  {
    id: "l10", name: "Vivek Pandey", phone: "+91 11000 11223", source: "call",
    stage: "lost", eventType: "wedding", eventDate: "2026-06-01", city: "Lucknow",
    budget: 180000, notes: "Went with a cheaper local vendor", createdAt: "2026-03-05",
    lastContactedAt: "2026-03-12",
  },
  {
    id: "l11", name: "Nisha Gupta", phone: "+91 99111 22334", source: "instagram",
    stage: "lost", eventType: "corporate", city: "Bangalore",
    budget: 60000, notes: "Event got cancelled", createdAt: "2026-03-08",
  },
];
