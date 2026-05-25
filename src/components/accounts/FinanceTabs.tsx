import { useLocation, useNavigate } from "react-router-dom";
import { Wallet, Receipt, BookOpen, BarChart3 } from "lucide-react";

const TABS = [
  { key: "/accounts", label: "Overview", icon: Wallet },
  { key: "/expenses", label: "Expenses", icon: Receipt },
  { key: "/ledger",   label: "Ledger",   icon: BookOpen },
  { key: "/pnl",      label: "P&L",      icon: BarChart3 },
] as const;

export function FinanceTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit overflow-x-auto">
      {TABS.map(({ key, label, icon: Icon }) => {
        const active = location.pathname === key || (key === "/accounts" && location.pathname.startsWith("/accounts"));
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
