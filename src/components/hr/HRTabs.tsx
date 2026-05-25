import { useLocation, useNavigate } from "react-router-dom";
import { Users, Wallet, FileText, CalendarCheck, Palmtree } from "lucide-react";

const TABS = [
  { key: "/hr",            label: "Employees",  icon: Users },
  { key: "/hr/salary",     label: "Salary",     icon: Wallet },
  { key: "/hr/payslips",   label: "Payslips",   icon: FileText },
  { key: "/hr/attendance", label: "Attendance", icon: CalendarCheck },
  { key: "/hr/leaves",     label: "Leaves",     icon: Palmtree },
] as const;

export function HRTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit overflow-x-auto">
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = location.pathname === key;
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            className={
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap " +
              (active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className="h-3 w-3" /> {label}
          </button>
        );
      })}
    </div>
  );
}
