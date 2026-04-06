import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, CheckCircle2, Clock, AlertTriangle, User, Calendar,
  Search, Filter, BarChart3, ListTodo, LayoutGrid, GripVertical,
  ChevronDown, ChevronRight, Pencil, Trash2, X, Check,
  CircleDot, ArrowUp, ArrowRight, ArrowDown, Eye, MessageSquare,
  UserCheck, Users, Send, Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRole, AppRole } from "@/contexts/RoleContext";

interface TeamMember {
  id: string;
  name: string;
  role: AppRole;
  avatar?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: AppRole;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "review" | "done";
  dueDate: string;
  category: "editing" | "delivery" | "communication" | "admin" | "shoot-prep";
  progress: number;
  comments: Comment[];
  subtasks: Subtask[];
  createdAt: string;
  assignedBy: string;
  assignedAt: string;
}

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

const teamMembers: TeamMember[] = [
  { id: "tm1", name: "Priya Verma", role: "editor" },
  { id: "tm2", name: "Neha Gupta", role: "editor" },
  { id: "tm3", name: "Amit Kumar", role: "photographer" },
  { id: "tm4", name: "Raj Patel", role: "videographer" },
  { id: "tm5", name: "Kiran Joshi", role: "photographer" },
  { id: "tm6", name: "Suresh Nair", role: "editor" },
  { id: "tm7", name: "Anjali Sharma", role: "telecaller" },
  { id: "tm8", name: "Deepak Rao", role: "videographer" },
];

const roleColors: Record<AppRole, string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  editor: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  photographer: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  videographer: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  telecaller: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  vendor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  hr: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  accounts: "bg-teal-500/10 text-teal-500 border-teal-500/20",
};

