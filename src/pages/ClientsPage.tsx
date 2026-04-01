import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Plus, Phone, Mail, MapPin, IndianRupee, Star, Filter } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Client {
  id: string;
  name: string;
  partnerName: string;
  phone: string;
  email: string;
  city: string;
  status: "active" | "past" | "vip";
  totalSpend: number;
  projects: number;
  lastProject: string;
  source: string;
  rating: number;
}

const sampleClients: Client[] = [
  { id: "c1", name: "Priya Sharma", partnerName: "Rahul Kapoor", phone: "+91 99887 76655", email: "priya.sharma@gmail.com", city: "Delhi", status: "active", totalSpend: 350000, projects: 1, lastProject: "Royal Wedding Package", source: "Instagram", rating: 5 },
  { id: "c2", name: "Ananya Desai", partnerName: "Vikram Malhotra", phone: "+91 88776 65544", email: "ananya.d@gmail.com", city: "Jaipur", status: "active", totalSpend: 250000, projects: 1, lastProject: "Premium Wedding Package", source: "Referral", rating: 4 },
  { id: "c3", name: "Meera Iyer", partnerName: "Aditya Nair", phone: "+91 77665 54433", email: "meera.iyer@yahoo.com", city: "Mumbai", status: "past", totalSpend: 180000, projects: 1, lastProject: "Gold Wedding Package", source: "Website", rating: 5 },
  { id: "c4", name: "Kavya Reddy", partnerName: "Arjun Menon", phone: "+91 66554 43322", email: "kavya.r@outlook.com", city: "Hyderabad", status: "vip", totalSpend: 520000, projects: 2, lastProject: "Platinum Destination", source: "Referral", rating: 5 },
  { id: "c5", name: "Nisha Patel", partnerName: "Dev Shah", phone: "+91 55443 32211", email: "nisha.p@gmail.com", city: "Ahmedabad", status: "past", totalSpend: 150000, projects: 1, lastProject: "Classic Package", source: "WhatsApp", rating: 4 },
  { id: "c6", name: "Ritu Singh", partnerName: "Karan Verma", phone: "+91 44332 21100", email: "ritu.singh@gmail.com", city: "Lucknow", status: "active", totalSpend: 300000, projects: 1, lastProject: "Premium Wedding", source: "Instagram", rating: 4 },
];

const statusStyle: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  past: "bg-muted text-muted-foreground border-border",
  vip: "bg-primary/20 text-primary border-primary/30",
};

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = sampleClients.filter((c) => {
    const matchSearch = `${c.name} ${c.partnerName} ${c.city}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalLifetimeValue = sampleClients.reduce((s, c) => s + c.totalSpend, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Client Management</h1>
            <p className="text-sm text-muted-foreground mt-1">{sampleClients.length} clients · Lifetime value ₹{(totalLifetimeValue / 100000).toFixed(1)}L</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <Filter className="h-3.5 w-3.5 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="rounded-lg bg-card border border-border p-5 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">{client.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                    <p className="text-xs text-muted-foreground">& {client.partnerName}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusStyle[client.status] + " text-[10px]"}>
                  {client.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{client.city}</div>
                <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{client.phone}</div>
                <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{client.email}</div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3 text-primary" />
                  <span className="text-sm font-semibold text-foreground">₹{(client.totalSpend / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < client.rating ? "text-primary fill-primary" : "text-muted"}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Client Detail Dialog */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-lg">
            {selectedClient && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{selectedClient.name} & {selectedClient.partnerName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm text-foreground">{selectedClient.phone}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm text-foreground">{selectedClient.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">City</Label>
                      <p className="text-sm text-foreground">{selectedClient.city}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Source</Label>
                      <p className="text-sm text-foreground">{selectedClient.source}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Spend</Label>
                      <p className="text-sm font-semibold text-foreground">₹{selectedClient.totalSpend.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Projects</Label>
                      <p className="text-sm text-foreground">{selectedClient.projects} ({selectedClient.lastProject})</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2"><Phone className="h-4 w-4" />Call</Button>
                    <Button variant="outline" className="flex-1 gap-2"><Mail className="h-4 w-4" />Email</Button>
                    <Button className="flex-1 gap-2">New Project</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
