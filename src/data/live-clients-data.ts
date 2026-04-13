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

export const sampleLiveClients: LiveClient[] = [
  {
    id: "lc1",
    name: "Rahul Sharma",
    partnerName: "Priya Patel",
    eventType: "Wedding",
    eventDate: "2026-03-15",
    deliveryDate: "2026-05-30",
    city: "Mumbai",
    phone: "+91 98765 43210",
    overallProgress: 72,
    status: "active",
    team: [
      { id: "t1", name: "Arjun Mehta", role: "Lead Photographer" },
      { id: "t2", name: "Sneha Rao", role: "Videographer" },
      { id: "t3", name: "Kiran Das", role: "Editor" },
      { id: "t4", name: "Ravi Kumar", role: "Album Designer" },
    ],
    deliverables: [
      { id: "d1", type: "Photos", label: "Edited Photos (800+)", status: "delivered", progress: 100, dueDate: "2026-04-01", deliveredDate: "2026-03-28", assignedTo: "Arjun Mehta" },
      { id: "d2", type: "Videos", label: "Cinematic Film", status: "in-progress", progress: 65, dueDate: "2026-04-20", reminderDate: "2026-04-18", assignedTo: "Sneha Rao" },
      { id: "d3", type: "Highlights", label: "Wedding Highlights Reel", status: "in-progress", progress: 80, dueDate: "2026-04-10", reminderDate: "2026-04-08", assignedTo: "Kiran Das" },
      { id: "d4", type: "Albums", label: "Flush Mount Album (40 pages)", status: "pending", progress: 0, dueDate: "2026-05-15", assignedTo: "Ravi Kumar" },
      { id: "d5", type: "Footage Copy", label: "Raw Footage Drive", status: "review", progress: 90, dueDate: "2026-04-05", reminderDate: "2026-04-04", assignedTo: "Sneha Rao" },
    ],
    financials: {
      estimatedAmount: 350000,
      invoicedAmount: 300000,
      paidAmount: 250000,
      pendingAmount: 50000,
      expenses: 85000,
      profit: 165000,
    },
    createdAt: "2026-01-10",
  },
  {
    id: "lc2",
    name: "Amit Verma",
    partnerName: "Neha Gupta",
    eventType: "Wedding",
    eventDate: "2026-02-20",
    deliveryDate: "2026-04-20",
    city: "Delhi",
    phone: "+91 87654 32109",
    overallProgress: 100,
    status: "completed",
    team: [
      { id: "t5", name: "Arjun Mehta", role: "Lead Photographer" },
      { id: "t6", name: "Pooja Nair", role: "Second Shooter" },
      { id: "t7", name: "Kiran Das", role: "Editor" },
    ],
    deliverables: [
      { id: "d6", type: "Photos", label: "Edited Photos (600+)", status: "delivered", progress: 100, dueDate: "2026-03-10", deliveredDate: "2026-03-08", assignedTo: "Arjun Mehta" },
      { id: "d7", type: "Videos", label: "Full Wedding Film", status: "delivered", progress: 100, dueDate: "2026-03-25", deliveredDate: "2026-03-22", assignedTo: "Kiran Das" },
      { id: "d8", type: "Highlights", label: "Highlight Reel", status: "delivered", progress: 100, dueDate: "2026-03-15", deliveredDate: "2026-03-14", assignedTo: "Kiran Das" },
      { id: "d9", type: "Albums", label: "Coffee Table Book", status: "delivered", progress: 100, dueDate: "2026-04-15", deliveredDate: "2026-04-10", assignedTo: "Pooja Nair" },
    ],
    financials: {
      estimatedAmount: 280000,
      invoicedAmount: 280000,
      paidAmount: 280000,
      pendingAmount: 0,
      expenses: 62000,
      profit: 218000,
    },
    createdAt: "2025-12-05",
  },
  {
    id: "lc3",
    name: "Vikram Singh",
    partnerName: "Ananya Roy",
    eventType: "Pre-Wedding + Wedding",
    eventDate: "2026-04-25",
    deliveryDate: "2026-07-15",
    city: "Jaipur",
    phone: "+91 76543 21098",
    overallProgress: 35,
    status: "active",
    team: [
      { id: "t8", name: "Sneha Rao", role: "Videographer" },
      { id: "t9", name: "Arjun Mehta", role: "Photographer" },
      { id: "t10", name: "Divya Sharma", role: "Drone Operator" },
    ],
    deliverables: [
      { id: "d10", type: "Photos", label: "Pre-Wedding Shoot", status: "delivered", progress: 100, dueDate: "2026-04-01", deliveredDate: "2026-03-30", assignedTo: "Arjun Mehta" },
      { id: "d11", type: "Videos", label: "Pre-Wedding Film", status: "in-progress", progress: 45, dueDate: "2026-04-15", reminderDate: "2026-04-13", assignedTo: "Sneha Rao" },
      { id: "d12", type: "Photos", label: "Wedding Day Photos", status: "pending", progress: 0, dueDate: "2026-05-15", assignedTo: "Arjun Mehta" },
      { id: "d13", type: "Videos", label: "Wedding Cinematic Film", status: "pending", progress: 0, dueDate: "2026-06-01", assignedTo: "Sneha Rao" },
      { id: "d14", type: "Highlights", label: "Combined Highlight Reel", status: "pending", progress: 0, dueDate: "2026-05-20", assignedTo: "Sneha Rao" },
      { id: "d15", type: "Footage Copy", label: "Full Raw Footage", status: "pending", progress: 0, dueDate: "2026-06-10", assignedTo: "Divya Sharma" },
    ],
    financials: {
      estimatedAmount: 500000,
      invoicedAmount: 250000,
      paidAmount: 200000,
      pendingAmount: 50000,
      expenses: 45000,
      profit: 155000,
    },
    createdAt: "2026-02-15",
  },
  {
    id: "lc4",
    name: "Rohan Kapoor",
    partnerName: "Ishita Jain",
    eventType: "Destination Wedding",
    eventDate: "2026-05-10",
    deliveryDate: "2026-09-01",
    city: "Udaipur",
    phone: "+91 65432 10987",
    overallProgress: 15,
    status: "on-hold",
    team: [
      { id: "t11", name: "Arjun Mehta", role: "Lead Photographer" },
      { id: "t12", name: "Sneha Rao", role: "Lead Videographer" },
    ],
    deliverables: [
      { id: "d16", type: "Photos", label: "Wedding Photos (1000+)", status: "pending", progress: 0, dueDate: "2026-06-15", assignedTo: "Arjun Mehta" },
      { id: "d17", type: "Videos", label: "Destination Film", status: "pending", progress: 0, dueDate: "2026-07-01", assignedTo: "Sneha Rao" },
      { id: "d18", type: "Highlights", label: "Teaser + Highlights", status: "in-progress", progress: 30, dueDate: "2026-05-25", reminderDate: "2026-05-23", assignedTo: "Sneha Rao" },
      { id: "d19", type: "Albums", label: "Premium Album (60 pages)", status: "pending", progress: 0, dueDate: "2026-08-01", assignedTo: "Arjun Mehta" },
    ],
    financials: {
      estimatedAmount: 750000,
      invoicedAmount: 375000,
      paidAmount: 200000,
      pendingAmount: 175000,
      expenses: 120000,
      profit: 80000,
    },
    createdAt: "2026-03-01",
  },
  {
    id: "lc5",
    name: "Siddharth Malhotra",
    partnerName: "Kavya Reddy",
    eventType: "Wedding",
    eventDate: "2026-01-28",
    deliveryDate: "2026-04-30",
    city: "Hyderabad",
    phone: "+91 54321 09876",
    overallProgress: 95,
    status: "active",
    team: [
      { id: "t13", name: "Pooja Nair", role: "Photographer" },
      { id: "t14", name: "Kiran Das", role: "Editor" },
      { id: "t15", name: "Ravi Kumar", role: "Album Designer" },
    ],
    deliverables: [
      { id: "d20", type: "Photos", label: "All Edited Photos", status: "delivered", progress: 100, dueDate: "2026-02-28", deliveredDate: "2026-02-25", assignedTo: "Pooja Nair" },
      { id: "d21", type: "Videos", label: "Wedding Film", status: "delivered", progress: 100, dueDate: "2026-03-15", deliveredDate: "2026-03-12", assignedTo: "Kiran Das" },
      { id: "d22", type: "Highlights", label: "Highlight Reel", status: "delivered", progress: 100, dueDate: "2026-02-15", deliveredDate: "2026-02-14", assignedTo: "Kiran Das" },
      { id: "d23", type: "Albums", label: "Flush Mount Album", status: "in-progress", progress: 75, dueDate: "2026-04-15", reminderDate: "2026-04-12", assignedTo: "Ravi Kumar" },
      { id: "d24", type: "Footage Copy", label: "Raw Footage HDD", status: "delivered", progress: 100, dueDate: "2026-03-01", deliveredDate: "2026-02-28", assignedTo: "Pooja Nair" },
    ],
    financials: {
      estimatedAmount: 320000,
      invoicedAmount: 320000,
      paidAmount: 290000,
      pendingAmount: 30000,
      expenses: 70000,
      profit: 220000,
    },
    createdAt: "2025-11-15",
  },
];

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
