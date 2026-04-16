export interface ClientActivity {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "payment" | "project";
  title: string;
  description: string;
  date: string;
  by?: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  type: "contract" | "invoice" | "photo" | "other";
  date: string;
  size: string;
}

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  status: "paid" | "due" | "overdue" | "partial";
  issueDate: string;
  dueDate: string;
  paidAmount: number;
}

export interface ClientPayment {
  id: string;
  amount: number;
  method: "UPI" | "Bank Transfer" | "Cash" | "Card" | "Cheque";
  date: string;
  reference?: string;
  invoiceId?: string;
  note?: string;
}

export interface ClientEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  type: "mehendi" | "haldi" | "sangeet" | "wedding" | "reception" | "engagement" | "pre-wedding" | "other";
  status: "upcoming" | "completed" | "in-progress";
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  partnerName: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  status: "active" | "past" | "vip";
  totalSpend: number;
  pendingAmount: number;
  projects: number;
  lastProject: string;
  source: string;
  rating: number;
  weddingDate?: string;
  notes?: string;
  tags: string[];
  activities: ClientActivity[];
  documents: ClientDocument[];
  invoices: ClientInvoice[];
  payments: ClientPayment[];
  events: ClientEvent[];
  createdAt: string;
}

export const sampleClients: Client[] = [];

export const statusConfig = {
  active: { label: "Active", color: "text-emerald-500", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-500/30", dot: "bg-emerald-500" },
  past: { label: "Completed", color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border", dot: "bg-muted-foreground" },
  vip: { label: "VIP", color: "text-primary", bgColor: "bg-primary/15", borderColor: "border-primary/30", dot: "bg-primary" },
} as const;

export const activityIcons = {
  call: "PhoneCall",
  email: "Mail",
  meeting: "Users",
  note: "FileText",
  payment: "IndianRupee",
  project: "Briefcase",
} as const;
