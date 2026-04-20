import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Loader2, Trash2, ListTodo, Clock, Eye, CheckCircle2, ArrowUp, ArrowRight, ArrowDown, Calendar, User,
} from "lucide-react";
import { format } from "date-fns";
import { useTasks, TaskStatus, TaskPriority } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const statusColumns: { key: TaskStatus; label: string; icon: any; color: string }[] = [
  { key: "todo", label: "To Do", icon: ListTodo, color: "text-muted-foreground" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-500" },
  { key: "review", label: "Review", icon: Eye, color: "text-amber-500" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "text-emerald-500" },
];

const priorityConfig: Record<TaskPriority, { icon: any; color: string; label: string }> = {
  high: { icon: ArrowUp, color: "text-red-500", label: "High" },
  medium: { icon: ArrowRight, color: "text-amber-500", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-500", label: "Low" },
};

export default function TasksPage() {
  const { tasks, isLoading, addTask, updateTask, deleteTask } = useTasks();
  const { projects = [] } = useProjects();
  const { members: teamMembers = [] } = useTeamMembers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_id: "",
    assignee_id: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    category: "general",
    due_date: "",
  });

  const handleCreate = async () => {
    if (!form.title) return;
    const assignee = (teamMembers as any[]).find(m => m.id === form.assignee_id);
    await addTask.mutateAsync({
      title: form.title,
      description: form.description || null,
      project_id: form.project_id || null,
      status: form.status,
      priority: form.priority,
      category: form.category,
      assignee_id: form.assignee_id || null,
      assignee_name: assignee?.full_name ?? null,
      assignee_role: assignee?.role ?? null,
      due_date: form.due_date || null,
      progress: 0,
      subtasks: [],
      comments: [],
    });
    setForm({ title: "", description: "", project_id: "", assignee_id: "", status: "todo", priority: "medium", category: "general", due_date: "" });
    setDialogOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListTodo className="h-6 w-6" /> Tasks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kanban board of active work</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="rounded-lg border bg-card/50 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <col.icon className={`h-4 w-4 ${col.color}`} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{colTasks.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colTasks.map(task => {
                    const Pri = priorityConfig[task.priority].icon;
                    return (
                      <Card key={task.id} className="cursor-pointer hover:border-primary/40 transition-colors">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>}
                            </div>
                            <Pri className={`h-3.5 w-3.5 shrink-0 ${priorityConfig[task.priority].color}`} />
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                            {task.assignee_name && (
                              <span className="flex items-center gap-1">
                                <User className="h-2.5 w-2.5" /> {task.assignee_name}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" /> {format(new Date(task.due_date), "d MMM")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 pt-1">
                            <Select value={task.status} onValueChange={(v) => updateTask.mutate({ id: task.id, status: v as TaskStatus })}>
                              <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {statusColumns.map(s => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete task?</AlertDialogTitle>
                                  <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteTask.mutate(task.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {colTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Project</Label>
                <Select value={form.project_id || "none"} onValueChange={v => setForm(f => ({ ...f, project_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(projects as any[]).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.project_name || p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Assignee</Label>
                <Select value={form.assignee_id || "none"} onValueChange={v => setForm(f => ({ ...f, assignee_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(teamMembers as any[]).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || addTask.isPending}>
              {addTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
