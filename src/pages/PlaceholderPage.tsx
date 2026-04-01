import { DashboardLayout } from "@/components/DashboardLayout";
import { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function PlaceholderPage({ title, description, icon: Icon = Construction }: PlaceholderPageProps) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">{description}</p>
        <span className="text-xs text-muted-foreground mt-4 px-3 py-1 rounded-full bg-muted border border-border">
          Coming Soon
        </span>
      </div>
    </DashboardLayout>
  );
}
