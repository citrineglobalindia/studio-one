import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, UserPlus, CalendarOff, Clock, AlertTriangle, Briefcase,
  TrendingUp, TrendingDown, ArrowRight, BarChart3, Activity, Target,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const monthlyGrowth = [
  { month: "Nov", employees: 42 },
  { month: "Dec", employees: 45 },
  { month: "Jan", employees: 48 },
  { month: "Feb", employees: 51 },
  { month: "Mar", employees: 54 },
  { month: "Apr", employees: 58 },
];

const attendanceData = [
  { name: "Present", value: 42, fill: "hsl(142,71%,45%)" },
  { name: "Late", value: 5, fill: "hsl(38,92%,50%)" },
  { name: "Absent", value: 3, fill: "hsl(0,84%,60%)" },
  { name: "On Leave", value: 8, fill: "hsl(217,91%,60%)" },
];

const departmentData = [
  { department: "Engineering", count: 18 },
  { department: "Marketing", count: 8 },
  { department: "Sales", count: 12 },
  { department: "HR", count: 4 },
  { department: "Finance", count: 6 },
  { department: "Operations", count: 10 },
];

const COLORS = [
  "hsl(var(--primary))", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)",
  "hsl(217,91%,60%)", "hsl(280,60%,50%)",
];

const pendingLeaves = [
  { id: "1", type: "Casual Leave", days: 2, from: "2026-04-07", to: "2026-04-08", employee: "John Smith" },
  { id: "2", type: "Sick Leave", days: 1, from: "2026-04-06", to: "2026-04-06", employee: "Sarah Wilson" },
  { id: "3", type: "Personal Leave", days: 3, from: "2026-04-10", to: "2026-04-12", employee: "Mike Johnson" },
];

const HRDashboard = () => {
  const navigate = useNavigate();

  const kpiCards = [
    { title: "Total Employees", value: 58, icon: Users, trend: "+4", trendUp: true, color: "bg-primary/10 text-primary", onClick: () => navigate("/hr/employees") },
    { title: "Active", value: 54, icon: UserCheck, trend: "93%", trendUp: true, color: "bg-green-500/10 text-green-600", onClick: () => navigate("/hr/employees") },
    { title: "New Joiners", value: 6, icon: UserPlus, trend: "30d", trendUp: true, color: "bg-blue-500/10 text-blue-600", onClick: () => navigate("/hr/employees") },
    { title: "Turnover Rate", value: "2.1%", icon: TrendingDown, trend: "", trendUp: false, color: "bg-destructive/10 text-destructive" },
    { title: "Avg Tenure", value: "1.8y", icon: Clock, trend: "", trendUp: true, color: "bg-amber-500/10 text-amber-600" },
    { title: "On Leave", value: 8, icon: CalendarOff, trend: "today", trendUp: false, color: "bg-orange-500/10 text-orange-600", onClick: () => navigate("/hr/leaves") },
    { title: "Pending Leaves", value: 3, icon: AlertTriangle, trend: "", trendUp: false, color: "bg-red-500/10 text-red-600", onClick: () => navigate("/hr/leaves") },
    { title: "Open Positions", value: 5, icon: Briefcase, trend: "", trendUp: true, color: "bg-violet-500/10 text-violet-600" },
  ];

  return (
    <DashboardLayout>
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
                <AreaChart data={monthlyGrowth}>
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
                  <Pie data={attendanceData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                    {attendanceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                {attendanceData.map((item) => (
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
                {departmentData.map((dept, i) => (
                  <div key={dept.department}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{dept.department}</span>
                      <span className="font-semibold text-foreground">{dept.count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(dept.count / 58) * 100}%`, background: COLORS[i % COLORS.length] }} />
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
                {pendingLeaves.map(lr => (
                  <div key={lr.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{lr.employee} — {lr.type}</p>
                      <p className="text-xs text-muted-foreground">{lr.days} day(s) · {lr.from} to {lr.to}</p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
