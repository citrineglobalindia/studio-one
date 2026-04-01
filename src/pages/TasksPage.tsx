import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, CheckCircle, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "review" | "done";
  dueDate: string;
  category: "editing" | "delivery" | "communication" | "admin" | "shoot-prep";
}

const sampleTasks: Task[] = [
  { id: "t1", title: "Edit Mehendi photos", project: "Priya & Rahul", assignee: "Priya Verma", priority: "high", status: "in-progress", dueDate: "2026-04-05", category: "editing" },
  { id: "t2", title: "Haldi video rough cut", project: "Priya & Rahul", assignee: "Neha Gupta", priority: "high", status: "in-progress", dueDate: "2026-04-04", category: "editing" },
  { id: "t3", title: "Send gallery link to Meera", project: "Meera & Aditya", assignee: "Amit Kumar", priority: "medium", status: "todo", dueDate: "2026-04-03", category: "delivery" },
  { id: "t4", title: "Confirm venue access for Sangeet", project: "Priya & Rahul", assignee: "Raj Patel", priority: "high", status: "done", dueDate: "2026-04-01", category: "shoot-prep" },
  { id: "t5", title: "Follow up on Sneha's inquiry", project: "Sneha & Rohan", assignee: "Amit Studio", priority: "medium", status: "todo", dueDate: "2026-04-02", category: "communication" },
  { id: "t6", title: "Wedding ceremony photos review", project: "Meera & Aditya", assignee: "Priya Verma", priority: "medium", status: "review", dueDate: "2026-04-06", category: "editing" },
  { id: "t7", title: "Update contract for Ananya", project: "Ananya & Vikram", assignee: "Amit Studio", priority: "low", status: "todo", dueDate: "2026-04-08", category: "admin" },
  { id: "t8", title: "Order album prints", project: "Kavya & Arjun", assignee: "Kiran Joshi", priority: "medium", status: "todo", dueDate: "2026-04-10", category: "delivery" },
  { id: "t9", title: "Reception highlights edit", project: "Meera & Aditya", assignee: "Suresh Nair", priority: "high", status: "todo", dueDate: "2026-04-07", category: "editing" },
  { id: "t10", title: "Pack gear for Jaipur wedding", project: "Ananya & Vikram", assignee: "Kiran Joshi", priority: "high", status: "todo", dueDate: "2026-04-25", category: "shoot-prep" },
];

const columns = [
  { key: "todo", label: "To Do", color: "text-muted-foreground" },
  { key: "in-progress", label: "In Progress", color: "text-blue-400" },
  { key: "review", label: "Review", color: "text-primary" },
  { key: "done", label: "Done", color: "text-emerald-400" },
];

const priorityStyle: Record<string, string> = {
  high: "bg-destructive/20 text-red-400 border-red-500/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(sampleTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDrop = (newStatus: string) => {
    if (!draggedTask) return;
    setTasks((prev) => prev.map((t) => t.id === draggedTask ? { ...t, status: newStatus as Task["status"] } : t));
    setDraggedTask(null);
  };

  const today = new Date("2026-04-01");

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">{tasks.filter((t) => t.status !== "done").length} pending · {tasks.filter((t) => t.priority === "high" && t.status !== "done").length} high priority</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Add Task</Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.key)}
                className="rounded-lg bg-muted/30 border border-border p-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  <span className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const isOverdue = new Date(task.dueDate) < today && task.status !== "done";
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedTask(task.id)}
                        className="rounded-md bg-card border border-border p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                          <Badge variant="outline" className={priorityStyle[task.priority] + " text-[9px] ml-2 shrink-0"}>{task.priority}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{task.project}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">{task.assignee.split(" ")[0]}</span>
                          </div>
                          <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-muted-foreground"}`}>
                            {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                            <span>{task.dueDate.slice(5)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
