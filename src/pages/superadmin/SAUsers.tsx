import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, Search, Mail, Shield, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface UserRow {
  user_id: string;
  display_name: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
  org_name: string | null;
  org_role: string | null;
  org_color: string | null;
}

export default function SAUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, membersRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, role, avatar_url, created_at"),
      supabase.from("organization_members").select("user_id, organization_id, role"),
      supabase.from("organizations").select("id, name, primary_color"),
    ]);

    const profiles = profilesRes.data || [];
    const members = membersRes.data || [];
    const orgsMap: Record<string, { name: string; primary_color: string | null }> = {};
    (orgsRes.data || []).forEach((o: any) => { orgsMap[o.id] = { name: o.name, primary_color: o.primary_color }; });

    const memberMap: Record<string, { org_id: string; role: string }> = {};
    members.forEach((m: any) => { memberMap[m.user_id] = { org_id: m.organization_id, role: m.role }; });

    const userRows: UserRow[] = profiles.map((p: any) => {
      const membership = memberMap[p.user_id];
      const org = membership ? orgsMap[membership.org_id] : null;
      return {
        user_id: p.user_id,
        display_name: p.display_name,
        role: p.role,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        org_name: org?.name || null,
        org_role: membership?.role || null,
        org_color: org?.primary_color || null,
      };
    });

    setUsers(userRows);
    setLoading(false);
  };

  const filtered = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.org_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string | null) => {
    if (!role) return <Badge variant="outline" className="text-xs">No role</Badge>;
    const colors: Record<string, string> = {
      admin: "bg-primary/15 text-primary border-primary/30",
      owner: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      hr: "bg-violet-500/15 text-violet-400 border-violet-500/30",
      accounts: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };
    return <Badge className={`text-xs ${colors[role] || "bg-muted text-muted-foreground"}`}>{role}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} users across all studios</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold text-foreground">{users.length}</p><p className="text-xs text-muted-foreground">Total Users</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Shield className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{users.filter((u) => u.role === "admin").length}</p><p className="text-xs text-muted-foreground">Admins</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-violet-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{new Set(users.filter((u) => u.org_name).map((u) => u.org_name)).size}</p><p className="text-xs text-muted-foreground">Studios</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-amber-400" /></div>
            <div><p className="text-2xl font-bold text-foreground">{users.filter((u) => !u.org_name).length}</p><p className="text-xs text-muted-foreground">Unassigned</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading users...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>App Role</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Org Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                            {(user.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{user.display_name || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.org_name ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-5 w-5 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: user.org_color || "hsl(var(--primary))" }}
                            >
                              {user.org_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-foreground">{user.org_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.org_role ? (
                          <Badge variant="outline" className="text-xs capitalize">{user.org_role}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
