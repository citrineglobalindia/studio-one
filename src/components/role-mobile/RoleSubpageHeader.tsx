import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  back?: string;
}

export function RoleSubpageHeader({ title, children, back }: Props) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <button
          onClick={() => (back ? navigate(back) : navigate(-1))}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-5 pt-5 pb-6">{children}</div>
    </div>
  );
}
