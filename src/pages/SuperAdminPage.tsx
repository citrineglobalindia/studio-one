import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SuperAdminLayout } from "@/components/superadmin/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function SuperAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    const { data } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    setIsSuperAdmin(!!data);
  };

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-black text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">You don't have super admin privileges.</p>
            <Button onClick={() => navigate("/")} variant="outline">Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SuperAdminLayout />;
}