const sampleTasks: Task[] = [
  {
    id: "t1", title: "Edit Mehendi photos", description: "Cull and edit 500+ photos from the Mehendi ceremony. Apply consistent color grading.", project: "Priya & Rahul", assigneeId: "tm1", assigneeName: "Priya Verma", assigneeRole: "editor", priority: "high", status: "in-progress", dueDate: "2026-04-05", category: "editing", progress: 65, createdAt: "2026-03-28", assignedBy: "Admin", assignedAt: "2026-03-28",
    subtasks: [{ id: "s1", title: "Cull photos", done: true }, { id: "s2", title: "Color grading", done: true }, { id: "s3", title: "Retouching", done: false }, { id: "s4", title: "Export & upload", done: false }],
    comments: [{ id: "c1", author: "Priya Verma", text: "Color grading done, starting retouching now.", date: "2026-04-02" }],
  },
  {
    id: "t2", title: "Haldi video rough cut", description: "Create first rough cut of Haldi ceremony video with background music.", project: "Priya & Rahul", assigneeId: "tm2", assigneeName: "Neha Gupta", assigneeRole: "editor", priority: "high", status: "in-progress", dueDate: "2026-04-04", category: "editing", progress: 40, createdAt: "2026-03-29", assignedBy: "Admin", assignedAt: "2026-03-29",
    subtasks: [{ id: "s5", title: "Footage sync", done: true }, { id: "s6", title: "Rough cut", done: false }, { id: "s7", title: "Add music", done: false }],
    comments: [{ id: "c2", author: "Neha Gupta", text: "Footage synced. Working on timeline.", date: "2026-04-01" }],
  },
  {
    id: "t3", title: "Send gallery link to Meera", description: "Upload final gallery and share the link with the client for review.", project: "Meera & Aditya", assigneeId: "tm3", assigneeName: "Amit Kumar", assigneeRole: "photographer", priority: "medium", status: "todo", dueDate: "2026-04-03", category: "delivery", progress: 0, createdAt: "2026-03-30", assignedBy: "Admin", assignedAt: "2026-03-30",
    subtasks: [{ id: "s8", title: "Upload to gallery", done: false }, { id: "s9", title: "Send email", done: false }],
    comments: [],
  },
  {
    id: "t4", title: "Confirm venue access for Sangeet", description: "Contact venue manager and confirm entry for equipment setup.", project: "Priya & Rahul", assigneeId: "tm4", assigneeName: "Raj Patel", assigneeRole: "videographer", priority: "high", status: "done", dueDate: "2026-04-01", category: "shoot-prep", progress: 100, createdAt: "2026-03-25", assignedBy: "Admin", assignedAt: "2026-03-25",
    subtasks: [{ id: "s10", title: "Call venue", done: true }, { id: "s11", title: "Get permission letter", done: true }],
    comments: [{ id: "c3", author: "Raj Patel", text: "Venue confirmed. Entry from 2 PM.", date: "2026-03-31" }],
  },
  {
    id: "t5", title: "Follow up on Sneha's inquiry", description: "Reach out regarding wedding photography package inquiry.", project: "Sneha & Rohan", assigneeId: "tm7", assigneeName: "Anjali Sharma", assigneeRole: "telecaller", priority: "medium", status: "todo", dueDate: "2026-04-02", category: "communication", progress: 0, createdAt: "2026-03-28", assignedBy: "Admin", assignedAt: "2026-03-28",
    subtasks: [{ id: "s12", title: "Call client", done: false }, { id: "s13", title: "Send quotation", done: false }],
    comments: [],
  },
  {
    id: "t6", title: "Wedding ceremony photos review", description: "Review all ceremony shots and shortlist the best 200 for album.", project: "Meera & Aditya", assigneeId: "tm1", assigneeName: "Priya Verma", assigneeRole: "editor", priority: "medium", status: "review", dueDate: "2026-04-06", category: "editing", progress: 85, createdAt: "2026-03-27", assignedBy: "Admin", assignedAt: "2026-03-27",
    subtasks: [{ id: "s14", title: "Shortlist photos", done: true }, { id: "s15", title: "Client review", done: false }],
    comments: [{ id: "c4", author: "Priya Verma", text: "Shortlisted 220 photos. Waiting for client feedback.", date: "2026-04-03" }],
  },
  {
    id: "t7", title: "Update contract for Ananya", description: "Revise the contract with updated package details and payment terms.", project: "Ananya & Vikram", assigneeId: "tm7", assigneeName: "Anjali Sharma", assigneeRole: "telecaller", priority: "low", status: "todo", dueDate: "2026-04-08", category: "admin", progress: 0, createdAt: "2026-03-30", assignedBy: "Admin", assignedAt: "2026-03-30",
    subtasks: [{ id: "s16", title: "Draft contract", done: false }, { id: "s17", title: "Legal review", done: false }, { id: "s18", title: "Send to client", done: false }],
    comments: [],
  },
  {
    id: "t8", title: "Order album prints", description: "Place order for 12x36 album prints with the printing vendor.", project: "Kavya & Arjun", assigneeId: "tm5", assigneeName: "Kiran Joshi", assigneeRole: "photographer", priority: "medium", status: "todo", dueDate: "2026-04-10", category: "delivery", progress: 0, createdAt: "2026-04-01", assignedBy: "Admin", assignedAt: "2026-04-01",
    subtasks: [{ id: "s19", title: "Finalize layout", done: false }, { id: "s20", title: "Place order", done: false }],
    comments: [],
  },
  {
    id: "t9", title: "Reception highlights edit", description: "Create a 5-min highlight reel from the reception footage.", project: "Meera & Aditya", assigneeId: "tm6", assigneeName: "Suresh Nair", assigneeRole: "editor", priority: "high", status: "review", dueDate: "2026-04-07", category: "editing", progress: 90, createdAt: "2026-03-26", assignedBy: "Admin", assignedAt: "2026-03-26",
    subtasks: [{ id: "s21", title: "Select clips", done: true }, { id: "s22", title: "Edit timeline", done: true }, { id: "s23", title: "Color grade", done: true }, { id: "s24", title: "Final export", done: false }],
    comments: [{ id: "c5", author: "Suresh Nair", text: "Almost done. Final color pass remaining.", date: "2026-04-04" }],
  },
  {
    id: "t10", title: "Pack gear for Jaipur wedding", description: "Prepare all camera bodies, lenses, lighting, and backup equipment.", project: "Ananya & Vikram", assigneeId: "tm5", assigneeName: "Kiran Joshi", assigneeRole: "photographer", priority: "high", status: "todo", dueDate: "2026-04-25", category: "shoot-prep", progress: 0, createdAt: "2026-04-01", assignedBy: "Admin", assignedAt: "2026-04-01",
    subtasks: [{ id: "s25", title: "Check camera bodies", done: false }, { id: "s26", title: "Pack lenses", done: false }, { id: "s27", title: "Charge batteries", done: false }, { id: "s28", title: "Backup cards", done: false }],
    comments: [],
  },
];

