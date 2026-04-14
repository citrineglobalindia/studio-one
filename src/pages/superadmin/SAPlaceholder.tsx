import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SAPlaceholder() {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop() || "page";

  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <Construction className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold text-foreground capitalize">{pageName.replace("-", " ")}</h2>
          <p className="text-sm text-muted-foreground">This section is under development and will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
