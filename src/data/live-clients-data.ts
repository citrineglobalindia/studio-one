export interface Deliverable {
  id: string;
  type: "Photos" | "Videos" | "Albums" | "Highlights" | "Footage Copy";
  label: string;
  status: "pending" | "in-progress" | "review" | "delivered";
  progress: number;
  dueDate: string;
  deliveredDate?: string;
  reminderDate?: string;
  assignedTo?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface LiveClient {
  id: string;
  name: string;
  partnerName: string;
  eventType: string;
  eventDate: string;
  deliveryDate: string;
  city: string;
  phone: string;
  overallProgress: number;
  status: "active" | "completed" | "on-hold";
  team: TeamMember[];
  deliverables: Deliverable[];
  financials: {
    estimatedAmount: number;
    invoicedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    expenses: number;
    profit: number;
  };
  createdAt: string;
  cardNumber?: string;
  rawDataSize?: string;
  backupNumber?: string;
  deliveryHdd?: string;
}

export const sampleLiveClients: LiveClient[] = [];

export const deliverableStatusConfig = {
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  "in-progress": { label: "In Progress", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  review: { label: "In Review", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  delivered: { label: "Delivered", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export const clientStatusConfig = {
  active: { label: "Active", color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  completed: { label: "Completed", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  "on-hold": { label: "On Hold", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};
