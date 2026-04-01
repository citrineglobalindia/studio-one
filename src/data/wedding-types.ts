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
  team: TeamMember[];
  createdAt: string;
}

// Sample data
export const sampleTeamMembers: TeamMember[] = [
  { id: "t1", name: "Raj Patel", role: "photographer", type: "in-office", phone: "+91 98765 43210" },
  { id: "t2", name: "Vikram Singh", role: "photographer", type: "in-office", phone: "+91 98765 43211" },
  { id: "t3", name: "Amit Kumar", role: "videographer", type: "in-office", phone: "+91 98765 43212" },
  { id: "t4", name: "Deepak Sharma", role: "videographer", type: "vendor", phone: "+91 98765 43213" },
  { id: "t5", name: "Priya Verma", role: "editor", type: "in-office", phone: "+91 98765 43214" },
  { id: "t6", name: "Neha Gupta", role: "editor", type: "in-office", phone: "+91 98765 43215" },
  { id: "t7", name: "Arjun Reddy", role: "drone-operator", type: "vendor", phone: "+91 98765 43216" },
  { id: "t8", name: "Kiran Joshi", role: "assistant", type: "in-office", phone: "+91 98765 43217" },
  { id: "t9", name: "Suresh Nair", role: "editor", type: "vendor", phone: "+91 98765 43218" },
  { id: "t10", name: "Manish Tiwari", role: "photographer", type: "vendor", phone: "+91 98765 43219" },
];

