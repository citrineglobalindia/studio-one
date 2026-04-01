import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, Search, Send, Check, X, Clock, IndianRupee, Copy } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Package {
  id: string;
  name: string;
  price: number;
  includes: string[];
  popular?: boolean;
}

interface Quotation {
  id: string;
  client: string;
  packageName: string;
  amount: number;
  status: "draft" | "sent" | "viewed" | "approved" | "rejected" | "expired";
  sentDate?: string;
  validUntil: string;
  notes?: string;
}

const packages: Package[] = [
  { id: "pkg1", name: "Classic Package", price: 150000, includes: ["1 Photographer", "1 Videographer", "Photo Editing", "Highlight Reel", "200 Edited Photos"] },
  { id: "pkg2", name: "Premium Package", price: 250000, includes: ["2 Photographers", "1 Videographer", "Drone Coverage", "Photo + Video Editing", "400 Edited Photos", "Cinematic Film"], popular: true },
  { id: "pkg3", name: "Royal Package", price: 350000, includes: ["2 Photographers", "2 Videographers", "Drone + Crane", "Same-Day Edit", "600+ Photos", "Full Film + Teaser", "Album Design"] },
  { id: "pkg4", name: "Destination Wedding", price: 500000, includes: ["3 Photographers", "2 Videographers", "Drone Coverage", "Pre-Wedding Shoot", "All Events", "Premium Album", "Travel Included"] },
];

const sampleQuotations: Quotation[] = [
  { id: "q1", client: "Sneha & Rohan", packageName: "Destination Wedding", amount: 500000, status: "sent", sentDate: "2026-03-28", validUntil: "2026-04-15", notes: "Udaipur venue" },
  { id: "q2", client: "Ritu & Karan", packageName: "Premium Package", amount: 275000, status: "approved", sentDate: "2026-03-15", validUntil: "2026-04-10" },
  { id: "q3", client: "Divya & Arun", packageName: "Royal Package", amount: 350000, status: "viewed", sentDate: "2026-03-25", validUntil: "2026-04-20" },
  { id: "q4", client: "Pooja & Nikhil", packageName: "Classic Package", amount: 160000, status: "draft", validUntil: "2026-04-30" },
  { id: "q5", client: "Sunita & Raj", packageName: "Premium Package", amount: 250000, status: "rejected", sentDate: "2026-03-10", validUntil: "2026-03-25", notes: "Budget constraints" },
  { id: "q6", client: "Tara & Mohan", packageName: "Classic Package", amount: 150000, status: "expired", sentDate: "2026-02-20", validUntil: "2026-03-15" },
];

const statusConfig: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  draft: { label: "Draft", style: "bg-muted text-muted-foreground border-border", icon: FileText },
  sent: { label: "Sent", style: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  viewed: { label: "Viewed", style: "bg-primary/20 text-primary border-primary/30", icon: Clock },
  approved: { label: "Approved", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Check },
  rejected: { label: "Rejected", style: "bg-destructive/20 text-red-400 border-red-500/30", icon: X },
  expired: { label: "Expired", style: "bg-muted text-muted-foreground border-border", icon: Clock },
};

export default function QuotationsPage() {
  const [search, setSearch] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  const filtered = sampleQuotations.filter((q) =>
    `${q.client} ${q.packageName}`.toLowerCase().includes(search.toLowerCase())
  );

  const approvedValue = sampleQuotations.filter((q) => q.status === "approved").reduce((s, q) => s + q.amount, 0);
  const pipelineValue = sampleQuotations.filter((q) => ["sent", "viewed"].includes(q.status)).reduce((s, q) => s + q.amount, 0);
  const conversionRate = Math.round((sampleQuotations.filter((q) => q.status === "approved").length / sampleQuotations.length) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Quotations & Packages</h1>
            <p className="text-sm text-muted-foreground mt-1">Pipeline ₹{(pipelineValue / 100000).toFixed(1)}L · Approved ₹{(approvedValue / 100000).toFixed(1)}L · {conversionRate}% conversion</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Quotation</Button>
        </div>

        {/* Packages */}
        <div>
          <h2 className="font-display font-semibold text-foreground mb-3">Studio Packages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/40 ${pkg.popular ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{pkg.name}</h3>
                  {pkg.popular && <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>}
                </div>
                <p className="text-xl font-display font-bold text-foreground mb-3">₹{(pkg.price / 1000).toFixed(0)}K</p>
                <ul className="space-y-1">
                  {pkg.includes.slice(0, 3).map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-primary" />{item}
                    </li>
                  ))}
                  {pkg.includes.length > 3 && (
                    <li className="text-xs text-primary">+{pkg.includes.length - 3} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quotations List */}
        <div className="rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-display font-semibold text-foreground">Recent Quotations</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search quotations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-8 text-sm" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((q) => {
              const config = statusConfig[q.status];
              return (
                <div key={q.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <config.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{q.client}</p>
                      <p className="text-xs text-muted-foreground">{q.packageName}{q.notes ? ` · ${q.notes}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-mono text-foreground">₹{(q.amount / 1000).toFixed(0)}K</span>
                    <Badge variant="outline" className={config.style + " text-[10px]"}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">Valid: {q.validUntil.slice(5)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Package Detail Dialog */}
        <Dialog open={!!selectedPkg} onOpenChange={() => setSelectedPkg(null)}>
          <DialogContent>
            {selectedPkg && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">{selectedPkg.name}</DialogTitle>
                </DialogHeader>
                <p className="text-2xl font-display font-bold text-foreground">₹{selectedPkg.price.toLocaleString("en-IN")}</p>
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Includes</p>
                  {selectedPkg.includes.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary" />{item}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1 gap-2"><Copy className="h-4 w-4" />Duplicate</Button>
                  <Button className="flex-1 gap-2"><Send className="h-4 w-4" />Send Quotation</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