const columns = [
  { key: "todo", label: "To Do", icon: ListTodo, color: "text-muted-foreground", bg: "bg-muted/50" },
  { key: "in-progress", label: "In Progress", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/5" },
  { key: "review", label: "Review", icon: Eye, color: "text-amber-500", bg: "bg-amber-500/5" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/5" },
];

const priorityConfig = {
  high: { icon: ArrowUp, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", label: "High" },
  medium: { icon: ArrowRight, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", label: "Low" },
};

const categoryConfig: Record<string, { emoji: string; label: string }> = {
  editing: { emoji: "🎨", label: "Editing" },
  delivery: { emoji: "📦", label: "Delivery" },
  communication: { emoji: "💬", label: "Communication" },
  admin: { emoji: "📋", label: "Admin" },
  "shoot-prep": { emoji: "📸", label: "Shoot Prep" },
};

export default function TasksPage() {
  const { currentRole, isAdmin } = useRole();
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [activeTab, setActiveTab] = useState("all");
  const [detailSheet, setDetailSheet] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addSheet, setAddSheet] = useState(false);
  const [assignSheet, setAssignSheet] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const [newTask, setNewTask] = useState({
    title: "", description: "", project: "", assigneeId: "", priority: "medium" as Task["priority"],
    category: "editing" as Task["category"], dueDate: "",
  });

  const today = new Date("2026-04-06");

  // For non-admin roles, simulate "current user" as first team member with that role
  const currentUserMember = useMemo(() => {
    if (isAdmin) return null;
    return teamMembers.find(m => m.role === currentRole) || null;
  }, [currentRole, isAdmin]);

  // Role-based filtering: non-admin sees only their assigned tasks
  const roleTasks = useMemo(() => {
    if (isAdmin) return tasks;
    if (!currentUserMember) return tasks.filter(t => t.assigneeRole === currentRole);
    return tasks.filter(t => t.assigneeId === currentUserMember.id);
  }, [tasks, isAdmin, currentRole, currentUserMember]);

  const filtered = useMemo(() => {
    let list = roleTasks;
    // Tab filter
    if (activeTab === "my-tasks" && isAdmin) {
      // Admin viewing tasks they assigned
    } else if (activeTab === "unassigned") {
      list = list.filter(t => !t.assigneeId);
    } else if (activeTab === "editors") {
      list = list.filter(t => t.assigneeRole === "editor");
    } else if (activeTab === "photographers") {
      list = list.filter(t => t.assigneeRole === "photographer");
    } else if (activeTab === "videographers") {
      list = list.filter(t => t.assigneeRole === "videographer");
    }

    return list.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.project.toLowerCase().includes(search.toLowerCase()) ||
        t.assigneeName.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      const matchCategory = filterCategory === "all" || t.category === filterCategory;
      const matchAssignee = filterAssignee === "all" || t.assigneeId === filterAssignee;
      const matchRole = filterRole === "all" || t.assigneeRole === filterRole;
      return matchSearch && matchPriority && matchCategory && matchAssignee && matchRole;
    });
  }, [roleTasks, search, filterPriority, filterCategory, filterAssignee, filterRole, activeTab, isAdmin]);

  const stats = useMemo(() => {
    const list = roleTasks;
    const total = list.length;
    const done = list.filter(t => t.status === "done").length;
    const overdue = list.filter(t => new Date(t.dueDate) < today && t.status !== "done").length;
    const highPriority = list.filter(t => t.priority === "high" && t.status !== "done").length;
    const avgProgress = total > 0 ? Math.round(list.reduce((sum, t) => sum + t.progress, 0) / total) : 0;
    const editorTasks = list.filter(t => t.assigneeRole === "editor").length;
    const photographerTasks = list.filter(t => t.assigneeRole === "photographer").length;
    const videographerTasks = list.filter(t => t.assigneeRole === "videographer").length;
    return { total, done, overdue, highPriority, avgProgress, completionRate: total > 0 ? Math.round((done / total) * 100) : 0, editorTasks, photographerTasks, videographerTasks };
  }, [roleTasks]);

  // Workload per member
  const workload = useMemo(() => {
    const map: Record<string, { member: TeamMember; total: number; inProgress: number; done: number; overdue: number }> = {};
    teamMembers.forEach(m => { map[m.id] = { member: m, total: 0, inProgress: 0, done: 0, overdue: 0 }; });
    tasks.forEach(t => {
      if (map[t.assigneeId]) {
        map[t.assigneeId].total++;
        if (t.status === "in-progress") map[t.assigneeId].inProgress++;
        if (t.status === "done") map[t.assigneeId].done++;
        if (new Date(t.dueDate) < today && t.status !== "done") map[t.assigneeId].overdue++;
      }
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tasks]);

  const handleDrop = (newStatus: string) => {
    if (!draggedTask) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== draggedTask) return t;
      const progress = newStatus === "done" ? 100 : newStatus === "review" ? Math.max(t.progress, 80) : t.progress;
      return { ...t, status: newStatus as Task["status"], progress };
    }));
    setDraggedTask(null);
  };

  const openDetail = (task: Task) => { setSelectedTask(task); setDetailSheet(true); };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const subtasks = t.subtasks.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
      const doneCount = subtasks.filter(s => s.done).length;
      const progress = Math.round((doneCount / subtasks.length) * 100);
      const updated = { ...t, subtasks, progress };
      if (selectedTask?.id === taskId) setSelectedTask(updated);
      return updated;
    }));
  };

  const addComment = () => {
    if (!selectedTask || !newComment.trim()) return;
    const author = isAdmin ? "Admin" : currentUserMember?.name || currentRole;
    const comment: Comment = { id: `c${Date.now()}`, author, text: newComment.trim(), date: new Date().toISOString().slice(0, 10) };
    setTasks(prev => prev.map(t => {
      if (t.id !== selectedTask.id) return t;
      const updated = { ...t, comments: [...t.comments, comment] };
      setSelectedTask(updated);
      return updated;
    }));
    setNewComment("");
    toast.success("Comment added");
  };

  const changeStatus = (taskId: string, status: Task["status"]) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const progress = status === "done" ? 100 : status === "review" ? Math.max(t.progress, 80) : t.progress;
      const updated = { ...t, status, progress };
      if (selectedTask?.id === taskId) setSelectedTask(updated);
      return updated;
    }));
    toast.success(`Task moved to ${status}`);
  };

  const reassignTask = (taskId: string, memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updated = { ...t, assigneeId: member.id, assigneeName: member.name, assigneeRole: member.role, assignedAt: new Date().toISOString().slice(0, 10), assignedBy: "Admin" };
      if (selectedTask?.id === taskId) setSelectedTask(updated);
      return updated;
    }));
    toast.success(`Task reassigned to ${member.name}`);
    setAssignSheet(false);
    setReassignTaskId(null);
  };

  const createTask = () => {
    if (!newTask.title.trim()) { toast.error("Title is required"); return; }
    const member = teamMembers.find(m => m.id === newTask.assigneeId);
    const task: Task = {
      id: `t${Date.now()}`, title: newTask.title, description: newTask.description, project: newTask.project,
      assigneeId: member?.id || "", assigneeName: member?.name || "Unassigned", assigneeRole: member?.role || "admin",
      priority: newTask.priority, category: newTask.category, dueDate: newTask.dueDate,
      status: "todo", progress: 0, subtasks: [], comments: [],
      createdAt: new Date().toISOString().slice(0, 10),
      assignedBy: "Admin", assignedAt: new Date().toISOString().slice(0, 10),
    };
    setTasks(prev => [task, ...prev]);
    setAddSheet(false);
    setNewTask({ title: "", description: "", project: "", assigneeId: "", priority: "medium", category: "editing", dueDate: "" });
    toast.success("Task created & assigned");
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setDetailSheet(false);
    toast.success("Task deleted");
  };

  const openReassign = (taskId: string) => {
    setReassignTaskId(taskId);
    setAssignSheet(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {isAdmin ? <Shield className="h-5 w-5 text-primary" /> : <UserCheck className="h-5 w-5 text-primary" />}
            {isAdmin ? "Task Manager" : "My Tasks"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {!isAdmin && currentUserMember && <span className="text-primary font-medium">{currentUserMember.name} · </span>}
            {stats.total} tasks · {stats.done} completed
            {stats.overdue > 0 && <span className="text-red-500"> · {stats.overdue} overdue</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("board")} className={`p-2 ${viewMode === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}><ListTodo className="h-4 w-4" /></button>
          </div>
          {isAdmin && <Button onClick={() => setAddSheet(true)} className="gap-2"><Plus className="h-4 w-4" /> Assign Task</Button>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Overall Progress", value: `${stats.avgProgress}%`, sub: <Progress value={stats.avgProgress} className="h-1.5 mt-1" />, icon: BarChart3, color: "text-primary" },
          { label: "Completion Rate", value: `${stats.completionRate}%`, sub: `${stats.done}/${stats.total} done`, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Overdue", value: stats.overdue, sub: "Need attention", icon: AlertTriangle, color: "text-red-500" },
          ...(isAdmin ? [
            { label: "Editor Tasks", value: stats.editorTasks, sub: `${tasks.filter(t => t.assigneeRole === "editor" && t.status === "done").length} done`, icon: Pencil, color: "text-sky-500" },
            { label: "High Priority", value: stats.highPriority, sub: "Active tasks", icon: ArrowUp, color: "text-amber-500" },
          ] : [
            { label: "High Priority", value: stats.highPriority, sub: "Active tasks", icon: ArrowUp, color: "text-amber-500" },
            { label: "In Review", value: roleTasks.filter(t => t.status === "review").length, sub: "Awaiting approval", icon: Eye, color: "text-blue-500" },
          ]),
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              {typeof s.sub === "string" ? <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p> : <div className="mt-1">{s.sub}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin: Team Workload Overview */}
      {isAdmin && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-primary" /> Team Workload
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {workload.filter(w => w.total > 0).map(w => (
                <div key={w.member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {w.member.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{w.member.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[9px] ${roleColors[w.member.role]}`}>
                        {w.member.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{w.total} tasks</span>
                      <span>·</span>
                      <span className="text-blue-500">{w.inProgress} active</span>
                      {w.overdue > 0 && <><span>·</span><span className="text-red-500">{w.overdue} overdue</span></>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for role filtering (Admin only) */}
      {isAdmin && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto bg-muted/30">
            <TabsTrigger value="all" className="text-xs">All Tasks</TabsTrigger>
            <TabsTrigger value="editors" className="text-xs gap-1"><Pencil className="h-3 w-3" /> Editors</TabsTrigger>
            <TabsTrigger value="photographers" className="text-xs gap-1">📸 Photographers</TabsTrigger>
            <TabsTrigger value="videographers" className="text-xs gap-1">🎥 Videographers</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks, projects, assignees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="low">🔵 Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.emoji} {cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {teamMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Board View */}
      {viewMode === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = filtered.filter(t => t.status === col.key);
            return (
              <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.key)}
                className={`rounded-xl border border-border/50 p-3 min-h-[450px] ${col.bg}`}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <col.icon className={`h-4 w-4 ${col.color}`} />
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5">{colTasks.length}</Badge>
                </div>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {colTasks.map((task, i) => {
                      const isOverdue = new Date(task.dueDate) < today && task.status !== "done";
                      const PriorityIcon = priorityConfig[task.priority].icon;
                      return (
                        <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.02 }} draggable onDragStart={() => setDraggedTask(task.id)}
                          onClick={() => openDetail(task)}
                          className="rounded-lg bg-card border border-border p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 hover:shadow-sm transition-all group">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{categoryConfig[task.category]?.emoji}</span>
                              <span className="text-[10px] text-muted-foreground">{categoryConfig[task.category]?.label}</span>
                            </div>
                            <Badge variant="outline" className={`${priorityConfig[task.priority].bg} text-[9px] flex items-center gap-0.5`}>
                              <PriorityIcon className="h-2.5 w-2.5" />{task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug mb-1">{task.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">{task.project}</p>

                          <div className="mb-2">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span>Progress</span><span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-1.5" />
                          </div>

                          {task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks</span>
                            </div>
                          )}

                          {/* Assignee with role badge */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {task.assigneeName.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{task.assigneeName.split(" ")[0]}</span>
                              <Badge variant="outline" className={`text-[8px] px-1 py-0 ${roleColors[task.assigneeRole]}`}>
                                {task.assigneeRole}
                              </Badge>
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                              {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                              <span>{task.dueDate.slice(5)}</span>
                            </div>
                          </div>

                          {/* Reassign button for admin */}
                          {isAdmin && (
                            <div className="mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 w-full text-muted-foreground hover:text-primary"
                                onClick={(e) => { e.stopPropagation(); openReassign(task.id); }}>
                                <UserCheck className="h-3 w-3" /> Reassign
                              </Button>
                            </div>
                          )}

                          {task.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                              <MessageSquare className="h-3 w-3" /><span>{task.comments.length}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <Card className="border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Task</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Project</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Assignee</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Priority</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Progress</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Due</th>
                  {isAdmin && <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => {
                  const isOverdue = new Date(task.dueDate) < today && task.status !== "done";
                  const PriorityIcon = priorityConfig[task.priority].icon;
                  return (
                    <tr key={task.id} onClick={() => openDetail(task)}
                      className="border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span>{categoryConfig[task.category]?.emoji}</span>
                          <span className="font-medium text-foreground">{task.title}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{task.project}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {task.assigneeName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground text-xs">{task.assigneeName}</span>
                        </div>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <Badge variant="outline" className={`text-[10px] ${roleColors[task.assigneeRole]}`}>
                          {task.assigneeRole}
                        </Badge>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <Badge variant="outline" className={`${priorityConfig[task.priority].bg} text-[10px]`}>
                          <PriorityIcon className="h-2.5 w-2.5 mr-0.5" />{task.priority}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-[10px] ${
                          task.status === "done" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          task.status === "review" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          task.status === "in-progress" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          "bg-muted text-muted-foreground border-border"
                        }`}>
                          {columns.find(c => c.key === task.status)?.label}
                        </Badge>
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={task.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
                        </div>
                      </td>
                      <td className={`p-3 hidden md:table-cell ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                        {isOverdue && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                        {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      {isAdmin && (
                        <td className="p-3">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                            onClick={(e) => { e.stopPropagation(); openReassign(task.id); }}>
                            <UserCheck className="h-3 w-3" /> Reassign
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Task Detail Sheet */}
      <Sheet open={detailSheet} onOpenChange={setDetailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-lg pr-4">{selectedTask.title}</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Status & Priority & Role */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={priorityConfig[selectedTask.priority].bg}>
                    {React.createElement(priorityConfig[selectedTask.priority].icon, { className: "h-3 w-3 mr-1" })}
                    {selectedTask.priority} priority
                  </Badge>
                  <Badge variant="outline" className={`${
                    selectedTask.status === "done" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                    selectedTask.status === "review" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                    selectedTask.status === "in-progress" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-muted text-muted-foreground border-border"
                  }`}>
                    {columns.find(c => c.key === selectedTask.status)?.label}
                  </Badge>
                  <Badge variant="outline" className="bg-muted/50">
                    {categoryConfig[selectedTask.category]?.emoji} {categoryConfig[selectedTask.category]?.label}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>

                {/* Assignment Info */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5" /> Assignment Details
                    </h4>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {selectedTask.assigneeName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{selectedTask.assigneeName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[10px] ${roleColors[selectedTask.assigneeRole]}`}>
                            {selectedTask.assigneeRole}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">Assigned by {selectedTask.assignedBy} · {selectedTask.assignedAt}</span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full"
                        onClick={() => openReassign(selectedTask.id)}>
                        <UserCheck className="h-3.5 w-3.5" /> Reassign Task
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Project", value: selectedTask.project },
                    { label: "Due Date", value: new Date(selectedTask.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                  ].map(m => (
                    <div key={m.label} className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">Progress</p>
                    <span className="text-sm font-bold text-primary">{selectedTask.progress}%</span>
                  </div>
                  <Progress value={selectedTask.progress} className="h-2" />
                </div>

                {/* Subtasks */}
                {selectedTask.subtasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Subtasks ({selectedTask.subtasks.filter(s => s.done).length}/{selectedTask.subtasks.length})
                    </p>
                    <div className="space-y-1.5">
                      {selectedTask.subtasks.map(subtask => (
                        <div key={subtask.id}
                          onClick={() => toggleSubtask(selectedTask.id, subtask.id)}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            subtask.done ? "bg-emerald-500/5 border-emerald-500/20" : "border-border/50 hover:bg-muted/30"
                          }`}>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            subtask.done ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"
                          }`}>
                            {subtask.done && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={`text-sm ${subtask.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Actions */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Move to</p>
                  <div className="flex flex-wrap gap-2">
                    {columns.filter(c => c.key !== selectedTask.status).map(col => (
                      <Button key={col.key} size="sm" variant="outline"
                        onClick={() => changeStatus(selectedTask.id, col.key as Task["status"])}
                        className="gap-1.5 text-xs">
                        <col.icon className={`h-3 w-3 ${col.color}`} />{col.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Comments */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Comments ({selectedTask.comments.length})
                  </p>
                  {selectedTask.comments.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {selectedTask.comments.map(c => (
                        <div key={c.id} className="flex gap-3">
                          <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                              {c.author.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-foreground">{c.author}</span>
                              <span className="text-[10px] text-muted-foreground">{c.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Textarea placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} className="min-h-[60px] text-sm" />
                  </div>
                  <Button size="sm" className="mt-2 gap-1.5" onClick={addComment} disabled={!newComment.trim()}>
                    <MessageSquare className="h-3.5 w-3.5" /> Post Comment
                  </Button>
                </div>

                <Separator />

                {isAdmin && (
                  <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => deleteTask(selectedTask.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete Task
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reassign Sheet */}
      <Sheet open={assignSheet} onOpenChange={setAssignSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Reassign Task
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {reassignTaskId && (
              <p className="text-sm text-muted-foreground mb-4">
                Select a team member to assign: <span className="font-medium text-foreground">{tasks.find(t => t.id === reassignTaskId)?.title}</span>
              </p>
            )}
            {/* Group by role */}
            {(["editor", "photographer", "videographer", "telecaller"] as AppRole[]).map(role => {
              const members = teamMembers.filter(m => m.role === role);
              if (members.length === 0) return null;
              const currentTask = tasks.find(t => t.id === reassignTaskId);
              return (
                <div key={role} className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Badge variant="outline" className={`text-[10px] ${roleColors[role]}`}>{role}</Badge>
                    <span>{members.length} members</span>
                  </h4>
                  <div className="space-y-1.5">
                    {members.map(m => {
                      const memberTasks = tasks.filter(t => t.assigneeId === m.id && t.status !== "done").length;
                      const isCurrentAssignee = currentTask?.assigneeId === m.id;
                      return (
                        <motion.div key={m.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => !isCurrentAssignee && reassignTask(reassignTaskId!, m.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isCurrentAssignee ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 hover:bg-muted/30"
                          }`}>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {m.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{memberTasks} active tasks</p>
                          </div>
                          {isCurrentAssignee ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Current</Badge>
                          ) : (
                            <Send className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Task Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Create & Assign Task</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input className="mt-1" value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea className="mt-1 min-h-[80px]" value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Project</label>
                <Input className="mt-1" value={newTask.project} onChange={e => setNewTask(p => ({ ...p, project: e.target.value }))} placeholder="Project name" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Due Date</label>
                <Input className="mt-1" type="date" value={newTask.dueDate} onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>

            {/* Assign to team member with role info */}
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" /> Assign To *
              </label>
              <Select value={newTask.assigneeId} onValueChange={v => setNewTask(p => ({ ...p, assigneeId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select team member" /></SelectTrigger>
                <SelectContent>
                  {(["editor", "photographer", "videographer", "telecaller"] as AppRole[]).map(role => {
                    const members = teamMembers.filter(m => m.role === role);
                    if (members.length === 0) return null;
                    return (
                      <React.Fragment key={role}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                          {role}
                        </div>
                        {members.map(m => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="flex items-center gap-2">
                              {m.name}
                              <Badge variant="outline" className={`text-[8px] px-1 py-0 ${roleColors[m.role]}`}>{m.role}</Badge>
                            </span>
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </SelectContent>
              </Select>
              {newTask.assigneeId && (
                <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border/50 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                      {teamMembers.find(m => m.id === newTask.assigneeId)?.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-foreground">{teamMembers.find(m => m.id === newTask.assigneeId)?.name}</span>
                  <Badge variant="outline" className={`text-[8px] ml-auto ${roleColors[teamMembers.find(m => m.id === newTask.assigneeId)?.role || "admin"]}`}>
                    {teamMembers.find(m => m.id === newTask.assigneeId)?.role}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Priority</label>
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v as Task["priority"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={newTask.category} onValueChange={v => setNewTask(p => ({ ...p, category: v as Task["category"] }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([k, c]) => <SelectItem key={k} value={k}>{c.emoji} {c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full mt-4 gap-2" onClick={createTask}><Plus className="h-4 w-4" /> Create & Assign Task</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
