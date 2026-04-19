import type { AppRole } from "@/contexts/RoleContext";
import {
  Camera, Video, Edit3, PhoneCall, Briefcase, Users, Calculator, UserCog,
} from "lucide-react";

export interface RoleStat {
  label: string;
  value: number;
  suffix?: string;
}

export interface RoleConfig {
  label: string;
  tagline: string;
  icon: typeof Camera;
  greeting: string;
  stats: RoleStat[];
  primaryMetric: { label: string; value: string; sub: string };
}

export const ROLE_CONFIG: Record<Exclude<AppRole, "admin">, RoleConfig> = {
  photographer: {
    label: "Photographer",
    tagline: "Capture the moment",
    icon: Camera,
    greeting: "Ready for today's shoot?",
    stats: [
      { label: "Shoots", value: 12 },
      { label: "Pending", value: 3 },
      { label: "Done", value: 9 },
    ],
    primaryMetric: { label: "This Month", value: "₹42K", sub: "earnings" },
  },
  videographer: {
    label: "Videographer",
    tagline: "Frame the story",
    icon: Video,
    greeting: "Lights, camera, action!",
    stats: [
      { label: "Reels", value: 8 },
      { label: "Editing", value: 4 },
      { label: "Delivered", value: 14 },
    ],
    primaryMetric: { label: "This Month", value: "₹38K", sub: "earnings" },
  },
  editor: {
    label: "Editor",
    tagline: "Polish to perfection",
    icon: Edit3,
    greeting: "Let's finish strong today.",
    stats: [
      { label: "Queue", value: 17 },
      { label: "Active", value: 5 },
      { label: "Approved", value: 22 },
    ],
    primaryMetric: { label: "This Month", value: "₹35K", sub: "completed" },
  },
  telecaller: {
    label: "Telecaller",
    tagline: "Convert every call",
    icon: PhoneCall,
    greeting: "Your leads are waiting.",
    stats: [
      { label: "Leads", value: 28 },
      { label: "Calls", value: 46 },
      { label: "Booked", value: 7 },
    ],
    primaryMetric: { label: "This Month", value: "₹18K", sub: "incentive" },
  },
  vendor: {
    label: "Vendor",
    tagline: "Deliver on time",
    icon: Briefcase,
    greeting: "Check your orders.",
    stats: [
      { label: "Orders", value: 9 },
      { label: "In transit", value: 3 },
      { label: "Paid", value: 14 },
    ],
    primaryMetric: { label: "Outstanding", value: "₹26K", sub: "pending" },
  },
  hr: {
    label: "HR",
    tagline: "People first",
    icon: UserCog,
    greeting: "Team is waiting on you.",
    stats: [
      { label: "Staff", value: 24 },
      { label: "Leaves", value: 4 },
      { label: "Present", value: 19 },
    ],
    primaryMetric: { label: "Attendance", value: "92%", sub: "this week" },
  },
  accounts: {
    label: "Accounts",
    tagline: "Books always balanced",
    icon: Calculator,
    greeting: "Reconcile & report.",
    stats: [
      { label: "Invoices", value: 32 },
      { label: "Pending", value: 6 },
      { label: "Paid", value: 26 },
    ],
    primaryMetric: { label: "Receivables", value: "₹2.4L", sub: "open" },
  },
};

export function getRoleConfig(role: AppRole): RoleConfig {
  if (role === "admin") return ROLE_CONFIG.photographer;
  return ROLE_CONFIG[role as Exclude<AppRole, "admin">] ?? ROLE_CONFIG.photographer;
}