export const sampleProjects: WeddingProject[] = [
  {
    id: "p1",
    clientName: "Priya Sharma",
    partnerName: "Rahul Kapoor",
    clientPhone: "+91 99887 76655",
    weddingDate: "2026-04-15",
    city: "Delhi",
    venue: "Taj Palace, New Delhi",
    status: "in-progress",
    package: "Royal Wedding Package",
    totalAmount: 350000,
    paidAmount: 200000,
    subEvents: [
      { id: "se1", name: "Mehendi", date: "2026-04-13", location: "Home - Dwarka", status: "completed", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[2]] },
      { id: "se2", name: "Haldi", date: "2026-04-14", location: "Farmhouse, Chattarpur", status: "completed", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[2], sampleTeamMembers[7]] },
      { id: "se3", name: "Sangeet", date: "2026-04-14", location: "Taj Palace, Banquet Hall", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[6]] },
      { id: "se4", name: "Wedding Ceremony", date: "2026-04-15", location: "Taj Palace, Grand Lawn", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3], sampleTeamMembers[6], sampleTeamMembers[7]] },
      { id: "se5", name: "Reception", date: "2026-04-16", location: "Taj Palace, Crystal Hall", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[2]] },
    ],
    footage: [
      { id: "f1", subEventId: "se1", subEventName: "Mehendi", handedOverBy: "Raj Patel", handedOverByRole: "photographer", handedOverDate: "2026-04-13", assignedEditor: "Priya Verma", editStatus: "approved", editProgress: 100, deliveryType: "photos", fileCount: 245 },
      { id: "f2", subEventId: "se1", subEventName: "Mehendi", handedOverBy: "Amit Kumar", handedOverByRole: "videographer", handedOverDate: "2026-04-13", assignedEditor: "Neha Gupta", editStatus: "in-progress", editProgress: 60, deliveryType: "video", fileCount: 12 },
      { id: "f3", subEventId: "se2", subEventName: "Haldi", handedOverBy: "Raj Patel", handedOverByRole: "photographer", handedOverDate: "2026-04-14", assignedEditor: "Priya Verma", editStatus: "in-progress", editProgress: 35, deliveryType: "photos", fileCount: 320 },
      { id: "f4", subEventId: "se2", subEventName: "Haldi", handedOverBy: "Amit Kumar", handedOverByRole: "videographer", handedOverDate: "2026-04-14", assignedEditor: "Suresh Nair", editStatus: "pending", editProgress: 0, deliveryType: "video", fileCount: 18 },
    ],
    team: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3], sampleTeamMembers[4], sampleTeamMembers[5], sampleTeamMembers[6], sampleTeamMembers[7]],
    createdAt: "2026-03-01",
  },
  {
    id: "p2",
    clientName: "Ananya Desai",
    partnerName: "Vikram Malhotra",
    clientPhone: "+91 88776 65544",
    weddingDate: "2026-04-28",
    city: "Jaipur",
    venue: "Jai Mahal Palace, Jaipur",
    status: "booked",
    package: "Premium Wedding Package",
    totalAmount: 250000,
    paidAmount: 100000,
    subEvents: [
      { id: "se6", name: "Mehendi", date: "2026-04-26", location: "Hotel Lobby", status: "upcoming", assignedTeam: [sampleTeamMembers[1], sampleTeamMembers[3]] },
      { id: "se7", name: "Sangeet & Cocktail", date: "2026-04-27", location: "Poolside, Jai Mahal", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[6]] },
      { id: "se8", name: "Wedding", date: "2026-04-28", location: "Grand Lawn, Jai Mahal", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3], sampleTeamMembers[6], sampleTeamMembers[7]] },
      { id: "se9", name: "Reception", date: "2026-04-28", location: "Banquet Hall", status: "upcoming", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[2]] },
    ],
    footage: [],
    team: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3], sampleTeamMembers[6], sampleTeamMembers[7]],
    createdAt: "2026-03-10",
  },
  {
    id: "p3",
    clientName: "Meera Iyer",
    partnerName: "Aditya Nair",
    clientPhone: "+91 77665 54433",
    weddingDate: "2026-03-20",
    city: "Mumbai",
    venue: "The Leela, Mumbai",
    status: "editing",
    package: "Gold Wedding Package",
    totalAmount: 180000,
    paidAmount: 180000,
    subEvents: [
      { id: "se10", name: "Haldi", date: "2026-03-19", location: "Home", status: "completed", assignedTeam: [sampleTeamMembers[1], sampleTeamMembers[3]] },
      { id: "se11", name: "Wedding", date: "2026-03-20", location: "The Leela Ballroom", status: "completed", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3]] },
      { id: "se12", name: "Reception", date: "2026-03-20", location: "The Leela Terrace", status: "completed", assignedTeam: [sampleTeamMembers[0], sampleTeamMembers[2]] },
    ],
    footage: [
      { id: "f5", subEventId: "se10", subEventName: "Haldi", handedOverBy: "Vikram Singh", handedOverByRole: "photographer", handedOverDate: "2026-03-19", assignedEditor: "Neha Gupta", editStatus: "approved", editProgress: 100, deliveryType: "photos", fileCount: 180 },
      { id: "f6", subEventId: "se11", subEventName: "Wedding", handedOverBy: "Raj Patel", handedOverByRole: "photographer", handedOverDate: "2026-03-21", assignedEditor: "Priya Verma", editStatus: "review", editProgress: 90, deliveryType: "photos", fileCount: 520 },
      { id: "f7", subEventId: "se11", subEventName: "Wedding", handedOverBy: "Amit Kumar", handedOverByRole: "videographer", handedOverDate: "2026-03-21", assignedEditor: "Suresh Nair", editStatus: "in-progress", editProgress: 45, deliveryType: "highlights", fileCount: 8 },
      { id: "f8", subEventId: "se12", subEventName: "Reception", handedOverBy: "Raj Patel", handedOverByRole: "photographer", handedOverDate: "2026-03-21", assignedEditor: "Neha Gupta", editStatus: "in-progress", editProgress: 30, deliveryType: "photos", fileCount: 290 },
      { id: "f9", subEventId: "se11", subEventName: "Wedding", handedOverBy: "Deepak Sharma", handedOverByRole: "videographer", handedOverDate: "2026-03-22", assignedEditor: "Suresh Nair", editStatus: "pending", editProgress: 0, deliveryType: "video", fileCount: 24 },
    ],
    team: [sampleTeamMembers[0], sampleTeamMembers[1], sampleTeamMembers[2], sampleTeamMembers[3], sampleTeamMembers[4], sampleTeamMembers[5], sampleTeamMembers[8]],
    createdAt: "2026-02-15",
  },
  {
    id: "p4",
    clientName: "Sneha Kapoor",
    partnerName: "Rohan Jain",
    clientPhone: "+91 66554 43322",
    weddingDate: "2026-05-10",
    city: "Udaipur",
    venue: "Oberoi Udaivilas",
    status: "inquiry",
    package: "Destination Wedding",
    totalAmount: 500000,
    paidAmount: 0,
    subEvents: [],
    footage: [],
    team: [],
    createdAt: "2026-03-28",
  },
];
