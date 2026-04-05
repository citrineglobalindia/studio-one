import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, UserCheck, UserX, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Users, Ban, TrendingDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type DayEntry = {
  hours: string;
  type: "worked" | "timeoff" | "noshow" | "underworked";
};

type EmployeeWeek = {
  id: string;
  name: string;
  initials: string;
  color: string;
  days: DayEntry[];
  noShows: number;
  underworkedDays: number;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekDates = ["Mar 31", "Apr 1", "Apr 2", "Apr 3", "Apr 4", "Apr 5", "Apr 6"];

const avatarColors = [
  "bg-blue-500", "bg-red-500", "bg-green-500", "bg-purple-500",
  "bg-amber-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500",
  "bg-orange-500", "bg-cyan-500",
];

const employees: EmployeeWeek[] = [
  { id: "1", name: "Brooklyn Simmons", initials: "BS", color: avatarColors[0], days: [
    { hours: "7h 50m", type: "worked" }, { hours: "6h 45m", type: "worked" }, { hours: "9h 34m", type: "underworked" },
    { hours: "6h 50m", type: "worked" }, { hours: "2h 10m", type: "underworked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "2", name: "Ronald Richards", initials: "RR", color: avatarColors[1], days: [
    { hours: "9h 50m", type: "worked" }, { hours: "9h 34m", type: "underworked" }, { hours: "6h 45m", type: "worked" },
    { hours: "6h 50m", type: "worked" }, { hours: "7h 50m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "3", name: "Marvin McKinney", initials: "MM", color: avatarColors[2], days: [
    { hours: "5h 50m", type: "worked" }, { hours: "9h 50m", type: "worked" }, { hours: "6h 50m", type: "worked" },
    { hours: "7h 15m", type: "worked" }, { hours: "50m", type: "underworked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 1 },
  { id: "4", name: "Cody Fisher", initials: "CF", color: avatarColors[3], days: [
    { hours: "7h 15m", type: "worked" }, { hours: "9h 50m", type: "worked" }, { hours: "5h 50m", type: "worked" },
    { hours: "6h 50m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "No show", type: "noshow" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 1, underworkedDays: 0 },
  { id: "5", name: "Dianne Russell", initials: "DR", color: avatarColors[4], days: [
    { hours: "9h 34m", type: "underworked" }, { hours: "9h 50m", type: "worked" }, { hours: "6h 45m", type: "worked" },
    { hours: "6h 50m", type: "worked" }, { hours: "7h 50m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "6", name: "Darrell Steward", initials: "DS", color: avatarColors[5], days: [
    { hours: "7h 50m", type: "worked" }, { hours: "6h 45m", type: "worked" }, { hours: "2h 10m", type: "underworked" },
    { hours: "9h 34m", type: "underworked" }, { hours: "6h 45m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "6h 50m", type: "worked" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "7", name: "Floyd Miles", initials: "FM", color: avatarColors[6], days: [
    { hours: "5h 50m", type: "worked" }, { hours: "9h 50m", type: "worked" }, { hours: "6h 50m", type: "worked" },
    { hours: "7h 15m", type: "worked" }, { hours: "50m", type: "underworked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "8", name: "Albert Flores", initials: "AF", color: avatarColors[7], days: [
    { hours: "No show", type: "noshow" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" },
    { hours: "7h 15m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 2, underworkedDays: 0 },
  { id: "9", name: "Robert Fox", initials: "RF", color: avatarColors[8], days: [
    { hours: "5h 50m", type: "worked" }, { hours: "7h 15m", type: "worked" }, { hours: "9h 34m", type: "underworked" },
    { hours: "6h 50m", type: "worked" }, { hours: "50m", type: "underworked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
  { id: "10", name: "Jenny Wilson", initials: "JW", color: avatarColors[9], days: [
    { hours: "8h 20m", type: "worked" }, { hours: "7h 50m", type: "worked" }, { hours: "6h 50m", type: "worked" },
    { hours: "9h 10m", type: "worked" }, { hours: "7h 45m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
];

const getCellStyle = (entry: DayEntry) => {
  switch (entry.type) {
    case "worked":
      return "bg-green-500/10 text-foreground";
    case "underworked":
      return "bg-amber-500/10 text-amber-600";
    case "noshow":
      return "bg-red-500/10 text-red-500 font-semibold";
    case "timeoff":
      return "bg-muted/40 text-muted-foreground";
  }
};

const HRAttendance = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ledger");

  const totalWorked = employees.length;
  const totalNoShows = employees.filter(e => e.noShows > 0).length;
  const totalUnderworked = employees.filter(e => e.underworkedDays > 0).length;

  const filtered = employees.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">Attendance</h1>
            <p className="text-muted-foreground text-sm">Weekly attendance ledger & tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-foreground px-2">Mar 31 – Apr 6, 2026</span>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ledger" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Attendance & No Shows</TabsTrigger>
            <TabsTrigger value="clockin" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> Clock In / Clock Out</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Total users worked: <strong className="text-foreground">{totalWorked}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ban className="h-4 w-4" />
                <span>Users with no show records: <strong className="text-foreground">{totalNoShows}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                <span>Users with underworked days: <strong className="text-foreground">{totalUnderworked}</strong></span>
              </div>
            </div>

            {/* Ledger Table */}
            <Card className="overflow-hidden border-border/60">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left py-3 px-4 font-semibold text-primary text-xs uppercase tracking-wider w-[200px] sticky left-0 bg-muted/30 z-10">
                          Name ↓
                        </th>
                        {weekDates.map((date, i) => (
                          <th key={i} className="text-center py-3 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[110px]">
                            <div>{date}</div>
                            <div className="text-[10px] text-muted-foreground/70">{weekDays[i]}</div>
                          </th>
                        ))}
                        <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[80px]">No Shows</th>
                        <th className="text-center py-3 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground min-w-[110px]">Underworked Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((emp, idx) => (
                        <tr key={emp.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/5"}`}>
                          <td className="py-3 px-4 sticky left-0 bg-card z-10">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={`${emp.color} text-white text-xs font-semibold`}>
                                  {emp.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground whitespace-nowrap">{emp.name}</span>
                            </div>
                          </td>
                          {emp.days.map((day, di) => (
                            <td key={di} className="py-3 px-2 text-center">
                              <div className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium ${getCellStyle(day)}`}>
                                {day.hours}
                                {day.type === "underworked" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                                {day.type === "noshow" && <Ban className="h-3 w-3 text-red-500" />}
                              </div>
                            </td>
                          ))}
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block min-w-[28px] rounded-md px-2 py-1 text-xs font-bold ${emp.noShows > 0 ? "bg-red-500/10 text-red-500" : "text-muted-foreground"}`}>
                              {emp.noShows}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block min-w-[28px] rounded-md px-2 py-1 text-xs font-bold ${emp.underworkedDays > 0 ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground"}`}>
                              {emp.underworkedDays}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/20 border border-green-300" /> Worked</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-300" /> Underworked</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-300" /> No Show</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted border border-border" /> Time Off</div>
            </div>
          </TabsContent>

          <TabsContent value="clockin" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 text-primary/40" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Clock In / Clock Out</h3>
                <p className="text-sm">Real-time clock in and clock out tracking coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRAttendance;
