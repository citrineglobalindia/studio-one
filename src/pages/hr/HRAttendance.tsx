import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameDay, isWeekend } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, LogIn, LogOut, ChevronLeft, ChevronRight, Users, Ban, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Download, Palmtree, Send, Timer, Play, Square, Coffee, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAttendance } from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaves } from "@/hooks/useLeaves";

type TabType = "calendar" | "clockin" | "ledger" | "team" | "report" | "leave" | "holidays";

type ClockLog = {
  id: string;
  type: "checkin" | "checkout" | "break_start" | "break_end";
  time: Date;
  label: string;
};

// Daily logs are now derived from DB data below

const dayColors: Record<string, string> = {
  present: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  absent: "bg-red-500/15 text-red-600 dark:text-red-400",
  halfday: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  holiday: "bg-accent/10 text-accent",
  leave: "bg-primary/10 text-primary",
};

type DayEntry = { hours: string; type: "worked" | "timeoff" | "noshow" | "underworked" };
type EmployeeWeek = { id: string; name: string; initials: string; color: string; days: DayEntry[]; noShows: number; underworkedDays: number };

const avatarColors = ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500", "bg-cyan-500"];

const ledgerEmployees: EmployeeWeek[] = [
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
  { id: "7", name: "Albert Flores", initials: "AF", color: avatarColors[7], days: [
    { hours: "No show", type: "noshow" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" },
    { hours: "7h 15m", type: "worked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 2, underworkedDays: 0 },
  { id: "8", name: "Robert Fox", initials: "RF", color: avatarColors[8], days: [
    { hours: "5h 50m", type: "worked" }, { hours: "7h 15m", type: "worked" }, { hours: "9h 34m", type: "underworked" },
    { hours: "6h 50m", type: "worked" }, { hours: "50m", type: "underworked" }, { hours: "Time off", type: "timeoff" }, { hours: "Time off", type: "timeoff" }
  ], noShows: 0, underworkedDays: 0 },
];

const teamMembers = [
  { id: "1", name: "John Smith", role: "Designer", status: "present" as const, checkIn: "09:02 AM", checkOut: "—", present: 18, absent: 1, leave: 1 },
  { id: "2", name: "Sarah Wilson", role: "Developer", status: "present" as const, checkIn: "08:55 AM", checkOut: "—", present: 20, absent: 0, leave: 2 },
  { id: "3", name: "Mike Johnson", role: "Manager", status: "leave" as const, present: 15, absent: 2, leave: 5, checkIn: undefined, checkOut: undefined },
  { id: "4", name: "Emily Davis", role: "Designer", status: "present" as const, checkIn: "09:12 AM", checkOut: "—", present: 17, absent: 2, leave: 1 },
  { id: "5", name: "David Brown", role: "Developer", status: "absent" as const, present: 14, absent: 4, leave: 2, checkIn: undefined, checkOut: undefined },
  { id: "6", name: "Lisa Taylor", role: "HR", status: "halfday" as const, checkIn: "09:00 AM", checkOut: "01:15 PM", present: 16, absent: 2, leave: 2 },
];

const reportData = [
  { name: "John Smith", role: "Designer", workingDays: 22, present: 18, absent: 1, halfDay: 1, leave: 2, lateIns: 3 },
  { name: "Sarah Wilson", role: "Developer", workingDays: 22, present: 20, absent: 0, halfDay: 0, leave: 2, lateIns: 1 },
  { name: "Mike Johnson", role: "Manager", workingDays: 22, present: 15, absent: 2, halfDay: 1, leave: 4, lateIns: 2 },
  { name: "Emily Davis", role: "Designer", workingDays: 22, present: 17, absent: 2, halfDay: 1, leave: 2, lateIns: 4 },
  { name: "David Brown", role: "Developer", workingDays: 22, present: 14, absent: 4, halfDay: 2, leave: 2, lateIns: 2 },
  { name: "Lisa Taylor", role: "HR", workingDays: 22, present: 20, absent: 1, halfDay: 0, leave: 1, lateIns: 0 },
];

const leaveHistory = [
  { id: "LV-001", type: "Casual Leave", from: "17 Apr 2026", to: "17 Apr 2026", reason: "Personal work", status: "Approved", applied: "15 Apr 2026" },
  { id: "LV-002", type: "Sick Leave", from: "22 Apr 2026", to: "23 Apr 2026", reason: "Not feeling well", status: "Pending", applied: "20 Apr 2026" },
  { id: "LV-003", type: "Earned Leave", from: "5 May 2026", to: "8 May 2026", reason: "Family function", status: "Rejected", applied: "28 Apr 2026" },
];

const holidays = [
  { day: 26, month: "JAN", name: "Republic Day", weekday: "Monday" },
  { day: 14, month: "MAR", name: "Holi", weekday: "Saturday" },
  { day: 14, month: "APR", name: "Ambedkar Jayanti", weekday: "Tuesday" },
  { day: 18, month: "APR", name: "Good Friday", weekday: "Saturday" },
  { day: 1, month: "MAY", name: "May Day", weekday: "Thursday" },
  { day: 15, month: "AUG", name: "Independence Day", weekday: "Saturday" },
  { day: 2, month: "OCT", name: "Gandhi Jayanti", weekday: "Friday" },
  { day: 25, month: "DEC", name: "Christmas", weekday: "Friday" },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  present: { label: "Present", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  absent: { label: "Absent", icon: XCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  halfday: { label: "Half Day", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  leave: { label: "On Leave", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
};

const leaveStatusColor: Record<string, string> = {
  Approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const getCellStyle = (entry: DayEntry) => {
  switch (entry.type) {
    case "worked": return "bg-emerald-500/10 text-foreground";
    case "underworked": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "noshow": return "bg-red-500/10 text-red-500 font-semibold";
    case "timeoff": return "bg-muted/40 text-muted-foreground";
  }
};

const weekDates = ["Mar 31", "Apr 1", "Apr 2", "Apr 3", "Apr 4", "Apr 5", "Apr 6"];
const weekDaysShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Component ──────────────────────────────────────────────────────
const HRAttendance = () => {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkInTimestamp, setCheckInTimestamp] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [search, setSearch] = useState("");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [leaveFrom, setLeaveFrom] = useState("");
  const [leaveTo, setLeaveTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [reportMonth, setReportMonth] = useState(new Date());
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockLogs, setClockLogs] = useState<ClockLog[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { attendance, clockIn, clockOut } = useAttendance();
  const { employees } = useEmployees();
  const { leaves } = useLeaves();

  // Auto-select first employee
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  // Restore clock-in state from DB on load
  useEffect(() => {
    if (!selectedEmployeeId || attendance.length === 0) return;
    const todayDate = new Date().toISOString().split("T")[0];
    const todayRecord = attendance.find(a => a.employee_id === selectedEmployeeId && a.date === todayDate);
    if (todayRecord?.clock_in && !todayRecord?.clock_out) {
      const ciTime = new Date(todayRecord.clock_in);
      setIsCheckedIn(true);
      setCheckInTime(format(ciTime, "hh:mm a"));
      setCheckInTimestamp(ciTime);
      setElapsedSeconds(Math.floor((Date.now() - ciTime.getTime()) / 1000));
    }
  }, [selectedEmployeeId, attendance]);

  // Build calendar attendance map from DB (for selected employee)
  const attendanceDataMap = useMemo(() => {
    const map: Record<string, string> = {};
    attendance
      .filter(a => a.employee_id === selectedEmployeeId)
      .forEach(a => {
        // Map DB status to calendar color keys
        const statusMap: Record<string, string> = {
          present: "present",
          absent: "absent",
          "half-day": "halfday",
          halfday: "halfday",
          leave: "leave",
          "no-show": "absent",
        };
        map[a.date] = statusMap[a.status] || a.status;
      });
    return map;
  }, [attendance, selectedEmployeeId]);

  // Build daily logs from DB
  const dailyLogs = useMemo(() => {
    return attendance
      .filter(a => a.employee_id === selectedEmployeeId && a.clock_in)
      .slice(0, 10)
      .map(a => {
        const ci = a.clock_in ? new Date(a.clock_in) : null;
        const co = a.clock_out ? new Date(a.clock_out) : null;
        const totalH = a.total_hours ?? 0;
        const hours = Math.floor(totalH);
        const mins = Math.round((totalH - hours) * 60);
        return {
          date: ci ? format(ci, "MMM d, yyyy") : a.date,
          checkIn: ci ? format(ci, "hh:mm a") : "—",
          checkOut: co ? format(co, "hh:mm a") : "—",
          breakTime: "—",
          totalHours: totalH > 0 ? `${hours}h ${mins}m` : "—",
          status: ci && new Date(`${a.date}T09:15:00`).getTime() < ci.getTime() ? "Late" : "On Time",
        };
      });
  }, [attendance, selectedEmployeeId]);

  // Team data from DB
  const teamMembersData = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0];
    return employees.map(emp => {
      const todayAttendance = attendance.find(a => a.employee_id === emp.id && a.date === todayDate);
      const empAttendance = attendance.filter(a => a.employee_id === emp.id);
      const presentCount = empAttendance.filter(a => a.status === "present").length;
      const absentCount = empAttendance.filter(a => a.status === "absent" || a.status === "no-show").length;
      const leaveCount = leaves.filter(l => l.employee_id === emp.id && l.status === "Approved").length;

      let status: "present" | "absent" | "leave" | "halfday" = "absent";
      if (todayAttendance) {
        if (todayAttendance.status === "present") status = todayAttendance.clock_out ? "present" : "present";
        else if (todayAttendance.status === "half-day" || todayAttendance.status === "halfday") status = "halfday";
        else if (todayAttendance.status === "leave") status = "leave";
        else status = "absent";
      }

      return {
        id: emp.id,
        name: emp.full_name,
        role: emp.role,
        status,
        checkIn: todayAttendance?.clock_in ? format(new Date(todayAttendance.clock_in), "hh:mm a") : undefined,
        checkOut: todayAttendance?.clock_out ? format(new Date(todayAttendance.clock_out), "hh:mm a") : undefined,
        present: presentCount,
        absent: absentCount,
        leave: leaveCount,
      };
    });
  }, [employees, attendance, leaves]);

  // Report data from DB
  const reportData = useMemo(() => {
    const monthKey = format(reportMonth, "yyyy-MM");
    return employees.map(emp => {
      const monthAtt = attendance.filter(a => a.employee_id === emp.id && a.date.startsWith(monthKey));
      return {
        name: emp.full_name,
        role: emp.role,
        workingDays: 22,
        present: monthAtt.filter(a => a.status === "present").length,
        absent: monthAtt.filter(a => a.status === "absent" || a.status === "no-show").length,
        halfDay: monthAtt.filter(a => a.status === "half-day" || a.status === "halfday").length,
        leave: monthAtt.filter(a => a.status === "leave").length,
        lateIns: monthAtt.filter(a => {
          if (!a.clock_in) return false;
          return new Date(a.clock_in).getHours() >= 9 && new Date(a.clock_in).getMinutes() > 15;
        }).length,
      };
    });
  }, [employees, attendance, reportMonth]);

  // Live timer effect
  useEffect(() => {
    if (isCheckedIn && checkInTimestamp && !isOnBreak) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - checkInTimestamp.getTime()) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCheckedIn, checkInTimestamp, isOnBreak]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const today = new Date();
  const todayStr = format(today, "EEEE, dd MMM yyyy");

  const monthStats = useMemo(() => {
    const monthKey = format(currentMonth, "yyyy-MM");
    let present = 0, absent = 0, halfday = 0, leave = 0;
    Object.entries(attendanceDataMap).forEach(([date, status]) => {
      if (date.startsWith(monthKey)) {
        if (status === "present") present++;
        else if (status === "absent") absent++;
        else if (status === "halfday") halfday++;
        else if (status === "leave") leave++;
      }
    });
    return { present, absent, halfday, leave };
  }, [attendanceDataMap, currentMonth]);

  const handleCheckIn = () => {
    if (!selectedEmployeeId) return;
    const now = new Date();
    setIsCheckedIn(true);
    setCheckInTime(format(now, "hh:mm a"));
    setCheckInTimestamp(now);
    setElapsedSeconds(0);
    setClockLogs(prev => [...prev, { id: crypto.randomUUID(), type: "checkin", time: now, label: "Checked In" }]);
    clockIn.mutate({ employeeId: selectedEmployeeId });
  };
  const handleCheckOut = () => {
    if (!selectedEmployeeId) return;
    const now = new Date();
    setClockLogs(prev => [...prev, { id: crypto.randomUUID(), type: "checkout", time: now, label: "Checked Out" }]);
    setIsCheckedIn(false);
    setCheckInTime(null);
    setCheckInTimestamp(null);
    setIsOnBreak(false);
    setElapsedSeconds(0);
    clockOut.mutate({ employeeId: selectedEmployeeId });
  };
  const handleBreakToggle = () => {
    const now = new Date();
    if (isOnBreak) {
      setIsOnBreak(false);
      setClockLogs(prev => [...prev, { id: crypto.randomUUID(), type: "break_end", time: now, label: "Break Ended" }]);
    } else {
      setIsOnBreak(true);
      setClockLogs(prev => [...prev, { id: crypto.randomUUID(), type: "break_start", time: now, label: "Break Started" }]);
    }
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const calWeekDays = ["S", "M", "T", "W", "T", "F", "S"];

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];
    for (let i = 0; i < startDayOfWeek; i++) cells.push(<div key={`empty-${i}`} className="size-10" />);
    calDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      const status = attendanceDataMap[key];
      const isToday = isSameDay(day, today);
      const isWknd = isWeekend(day);
      let bgClass = isWknd ? "bg-muted/60 text-muted-foreground" : "text-foreground";
      if (status && dayColors[status]) bgClass = dayColors[status];
      if (isToday) bgClass = "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30";
      cells.push(<div key={key} className={`size-10 md:size-12 lg:h-14 lg:w-full rounded-lg flex items-center justify-center text-[13px] md:text-sm font-medium ${bgClass}`}>{format(day, "d")}</div>);
    });
    return cells;
  };

  // Ledger filter
  const filteredLedger = ledgerEmployees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()));

  // Team summary
  const teamSummary = {
    total: teamMembersData.length,
    present: teamMembersData.filter(m => m.status === "present").length,
    absent: teamMembersData.filter(m => m.status === "absent").length,
    leave: teamMembersData.filter(m => m.status === "leave" || m.status === "halfday").length,
  };

  // Report totals
  const reportTotals = reportData.reduce((acc, m) => ({
    present: acc.present + m.present, absent: acc.absent + m.absent,
    halfDay: acc.halfDay + m.halfDay, leave: acc.leave + m.leave, lateIns: acc.lateIns + m.lateIns,
  }), { present: 0, absent: 0, halfDay: 0, leave: 0, lateIns: 0 });

  return (
    
      <div className="space-y-4">
        {/* Desktop: Hero + Quick Stats side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl p-5 md:p-6 overflow-hidden lg:col-span-2"
            style={{ background: "linear-gradient(135deg, hsl(var(--sidebar-background)) 0%, hsl(var(--primary) / 0.9) 100%)" }}
          >
            <div className="absolute -top-10 -right-10 size-36 rounded-full bg-white/[0.04]" />
            <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-white/[0.03]" />
            <div className="absolute top-1/2 right-1/4 size-48 rounded-full bg-white/[0.02]" />

            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[12px] md:text-sm text-white/60">{todayStr}</p>
                <h2 className="text-lg md:text-2xl font-bold text-white mt-0.5">
                  {isCheckedIn ? "You're Checked In ✅" : "Mark Your Attendance"}
                </h2>
              </div>
              <div className="size-11 md:size-14 rounded-full border border-white/20 flex items-center justify-center">
                <Clock size={20} className="text-white/60 md:size-6" />
              </div>
            </div>

            {isCheckedIn && checkInTime && (
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-3 w-fit">
                <LogIn size={14} className="text-emerald-400" />
                <span className="text-[13px] text-white/80">Checked in at {checkInTime}</span>
              </div>
            )}

            <button
              onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
              className={`w-full md:w-auto md:px-16 py-3 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                isCheckedIn ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              {isCheckedIn ? <LogOut size={18} /> : <LogIn size={18} />}
              {isCheckedIn ? "Check Out" : "Check In"}
            </button>
          </motion.div>

          {/* Stats Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-5"
          >
            <h3 className="text-sm font-bold text-foreground mb-3">This Month</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: monthStats.present, label: "Present", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
                { val: monthStats.absent, label: "Absent", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: XCircle },
                { val: monthStats.halfday, label: "Half Day", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: Clock },
                { val: monthStats.leave, label: "Leave", color: "text-primary", bg: "bg-primary/10", icon: Palmtree },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 flex items-center gap-3`}>
                  <s.icon size={18} className={s.color} />
                  <div>
                    <span className={`text-xl font-bold ${s.color}`}>{s.val}</span>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-full p-1 overflow-x-auto scrollbar-hide">
          {(["calendar", "clockin", "ledger", "team", "report", "leave", "holidays"] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex-shrink-0 py-2 px-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "clockin" ? "Clock In/Out" : tab}
            </button>
          ))}
        </div>

        {/* ── Calendar Tab ── */}
        {activeTab === "calendar" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="size-8 md:size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition"><ChevronLeft size={16} /></button>
              <h3 className="text-[15px] md:text-lg font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="size-8 md:size-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-3">
              {calWeekDays.map((d, i) => <div key={i} className="text-center text-[12px] md:text-sm font-semibold text-muted-foreground">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">{renderCalendar()}</div>
            <div className="flex flex-wrap gap-3 md:gap-5 mt-4 md:mt-6 pt-3 md:pt-4 border-t border-border">
              {[
                { color: "bg-emerald-500", label: "Present" }, { color: "bg-red-500", label: "Absent" },
                { color: "bg-amber-500", label: "Half Day" }, { color: "bg-accent", label: "Holiday" }, { color: "bg-primary", label: "Leave" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                  <div className={`size-2.5 md:size-3 rounded-full ${l.color}`} />{l.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Clock In/Out Tab ── */}
        {activeTab === "clockin" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Desktop: Timer + Timeline side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Live Timer Card */}
              <div className="lg:col-span-3 bg-card rounded-2xl shadow-sm border border-border/50 p-5 md:p-8 text-center flex flex-col justify-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer size={20} className="text-primary" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-foreground">Today's Session</h3>
                </div>

                {/* Timer ring */}
                <div className="relative mx-auto my-6 md:my-8">
                  <div className={`size-44 md:size-56 rounded-full border-4 ${isCheckedIn ? (isOnBreak ? "border-amber-500/30" : "border-primary/30") : "border-muted"} flex items-center justify-center`}>
                    <div className={`size-36 md:size-48 rounded-full ${isCheckedIn ? (isOnBreak ? "bg-amber-500/5" : "bg-primary/5") : "bg-muted/30"} flex flex-col items-center justify-center`}>
                      <span className={`text-4xl md:text-5xl font-mono font-bold tracking-wider ${isCheckedIn ? (isOnBreak ? "text-amber-500" : "text-primary") : "text-muted-foreground"}`}>
                        {formatElapsed(elapsedSeconds)}
                      </span>
                      {isOnBreak && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] md:text-xs text-amber-500 font-semibold mt-1.5 flex items-center gap-1">
                          <Coffee size={12} /> On Break
                        </motion.p>
                      )}
                      {isCheckedIn && !isOnBreak && (
                        <p className="text-[10px] md:text-xs text-primary/60 font-medium mt-1.5">Working...</p>
                      )}
                      {!isCheckedIn && (
                        <p className="text-[10px] md:text-xs text-muted-foreground font-medium mt-1.5">Not clocked in</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status info */}
                {isCheckedIn && checkInTime && (
                  <div className="flex items-center justify-center gap-4 mb-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full"><LogIn size={12} className="text-emerald-500" /> {checkInTime}</span>
                    <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full"><MapPin size={12} /> Office</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 max-w-md mx-auto w-full">
                  {!isCheckedIn ? (
                    <button onClick={handleCheckIn}
                      className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:bg-emerald-600"
                    >
                      <Play size={18} /> Clock In
                    </button>
                  ) : (
                    <>
                      <button onClick={handleBreakToggle}
                        className={`flex-1 py-3.5 rounded-xl font-semibold text-sm md:text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all ${
                          isOnBreak ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20"
                        }`}
                      >
                        <Coffee size={18} /> {isOnBreak ? "Resume" : "Break"}
                      </button>
                      <button onClick={handleCheckOut}
                        className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-semibold text-sm md:text-base flex items-center justify-center gap-2 active:scale-[0.97] transition-all hover:bg-red-600"
                      >
                        <Square size={18} /> Clock Out
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Today's Timeline */}
              <div className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border/50 p-4 md:p-5">
                <h4 className="text-sm md:text-base font-bold text-foreground mb-4">Today's Timeline</h4>
                {clockLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No activity yet today</p>
                    <p className="text-xs mt-1">Clock in to start tracking</p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2.5 top-1 bottom-1 w-px bg-border" />
                    {[...clockLogs].reverse().map((log, i) => {
                      const iconMap = {
                        checkin: { icon: LogIn, color: "bg-emerald-500 text-white" },
                        checkout: { icon: LogOut, color: "bg-red-500 text-white" },
                        break_start: { icon: Coffee, color: "bg-amber-500 text-white" },
                        break_end: { icon: Play, color: "bg-primary text-primary-foreground" },
                      };
                      const cfg = iconMap[log.type];
                      const Icon = cfg.icon;
                      return (
                        <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="relative flex items-center gap-3"
                        >
                          <div className={`absolute -left-6 size-5 rounded-full flex items-center justify-center ${cfg.color}`}>
                            <Icon size={10} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold text-foreground">{log.label}</p>
                            <p className="text-[11px] text-muted-foreground">{format(log.time, "hh:mm:ss a")}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Daily Log History */}
            <div>
              <h4 className="text-sm md:text-base font-bold text-foreground mb-3">Daily Log History</h4>

              {/* Desktop table */}
              <div className="hidden md:block bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                <div className="grid grid-cols-6 gap-1 px-5 py-3 bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Date</span><span>Check In</span><span>Check Out</span><span>Break</span><span>Total</span><span>Status</span>
                </div>
                {dailyLogs.map((log, i) => (
                  <motion.div key={log.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-6 gap-1 px-5 py-3.5 border-b border-border/50 last:border-0 items-center text-sm hover:bg-muted/20 transition-colors"
                  >
                    <span className="font-semibold text-foreground">{log.date}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{log.checkIn}</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">{log.checkOut}</span>
                    <span className="text-muted-foreground">{log.breakTime}</span>
                    <span className="font-bold text-foreground">{log.totalHours}</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium w-fit ${
                      log.status === "On Time" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>{log.status}</span>
                  </motion.div>
                ))}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2.5">
                {dailyLogs.map((log, i) => (
                  <motion.div key={log.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-2xl shadow-sm border border-border/50 p-3.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-foreground">{log.date}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        log.status === "On Time" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>{log.status}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[9px] text-muted-foreground">In</p>
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{log.checkIn}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Out</p>
                        <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">{log.checkOut}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Break</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{log.breakTime}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground">Total</p>
                        <p className="text-[11px] font-bold text-foreground">{log.totalHours}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "ledger" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Total: <strong className="text-foreground">{ledgerEmployees.length}</strong></span>
              <span className="flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> No shows: <strong className="text-foreground">{ledgerEmployees.filter(e => e.noShows > 0).length}</strong></span>
              <span className="flex items-center gap-1.5"><TrendingDown className="h-3.5 w-3.5" /> Underworked: <strong className="text-foreground">{ledgerEmployees.filter(e => e.underworkedDays > 0).length}</strong></span>
            </div>

            {/* Week nav */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="size-8 rounded-full bg-muted flex items-center justify-center"><ChevronLeft size={16} /></button>
                <span className="text-sm font-semibold text-foreground">Mar 31 – Apr 6, 2026</span>
                <button className="size-8 rounded-full bg-muted flex items-center justify-center"><ChevronRight size={16} /></button>
              </div>
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-[140px] md:w-[200px] h-8 text-xs" />
            </div>

            {/* Mobile: Card view, Desktop: Table */}
            {/* Desktop ledger table */}
            <div className="hidden md:block bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="text-left py-3 px-4 font-semibold text-primary text-xs uppercase tracking-wider w-[180px]">Name</th>
                      {weekDates.map((date, i) => (
                        <th key={i} className="text-center py-3 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[100px]">
                          <div>{date}</div><div className="text-[10px] text-muted-foreground/70">{weekDaysShort[i]}</div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 text-xs uppercase tracking-wider text-muted-foreground">No Shows</th>
                      <th className="text-center py-3 px-2 text-xs uppercase tracking-wider text-muted-foreground">Underworked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((emp, idx) => (
                      <tr key={emp.id} className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${idx % 2 ? "bg-muted/5" : ""}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7"><AvatarFallback className={`${emp.color} text-white text-[10px] font-semibold`}>{emp.initials}</AvatarFallback></Avatar>
                            <span className="font-medium text-foreground text-[13px] whitespace-nowrap">{emp.name}</span>
                          </div>
                        </td>
                        {emp.days.map((day, di) => (
                          <td key={di} className="py-3 px-1 text-center">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${getCellStyle(day)}`}>
                              {day.hours}
                              {day.type === "underworked" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                              {day.type === "noshow" && <Ban className="h-3 w-3 text-red-500" />}
                            </span>
                          </td>
                        ))}
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block rounded-lg px-2 py-1 text-xs font-bold ${emp.noShows > 0 ? "bg-red-500/10 text-red-500" : "text-muted-foreground"}`}>{emp.noShows}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block rounded-lg px-2 py-1 text-xs font-bold ${emp.underworkedDays > 0 ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground"}`}>{emp.underworkedDays}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile ledger cards */}
            <div className="md:hidden space-y-2.5">
              {filteredLedger.map((emp, i) => (
                <motion.div key={emp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl shadow-sm border border-border/50 p-3.5"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className={`${emp.color} text-white text-xs font-semibold`}>{emp.initials}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-foreground">{emp.name}</p>
                      <div className="flex gap-3 text-[10px]">
                        {emp.noShows > 0 && <span className="text-red-500 font-semibold">{emp.noShows} no show</span>}
                        {emp.underworkedDays > 0 && <span className="text-amber-600 font-semibold">{emp.underworkedDays} underworked</span>}
                        {emp.noShows === 0 && emp.underworkedDays === 0 && <span className="text-muted-foreground">Good standing</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {emp.days.slice(0, 5).map((day, di) => (
                      <div key={di} className="text-center">
                        <p className="text-[9px] text-muted-foreground mb-0.5">{weekDaysShort[di]}</p>
                        <div className={`rounded-lg px-1.5 py-1 text-[10px] font-medium ${getCellStyle(day)}`}>
                          {day.hours === "Time off" ? "Off" : day.hours === "No show" ? "NS" : day.hours}
                        </div>
                      </div>
                    ))}
                    <div className="col-span-4 mt-1 flex gap-1.5">
                      {emp.days.slice(5).map((day, di) => (
                        <div key={di} className="flex-1 text-center">
                          <p className="text-[9px] text-muted-foreground mb-0.5">{weekDaysShort[5 + di]}</p>
                          <div className={`rounded-lg px-1.5 py-1 text-[10px] font-medium ${getCellStyle(day)}`}>
                            {day.hours === "Time off" ? "Off" : day.hours === "No show" ? "NS" : day.hours}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-emerald-500/20 border border-emerald-300" /> Worked</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-amber-500/20 border border-amber-300" /> Underworked</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-red-500/20 border border-red-300" /> No Show</div>
              <div className="flex items-center gap-1.5"><div className="size-2.5 rounded bg-muted border border-border" /> Time Off</div>
            </div>
          </motion.div>
        )}

        {/* ── Team Tab ── */}
        {activeTab === "team" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: teamSummary.total, label: "Total", color: "text-foreground", bg: "bg-muted" },
                { val: teamSummary.present, label: "Present", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                { val: teamSummary.absent, label: "Absent", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
                { val: teamSummary.leave, label: "Leave", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl py-2.5 text-center`}>
                  <span className={`text-lg font-bold ${s.color}`}>{s.val}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {teamMembers.map((member, i) => {
                const cfg = statusConfig[member.status];
                const StatusIcon = cfg.icon;
                return (
                  <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-2xl shadow-sm border border-border/50 p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[13px] font-bold text-foreground truncate">{member.name}</h5>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon size={10} />{cfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{member.role}</p>
                        {member.checkIn && (
                          <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                            <span>In: <span className="text-foreground font-medium">{member.checkIn}</span></span>
                            <span>Out: <span className="text-foreground font-medium">{member.checkOut || "—"}</span></span>
                          </div>
                        )}
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{member.present}P</span>
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">{member.absent}A</span>
                          <span className="text-[10px] text-primary font-medium">{member.leave}L</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Report Tab ── */}
        {activeTab === "report" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setReportMonth(subMonths(reportMonth, 1))} className="size-8 rounded-full bg-muted flex items-center justify-center"><ChevronLeft size={16} /></button>
                <h3 className="text-sm font-bold text-foreground">{format(reportMonth, "MMMM yyyy")}</h3>
                <button onClick={() => setReportMonth(addMonths(reportMonth, 1))} className="size-8 rounded-full bg-muted flex items-center justify-center"><ChevronRight size={16} /></button>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold"><Download size={12} /> Export</button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: reportTotals.present, label: "Present", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                { val: reportTotals.absent, label: "Absent", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
                { val: reportTotals.halfDay, label: "Half", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                { val: reportTotals.leave, label: "Leave", color: "text-primary", bg: "bg-primary/10" },
                { val: reportTotals.lateIns, label: "Late", color: "text-accent", bg: "bg-accent/10" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl py-2 text-center`}>
                  <span className={`text-base font-bold ${s.color}`}>{s.val}</span>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
              <div className="grid grid-cols-[1fr_30px_30px_30px_30px_30px] gap-1 px-3 py-2.5 bg-muted/50 border-b border-border">
                <span className="text-[10px] font-semibold text-muted-foreground">Member</span>
                <span className="text-[10px] font-semibold text-emerald-600 text-center">P</span>
                <span className="text-[10px] font-semibold text-red-600 text-center">A</span>
                <span className="text-[10px] font-semibold text-amber-600 text-center">H</span>
                <span className="text-[10px] font-semibold text-primary text-center">L</span>
                <span className="text-[10px] font-semibold text-accent text-center">Lt</span>
              </div>
              {reportData.map((member, i) => {
                const attendance = Math.round((member.present / member.workingDays) * 100);
                return (
                  <motion.div key={member.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[1fr_30px_30px_30px_30px_30px] gap-1 px-3 py-2.5 border-b border-border/50 last:border-0 items-center"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-foreground truncate">{member.name}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[9px] text-muted-foreground truncate">{member.role}</p>
                          <span className={`text-[9px] font-bold ${attendance >= 80 ? "text-emerald-600" : attendance >= 60 ? "text-amber-600" : "text-red-600"}`}>{attendance}%</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-emerald-600 text-center">{member.present}</span>
                    <span className="text-[12px] font-bold text-red-600 text-center">{member.absent}</span>
                    <span className="text-[12px] font-bold text-amber-600 text-center">{member.halfDay}</span>
                    <span className="text-[12px] font-bold text-primary text-center">{member.leave}</span>
                    <span className="text-[12px] font-bold text-accent text-center">{member.lateIns}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Leave Tab ── */}
        {activeTab === "leave" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <button
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <Send size={16} /> Apply for Leave
            </button>

            {showLeaveForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Leave Application</h4>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger><SelectValue placeholder="Select Leave Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="earned">Earned Leave</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <input type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
                  <input type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
                </div>
                <Textarea placeholder="Reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="min-h-[70px] text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowLeaveForm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={() => { setShowLeaveForm(false); setLeaveType(""); setLeaveFrom(""); setLeaveTo(""); setLeaveReason(""); }}>Submit</Button>
                </div>
              </motion.div>
            )}

            <h4 className="text-sm font-bold text-foreground">Leave History</h4>
            <div className="space-y-2.5">
              {leaveHistory.map((leave, i) => (
                <motion.div key={leave.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl shadow-sm border border-border/50 p-4"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">{leave.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${leaveStatusColor[leave.status]}`}>{leave.status}</span>
                  </div>
                  <h5 className="text-[14px] font-bold text-foreground mb-1">{leave.type}</h5>
                  <p className="text-[12px] text-muted-foreground mb-1">{leave.from} — {leave.to}</p>
                  <p className="text-[13px] text-foreground mb-1">{leave.reason}</p>
                  <p className="text-[11px] text-muted-foreground">Applied: {leave.applied}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Holidays Tab ── */}
        {activeTab === "holidays" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
            {holidays.map((h, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl shadow-sm border border-border/50 p-4 flex items-center gap-4"
              >
                <div className="size-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-primary">{h.day}</span>
                  <span className="text-[10px] font-semibold text-primary uppercase">{h.month}</span>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-bold text-foreground">{h.name}</h5>
                  <p className="text-[12px] text-muted-foreground">{h.weekday}</p>
                </div>
                <Palmtree size={18} className="text-muted-foreground/40" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    
  );
};

export default HRAttendance;
