import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Plus, Search, FileSignature, Check, Clock, AlertTriangle, Send, Download, Eye } from "lucide-react";
import { useState } from "react";

interface Contract {
  id: string;
  client: string;
  project: string;
  amount: number;
  status: "draft" | "sent" | "viewed" | "signed" | "expired";
  createdDate: string;
  sentDate?: string;
  signedDate?: string;
  expiryDate: string;
  clauses: string[];
}

const sampleContracts: Contract[] = [
  { id: "ct1", client: "Priya & Rahul", project: "Royal Wedding Package", amount: 350000, status: "signed", createdDate: "2026-03-01", sentDate: "2026-03-02", signedDate: "2026-03-03", expiryDate: "2026-04-01", clauses: ["50% advance required", "Delivery within 45 days", "2 revision rounds included", "Travel costs included"] },
  { id: "ct2", client: "Ananya & Vikram", project: "Premium Wedding Package", amount: 250000, status: "signed", createdDate: "2026-03-10", sentDate: "2026-03-11", signedDate: "2026-03-12", expiryDate: "2026-04-10", clauses: ["40% advance required", "Delivery within 30 days", "1 revision round"] },
  { id: "ct3", client: "Sneha & Rohan", project: "Destination Wedding", amount: 500000, status: "sent", createdDate: "2026-03-28", sentDate: "2026-03-29", expiryDate: "2026-04-15", clauses: ["50% advance required", "Delivery within 60 days", "3 revision rounds", "Flight + hotel included"] },
  { id: "ct4", client: "Ritu & Karan", project: "Premium Wedding", amount: 300000, status: "viewed", createdDate: "2026-03-20", sentDate: "2026-03-21", expiryDate: "2026-04-15", clauses: ["40% advance", "Delivery within 30 days"] },
  { id: "ct5", client: "Divya & Arun", project: "Royal Package", amount: 350000, status: "draft", createdDate: "2026-03-30", expiryDate: "2026-04-30", clauses: ["50% advance", "Delivery within 45 days", "2 revisions"] },
  { id: "ct6", client: "Sunita & Raj", project: "Premium Package", amount: 250000, status: "expired", createdDate: "2026-02-15", sentDate: "2026-02-16", expiryDate: "2026-03-15", clauses: ["40% advance"] },
];

const statusConfig: Record<string, { style: string; icon: typeof Clock }> = {
  draft: { style: "bg-muted text-muted-foreground border-border", icon: Briefcase },
  sent: { style: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  viewed: { style: "bg-primary/20 text-primary border-primary/30", icon: Eye },
  signed: { style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Check },
  expired: { style: "bg-destructive/20 text-red-400 border-red-500/30", icon: AlertTriangle },
};

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = sampleContracts.filter((c) =>
    `${c.client} ${c.project}`.toLowerCase().includes(search.toLowerCase())
  );

  const signed = sampleContracts.filter((c) => c.status === "signed").length;
  const pending = sampleContracts.filter((c) => ["sent", "viewed"].includes(c.status)).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Contracts</h1>
            <p className="text-sm text-muted-foreground mt-1">{signed} signed · {pending} awaiting signature</p>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> New Contract</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Draft", count: sampleContracts.filter((c) => c.status === "draft").length, color: "text-muted-foreground" },
            { label: "Sent", count: sampleContracts.filter((c) => c.status === "sent").length, color: "text-blue-400" },
            { label: "Signed", count: signed, color: "text-emerald-400" },
            { label: "Expired", count: sampleContracts.filter((c) => c.status === "expired").length, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-card border border-border p-4 text-center">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Contract List */}
        <div className="rounded-lg bg-card border border-border divide-y divide-border">
          {filtered.map((contract) => {
            const config = statusConfig[contract.status];
            const isExpanded = expandedId === contract.id;
            return (
              <div key={contract.id}>
                <div
                  onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileSignature className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{contract.client}</p>
                      <p className="text-xs text-muted-foreground">{contract.project} · Created {contract.createdDate.slice(5)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-mono text-foreground">₹{(contract.amount / 1000).toFixed(0)}K</span>
                    <Badge variant="outline" className={config.style + " text-[10px]"}>{contract.status}</Badge>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Sent</p>
                        <p className="text-foreground font-medium">{contract.sentDate || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Signed</p>
                        <p className="text-foreground font-medium">{contract.signedDate || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="text-foreground font-medium">{contract.expiryDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="text-foreground font-medium">₹{contract.amount.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Key Clauses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {contract.clauses.map((clause) => (
                          <Badge key={clause} variant="outline" className="text-[10px] bg-muted/50">{clause}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />Download PDF</Button>
                      {contract.status === "draft" && <Button size="sm" className="gap-1.5"><Send className="h-3.5 w-3.5" />Send for Signing</Button>}
                      {contract.status === "sent" && <Button size="sm" variant="outline" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Resend</Button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
