import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ═════════════════ EMPLOYEES ═════════════════
export interface DbEmployee {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  type: string | null;
  status: string | null;
  join_date: string | null;
  salary: number | null;
  aadhaar: string | null;
  pan: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  address: string | null;
  notes: string | null;
}

export function useEmployees() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const query = useQuery({
    queryKey: ["employees", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbEmployee[];
      const { data, error } = await (supabase as any).from("employees").select("*").eq("organization_id", orgId).order("full_name", { ascending: true });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbEmployee[];
    },
  });
  const add = useMutation({
    mutationFn: async (p: Partial<DbEmployee>) => {
      if (!orgId) throw new Error("No studio");
      const { data, error } = await (supabase as any).from("employees").insert({ ...p, organization_id: orgId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", orgId] }); toast.success("Employee added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...p }: Partial<DbEmployee> & { id: string }) => {
      const { error } = await (supabase as any).from("employees").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", orgId] }); toast.success("Employee updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", orgId] }); toast.success("Employee removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return { employees: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

// ═════════════════ SALARIES ═════════════════
export interface DbSalary {
  id: string;
  organization_id: string;
  employee_id: string;
  month: string;
  base_amount: number;
  bonus_amount: number;
  deductions: number;
  net_amount: number;
  status: string | null;
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useSalaries(month: string) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const query = useQuery({
    queryKey: ["salaries", orgId, month],
    enabled: !!orgId && !!month,
    queryFn: async () => {
      if (!orgId) return [] as DbSalary[];
      const { data, error } = await (supabase as any).from("salaries").select("*").eq("organization_id", orgId).eq("month", month);
      if (error) throw error;
      return ((data as unknown) ?? []) as DbSalary[];
    },
  });
  const upsert = useMutation({
    mutationFn: async (p: Partial<DbSalary> & { employee_id: string; month: string }) => {
      if (!orgId) throw new Error("No studio");
      const row = {
        organization_id: orgId,
        employee_id: p.employee_id,
        month: p.month,
        base_amount: p.base_amount ?? 0,
        bonus_amount: p.bonus_amount ?? 0,
        deductions: p.deductions ?? 0,
        status: p.status ?? "draft",
        notes: p.notes ?? null,
      };
      const { error } = await (supabase as any).from("salaries").upsert(row, { onConflict: "organization_id,employee_id,month" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salaries", orgId, month] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...p }: Partial<DbSalary> & { id: string }) => {
      const { error } = await (supabase as any).from("salaries").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salaries", orgId, month] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("salaries").update({
        status: "paid", paid_at: new Date().toISOString(), paid_by: user?.id ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salaries", orgId, month] }); toast.success("Marked paid"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return { salaries: query.data ?? [], isLoading: query.isLoading, upsert, update, markPaid };
}

// ═════════════════ ATTENDANCE ═════════════════
export interface DbAttendance {
  id: string;
  organization_id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  total_hours: number | null;
  status: string | null;
  notes: string | null;
}

export function useAttendance(fromIso: string, toIso: string) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const query = useQuery({
    queryKey: ["attendance", orgId, fromIso, toIso],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbAttendance[];
      const { data, error } = await (supabase as any).from("attendance").select("*").eq("organization_id", orgId).gte("date", fromIso).lte("date", toIso);
      if (error) throw error;
      return ((data as unknown) ?? []) as DbAttendance[];
    },
  });
  const upsert = useMutation({
    mutationFn: async (p: Partial<DbAttendance> & { employee_id: string; date: string }) => {
      if (!orgId) throw new Error("No studio");
      const { error } = await (supabase as any).from("attendance").upsert({
        organization_id: orgId,
        employee_id: p.employee_id,
        date: p.date,
        status: p.status ?? "present",
        notes: p.notes ?? null,
        clock_in: p.clock_in ?? null,
        clock_out: p.clock_out ?? null,
        total_hours: p.total_hours ?? null,
      }, { onConflict: "organization_id,employee_id,date" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  return { records: query.data ?? [], isLoading: query.isLoading, upsert };
}

// ═════════════════ LEAVES ═════════════════
export interface DbLeave {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string | null;
  leave_type: string | null;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  approved_by: string | null;
  approved_by_user_id: string | null;
  approval_notes: string | null;
  approved_at: string | null;
}

export function useLeaves() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const query = useQuery({
    queryKey: ["leaves", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbLeave[];
      const { data, error } = await (supabase as any).from("leaves").select("*").eq("organization_id", orgId).order("from_date", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbLeave[];
    },
  });
  const add = useMutation({
    mutationFn: async (p: Partial<DbLeave>) => {
      if (!orgId) throw new Error("No studio");
      const { error } = await (supabase as any).from("leaves").insert({
        ...p, organization_id: orgId, status: "pending", applied_on: new Date().toISOString().slice(0,10),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves", orgId] }); toast.success("Leave applied"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, ...p }: Partial<DbLeave> & { id: string }) => {
      const { error } = await (supabase as any).from("leaves").update(p).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const approve = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await (supabase as any).from("leaves").update({
        status: "approved", approved_by_user_id: user?.id ?? null, approved_at: new Date().toISOString(), approval_notes: notes ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves", orgId] }); toast.success("Leave approved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await (supabase as any).from("leaves").update({
        status: "rejected", approved_by_user_id: user?.id ?? null, approved_at: new Date().toISOString(), approval_notes: notes ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves", orgId] }); toast.success("Leave rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("leaves").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leaves", orgId] }); toast.success("Leave removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return { leaves: query.data ?? [], isLoading: query.isLoading, add, update, approve, reject, remove };
}
