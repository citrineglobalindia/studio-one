import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, UserPlus, CalendarOff, Clock, AlertTriangle, Briefcase,
  TrendingUp, TrendingDown, ArrowRight, Activity, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaves } from "@/hooks/useLeaves";

const COLORS = [
  "hsl(var(--primary))", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)",
  "hsl(217,91%,60%)", "hsl(280,60%,50%)",
];

const HRDashboard = () => {
  const navigate = useNavigate();
  const { employees } = useEmployees();
  const { leaves } = useLeaves();

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === "active").length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newJoiners = employees.filter(e => e.join_date && new Date(e.join_date) >= thirtyDaysAgo).length;
    const resigned = employees.filter(e => e.status === "resigned").length;
    const onLeaveStatus = employees.filter(e => e.status === "on-leave").length;
    const pendingLeaveCount = leaves.filter(l => l.status === "Pending").length;
    const approvedTodayLeaves = leaves.filter(l => {
      const today = new Date().toISOString().split("T")[0];
      return l.status === "Approved" && l.from_date <= today && l.to_date >= today;
    }).length;
    const totalOnLeave = onLeaveStatus + approvedTodayLeaves;

    // Department distribution from real data
    const deptMap: Record<string, number> = {};
    employees.forEach(e => {
      const dept = e.department || "Other";
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentData = Object.entries(deptMap).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count);

    // Attendance pie from real counts
    const attendanceData = [
      { name: "Active", value: active, fill: "hsl(142,71%,45%)" },
      { name: "On Leave", value: totalOnLeave, fill: "hsl(217,91%,60%)" },
      { name: "Resigned", value: resigned, fill: "hsl(0,84%,60%)" },
    ].filter(d => d.value > 0);

    const pendingLeaves = leaves.filter(l => l.status === "Pending").slice(0, 5);

    return { total, active, newJoiners, resigned, totalOnLeave, pendingLeaveCount, departmentData, attendanceData, pendingLeaves };
  }, [employees, leaves]);

  const kpiCards = [
    { title: "Total Employees", value: stats.total, icon: Users, trend: "", trendUp: true, color: "bg-primary/10 text-primary", onClick: () => navigate("/hr/employees") },
    { title: "Active", value: stats.active, icon: UserCheck, trend: stats.total ? `${Math.round((stats.active / stats.total) * 100)}%` : "", trendUp: true, color: "bg-green-500/10 text-green-600", onClick: () => navigate("/hr/employees") },
    { title: "New Joiners", value: stats.newJoiners, icon: UserPlus, trend: "30d", trendUp: true, color: "bg-blue-500/10 text-blue-600", onClick: () => navigate("/hr/employees") },
    { title: "Resigned", value: stats.resigned, icon: TrendingDown, trend: "", trendUp: false, color: "bg-destructive/10 text-destructive" },
    { title: "Avg Tenure", value: "—", icon: Clock, trend: "", trendUp: true, color: "bg-amber-500/10 text-amber-600" },
    { title: "On Leave", value: stats.totalOnLeave, icon: CalendarOff, trend: "today", trendUp: false, color: "bg-orange-500/10 text-orange-600", onClick: () => navigate("/hr/leaves") },
    { title: "Pending Leaves", value: stats.pendingLeaveCount, icon: AlertTriangle, trend: "", trendUp: false, color: "bg-red-500/10 text-red-600", onClick: () => navigate("/hr/leaves") },
    { title: "Open Positions", value: 0, icon: Briefcase, trend: "", trendUp: true, color: "bg-violet-500/10 text-violet-600" },
  ];

  return (
    
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">HR Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <Badge variant="outline" className="text-sm hidden md:flex">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-md transition-all" onClick={card.onClick}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  {card.trend && (
                    <span className={`text-[11px] font-medium flex items-center gap-0.5 ${card.trendUp ? "text-green-600" : "text-destructive"}`}>
                      {card.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {card.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground mt-3">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Employee Growth Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
          <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={[{ month: "Now", employees: stats.total }]}>
                  <defs>
                    <linearGradient id="empGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Area type="monotone" dataKey="employees" stroke="hsl(var(--primary))" fill="url(#empGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Today's Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={stats.attendanceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {stats.attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                {stats.attendanceData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.fill }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department + Pending Leaves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.departmentData.map((dept, i) => (
                  <div key={dept.department}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize">{dept.department}</span>
                      <span className="font-semibold text-foreground">{dept.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(dept.count / (stats.total || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Pending Leaves</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/hr/leaves")}>
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.pendingLeaves.length === 0 && <p className="text-sm text-muted-foreground">No pending leave requests.</p>}
                {stats.pendingLeaves.map(lr => (
                  <div key={lr.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lr.employee_name} — {lr.leave_type}</p>
                      <p className="text-xs text-muted-foreground">{lr.days} day(s) · {lr.from_date} to {lr.to_date}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    
  );
};

export default HRDashboard;
