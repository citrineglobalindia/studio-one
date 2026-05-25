import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, ChevronLeft, ChevronRight, CalendarDays, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HRTabs } from "@/components/hr/HRTabs";
import { HRHero, RestrictedNotice } from "./HREmployeesPage";
import { useEmployees, useSalaries, monthKey } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { generatePayslipPdf } from "@/lib/generatePayslipPdf";

function inr(n: number | null | undefined) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0)); }
function monthLabel(d: Date) { return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }); }

export default function HRPayslipsPage() {
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";

  const [date, setDate] = useState<Date>(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const month = monthKey(date);
  const monthName = monthLabel(date);

  const { employees, isLoading: el } = useEmployees();
  const { salaries, isLoading: sl } = useSalaries(month);

  const rows = useMemo(() => {
    return employees.filter((e) => e.status !== "inactive").map((e) => {
      const s = salaries.find((x) => x.employee_id === e.id);
      return { employee: e, salary: s };
    });
  }, [employees, salaries]);

  const handleDownload = async (row: typeof rows[number]) => {
    const e = row.employee, s = row.salary;
    await generatePayslipPdf({
      studioName: organization?.name || "Studio",
      employee: {
        name: e.full_name, role: e.role, department: e.department,
        bank_name: e.bank_name, bank_account: e.bank_account, bank_ifsc: e.bank_ifsc,
        pan: e.pan, aadhaar: e.aadhaar,
      },
      period: monthName,
      base: Number(s?.base_amount ?? e.salary ?? 0),
      bonus: Number(s?.bonus_amount ?? 0),
      deductions: Number(s?.deductions ?? 0),
      net: Number(s?.net_amount ?? Number(e.salary || 0)),
      status: s?.status || "draft",
      paidAt: s?.paid_at,
      notes: s?.notes,
    });
  };

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-sm font-medium min-w-[180px] justify-center"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{monthName}</div>
        <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {el || sl ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center"><FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No employees</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Employee</th>
                <th className="text-right px-3 py-3 font-medium">Net pay</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ employee, salary }) => {
                const status = salary?.status ?? "—";
                const paid = status === "paid";
                return (
                  <tr key={employee.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3"><div className="font-medium text-foreground">{employee.full_name}</div><div className="text-xs text-muted-foreground capitalize">{(employee.role || "—").replace(/_/g, " ")}</div></td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">{inr(salary?.net_amount ?? employee.salary)}</td>
                    <td className="px-3 py-3 text-center"><Badge variant={paid ? "default" : "secondary"} className={paid ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : ""}>{status}</Badge></td>
                    <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => handleDownload({ employee, salary })}><FileDown className="h-3 w-3" /> Download</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
