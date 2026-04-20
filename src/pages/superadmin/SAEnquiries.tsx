import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, Phone, MessageSquare, Calendar, Trash2, Search, Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["new", "contacted", "qualified", "converted", "archived"] as const;

const statusColor: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  contacted: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  qualified: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  converted: "bg-green-500/15 text-green-400 border-green-500/30",
  archived: "bg-muted text-muted-foreground border-muted",
};

export default function SAEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setEnquiries(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchEnquiries(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    fetchEnquiries();
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("enquiries")
      .update({ notes: noteDraft })
      .eq("id", selected.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Notes saved");
    setSelected({ ...selected, notes: noteDraft });
    fetchEnquiries();
  };

  const deleteEnquiry = async (id: string) => {
    const { error } = await supabase.from("enquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Enquiry deleted");
    setSelected(null);
    fetchEnquiries();
  };

  const filtered = enquiries.filter(e => {
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.phone || "").toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = STATUSES.map(s => ({
    status: s,
    count: enquiries.filter(e => e.status === s).length,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Inbox className="h-6 w-6" /> Enquiries
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Leads submitted via the public landing page</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {counts.map(({ status, count }) => (
          <Card
            key={status}
            className={`cursor-pointer transition-all ${statusFilter === status ? "ring-2 ring-primary" : ""}`}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
          >
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{status}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone, message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Inbox className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No enquiries{statusFilter !== "all" ? ` with status "${statusFilter}"` : " yet"}.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setSelected(e); setNoteDraft(e.notes || ""); }}
                  className="w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{e.name}</span>
                      <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[e.status] || ""}`}>
                        {e.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</span>
                      {e.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(e.created_at), "d MMM yyyy, HH:mm")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{e.message}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selected.name}
                  <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[selected.status] || ""}`}>
                    {selected.status}
                  </Badge>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${selected.email}`} className="text-primary hover:underline">{selected.email}</a></div>
                  {selected.phone && (
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${selected.phone}`} className="text-primary hover:underline">{selected.phone}</a></div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Received {format(new Date(selected.created_at), "d MMM yyyy, HH:mm")}</div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                    <MessageSquare className="h-3 w-3" /> Message
                  </Label>
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{selected.message}</div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Status</Label>
                  <Select value={selected.status} onValueChange={v => updateStatus(selected.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Internal notes</Label>
                  <Textarea
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder="Add follow-up notes, call outcomes, etc."
                    rows={4}
                  />
                  <Button size="sm" className="mt-2" onClick={saveNotes} disabled={saving || noteDraft === (selected.notes || "")}>
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save notes"}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-1">
                        <Trash2 className="h-3 w-3" /> Delete enquiry
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this enquiry?</AlertDialogTitle>
                        <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEnquiry(selected.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
