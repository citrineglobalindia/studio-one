export interface SubEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  status: "upcoming" | "in-progress" | "completed";
  assignedTeam: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: "photographer" | "videographer" | "editor" | "drone-operator" | "assistant";
  type: "in-office" | "vendor";
  phone?: string;
  avatar?: string;
  email?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  experience?: string;
  specialization?: string;
  dailyRate?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  joiningDate?: string;
  notes?: string;
}

export interface FootageItem {
  id: string;
  subEventId: string;
  subEventName: string;
  handedOverBy: string;
  handedOverByRole: "photographer" | "videographer";
  handedOverDate: string;
  assignedEditor: string;
  editStatus: "pending" | "in-progress" | "review" | "approved" | "delivered";
  editProgress: number;
  deliveryType: "photos" | "video" | "highlights" | "album";
  fileCount?: number;
  notes?: string;
}

export type PaymentType = "advance" | "milestone" | "final";
export type PaymentStatus = "pending" | "paid" | "overdue" | "partial";
export type PaymentMode = "upi" | "bank-transfer" | "cash" | "cheque" | "card";

export interface Payment {
  id: string;
  projectId: string;
  type: PaymentType;
  label: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  mode?: PaymentMode;
  notes?: string;
  invoiceNumber?: string;
}

export interface WeddingProject {
  id: string;
  clientName: string;
  partnerName: string;
  clientPhone: string;
  weddingDate: string;
  city: string;
  venue: string;
  status: "inquiry" | "booked" | "in-progress" | "editing" | "delivered" | "completed";
  package: string;
  totalAmount: number;
  paidAmount: number;
  subEvents: SubEvent[];
  footage: FootageItem[];
  payments: Payment[];
  team: TeamMember[];
  createdAt: string;
}

// Sample data
export const sampleTeamMembers: TeamMember[] = [];

export const sampleProjects: WeddingProject[] = [];
