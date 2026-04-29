import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wallet, Plus, IndianRupee, Loader2, CheckCircle2, XCircle, Clock, BanknoteIcon, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { usePaymentRequests, type PaymentStatus } from "@/hooks/usePaymentRequests";

const statusBadge: Record<PaymentStatus, { label: string; tone: string; icon: any }> = {
  pending: { label: "Pending", tone: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Approved", tone: "bg-sky-100 text-sky-700 border-sky-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
  paid: { label: "Paid", tone: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: BanknoteIcon },
  cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export default function RolePaymentsPage() {
  const { requests, isLoading, createRequest, cancelRequest } = usePaymentRequests({ mineOnly: true });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    description: "",
    payment_method: "upi",
    payment_account: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const totals = {
    pending: requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0),
    approved: requests.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount || 0), 0),
    paid: requests.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount || 0), 0),
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const handleSubmit = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      await createRequest.mutateAsync({
        team_member_id: null,
        deliverable_id: null,
        project_id: null,
        amount,
        currency: "INR",
        description: form.description.trim(),
        payment_method: form.payment_method,
        payment_account: form.payment_account.trim() || null,
      });
      setForm({ amount: "", description: "", payment_method: "upi", payment_account: "" });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      {/* Hero */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)",
          boxShadow: "0 24px 60px -16px rgba(37,99,235,0.5)",
        }}
      >
        <div className="absolute -top-16 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Wallet className="h-5 w-5" /> My Payments
            </h1>
            <p className="text-[11px] opacity-90 mt-1.5">
              Raise payment requests for your work and track status
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="gap-1 bg-white/20 hover:bg-white/30 text-white border border-white/30"
          >
            <Plus className="h-4 w-4" /> Request
          </Button>
        </div>
      </motion.div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <motion.div variants={cardVariants} className="rounded-2xl p-3 border border-blue-100 bg-white">
          <Clock className="h-4 w-4 text-amber-600 mb-1.5" />
          <p className="text-lg font-extrabold text-slate-900 leading-none">₹{totals.pending.toLocaleString("en-IN")}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Pending</p>
        </motion.div>
        <motion.div variants={cardVariants} className="rounded-2xl p-3 border border-blue-100 bg-white">
          <CheckCircle2 className="h-4 w-4 text-sky-600 mb-1.5" />
          <p className="text-lg font-extrabold text-slate-900 leading-none">₹{totals.approved.toLocaleString("en-IN")}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Approved</p>
        </motion.div>
        <motion.div variants={cardVariants} className="rounded-2xl p-3 border border-blue-100 bg-white">
          <BanknoteIcon className="h-4 w-4 text-emerald-600 mb-1.5" />
          <p className="text-lg font-extrabold text-slate-900 leading-none">₹{totals.paid.toLocaleString("en-IN")}</p>
          <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Paid</p>
        </motion.div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <motion.div variants={cardVariants} className="rounded-3xl p-10 text-center border border-blue-100 bg-white">
          <Wallet className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500 mb-3">No payment requests yet</p>
          <Button onClick={() => setOpen(true)} className="gap-2" style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}>
            <Plus className="h-4 w-4" /> Raise your first request
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {requests.map(r => {
            const sb = statusBadge[r.status];
            const SIcon = sb.icon;
            return (
              <motion.div
                key={r.id}
                variants={cardVariants}
                className="rounded-3xl border border-blue-100 bg-white p-4"
                style={{ boxShadow: "0 10px 30px -16px rgba(59,130,246,0.2)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-extrabold text-slate-900 flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {Number(r.amount).toLocaleString("en-IN")}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {format(new Date(r.created_at), "d MMM yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] gap-1 ${sb.tone}`}>
                    <SIcon className="h-3 w-3" />
                    {sb.label}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mb-2">{r.description}</p>
                {r.payment_method && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                    <span className="capitalize">via {r.payment_method.replace("_", " ")}</span>
                    {r.payment_account && <span>· {r.payment_account}</span>}
                  </div>
                )}
                {r.admin_notes && (
                  <div className={`mt-2 p-2 rounded-lg text-[11px] ${r.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                    <span className="font-semibold">Admin note:</span> {r.admin_notes}
                  </div>
                )}
                {r.status === "paid" && r.paid_reference && (
                  <p className="text-[10px] text-emerald-700 mt-2">Ref: {r.paid_reference}</p>
                )}
                {r.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-rose-600 hover:bg-rose-50 h-7 px-2 text-xs gap-1"
                    onClick={() => cancelRequest.mutate(r.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Cancel request
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Raise payment request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Amount (₹) *</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 5000"
              />
            </div>
            <div>
              <Label className="text-xs">Description *</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What is this payment for?"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Payment method</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payment details</Label>
              <Input
                value={form.payment_account}
                onChange={e => setForm(f => ({ ...f, payment_account: e.target.value }))}
                placeholder={form.payment_method === "upi" ? "UPI id (you@upi)" : "Account / details"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !form.amount || !form.description}
              style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
