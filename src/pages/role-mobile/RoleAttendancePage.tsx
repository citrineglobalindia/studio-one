import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon, Clock, LogIn, LogOut, TreePalm, Send,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isToday, addMonths, subMonths, isBefore,
} from "date-fns";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";
import { Navigate } from "react-router-dom";

type DayStatus = "present" | "absent" | "half-day" | "holiday" | "leave" | "weekend" | null;

interface LeaveRequest {
  id: string;
  type: string;
  from: string;
  to: string;
  reason: string;
  status: "Approved" | "Pending" | "Rejected";
  appliedOn: string;
}

const today = new Date();
const Y = today.getFullYear();

const holidays = [
  { date: new Date(Y, 0, 26), name: "Republic Day" },
  { date: new Date(Y, 2, 14), name: "Holi" },
  { date: new Date(Y, 3, 14), name: "Ambedkar Jayanti" },
  { date: new Date(Y, 3, 18), name: "Good Friday" },
  { date: new Date(Y, 4, 1), name: "May Day" },
  { date: new Date(Y, 7, 15), name: "Independence Day" },
  { date: new Date(Y, 9, 2), name: "Gandhi Jayanti" },
  { date: new Date(Y, 10, 12), name: "Diwali" },
  { date: new Date(Y, 11, 25), name: "Christmas" },
];

// Sample attendance entries seeded around current month
const seedAttendance = (): Record<string, DayStatus> => {
  const data: Record<string, DayStatus> = {};
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  eachDayOfInterval({ start, end }).forEach((d, i) => {
    if (isBefore(d, today)) {
      const w = getDay(d);
      if (w === 0 || w === 6) data[format(d, "yyyy-MM-dd")] = "weekend";
      else if (i % 11 === 4) data[format(d, "yyyy-MM-dd")] = "absent";
      else if (i % 9 === 5) data[format(d, "yyyy-MM-dd")] = "half-day";
      else if (i % 13 === 7) data[format(d, "yyyy-MM-dd")] = "leave";
      else data[format(d, "yyyy-MM-dd")] = "present";
    }
  });
  return data;
};

const leaveRequests: LeaveRequest[] = [
  { id: "LV-001", type: "Casual Leave", from: format(new Date(Y, today.getMonth(), 12), "dd MMM yyyy"), to: format(new Date(Y, today.getMonth(), 12), "dd MMM yyyy"), reason: "Personal work", status: "Approved", appliedOn: format(new Date(Y, today.getMonth(), 10), "dd MMM yyyy") },
  { id: "LV-002", type: "Sick Leave", from: format(new Date(Y, today.getMonth(), 22), "dd MMM yyyy"), to: format(new Date(Y, today.getMonth(), 23), "dd MMM yyyy"), reason: "Not feeling well", status: "Pending", appliedOn: format(new Date(Y, today.getMonth(), 18), "dd MMM yyyy") },
  { id: "LV-003", type: "Earned Leave", from: format(new Date(Y, today.getMonth(), 28), "dd MMM yyyy"), to: format(new Date(Y, today.getMonth(), 30), "dd MMM yyyy"), reason: "Family function", status: "Rejected", appliedOn: format(new Date(Y, today.getMonth(), 5), "dd MMM yyyy") },
];

const leaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave", "Compensatory Off"];
const tabs = ["Calendar", "Leave", "Holidays"] as const;
type Tab = typeof tabs[number];

const statusColors: Record<Exclude<DayStatus, null>, { bg: string; text: string; label: string }> = {
  present: { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", label: "Present" },
  absent: { bg: "bg-destructive/15", text: "text-destructive", label: "Absent" },
  "half-day": { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", label: "Half Day" },
  holiday: { bg: "bg-primary/15", text: "text-primary", label: "Holiday" },
  leave: { bg: "bg-accent", text: "text-accent-foreground", label: "Leave" },
  weekend: { bg: "bg-muted", text: "text-muted-foreground", label: "Weekend" },
};

export default function RoleAttendancePage() {
  const { currentRole } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>("Calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date(Y, today.getMonth(), 1));
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: "", from: "", to: "", reason: "" });

  const attendanceData = useMemo(seedAttendance, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);

  const stats = useMemo(() => {
    const vals = Object.values(attendanceData);
    return {
      present: vals.filter((v) => v === "present").length,
      absent: vals.filter((v) => v === "absent").length,
      halfDay: vals.filter((v) => v === "half-day").length,
      leave: vals.filter((v) => v === "leave").length,
    };
  }, [attendanceData]);

  const handleCheckIn = () => {
    const now = format(new Date(), "hh:mm a");
    setCheckedIn(true);
    setCheckInTime(now);
    toast.success("Checked in at " + now);
  };
  const handleCheckOut = () => {
    setCheckedIn(false);
    setCheckInTime(null);
    toast.success("Checked out");
  };
  const handleLeaveSubmit = () => {
    setShowLeaveForm(false);
    setLeaveForm({ type: "", from: "", to: "", reason: "" });
    toast.success("Leave application submitted");
  };

  // Vendors don't get attendance
  if (currentRole === "vendor") return <Navigate to="/m" replace />;

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Check-in/out Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 mb-4 bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-lg"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] opacity-80">{format(new Date(), "EEEE, dd MMM yyyy")}</p>
            <h3 className="text-[18px] font-extrabold">
              {checkedIn ? "You're Checked In" : "Mark Attendance"}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {checkedIn && checkInTime && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-white/15 rounded-xl">
            <LogIn size={14} />
            <span className="text-[12px]">Checked in at {checkInTime}</span>
          </div>
        )}

        <div className="flex gap-3">
          {!checkedIn ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white rounded-xl text-[13px] font-bold text-primary"
            >
              <LogIn size={16} /> Check In
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckOut}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-destructive rounded-xl text-[13px] font-bold text-destructive-foreground"
            >
              <LogOut size={16} /> Check Out
            </motion.button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Present", value: stats.present },
            { label: "Absent", value: stats.absent },
            { label: "Half", value: stats.halfDay },
            { label: "Leave", value: stats.leave },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 bg-white/10 rounded-xl">
              <span className="text-[18px] font-extrabold">{s.value}</span>
              <p className="text-[9px] opacity-80 mt-0.5 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex gap-0 bg-muted rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* CALENDAR TAB */}
        {activeTab === "Calendar" && (
          <motion.div key="calendar" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="bg-card border border-border rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-secondary">
                  <ChevronLeft size={18} className="text-muted-foreground" />
                </button>
                <h4 className="text-[14px] font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h4>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-secondary">
                  <ChevronRight size={18} className="text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i} className="text-center text-[10px] font-semibold text-muted-foreground">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const status = attendanceData[key];
                  const isHoliday = holidays.some((h) => isSameDay(h.date, day));
                  const dayStatus: DayStatus =
                    status || (isHoliday ? "holiday" : (getDay(day) === 0 || getDay(day) === 6 ? "weekend" : null));
                  const config = dayStatus ? statusColors[dayStatus] : null;
                  const isCurrent = isToday(day);
                  return (
                    <div
                      key={key}
                      className={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium ${
                        config ? `${config.bg} ${config.text}` : "text-foreground"
                      } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                    >
                      {day.getDate()}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                {Object.entries(statusColors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${val.bg} ring-1 ring-border`} />
                    <span className="text-[10px] text-muted-foreground">{val.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* LEAVE TAB */}
        {activeTab === "Leave" && (
          <motion.div key="leave" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowLeaveForm(!showLeaveForm)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-[13px] mb-4 flex items-center justify-center gap-2"
            >
              <Send size={16} /> Apply for Leave
            </motion.button>

            <AnimatePresence>
              {showLeaveForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                    <h4 className="text-[13px] font-semibold text-foreground">Leave Application</h4>
                    <select
                      value={leaveForm.type}
                      onChange={(e) => setLeaveForm((p) => ({ ...p, type: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-background rounded-lg ring-1 ring-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={leaveForm.from}
                        onChange={(e) => setLeaveForm((p) => ({ ...p, from: e.target.value }))}
                        className="px-3 py-2.5 bg-background rounded-lg ring-1 ring-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="date"
                        value={leaveForm.to}
                        onChange={(e) => setLeaveForm((p) => ({ ...p, to: e.target.value }))}
                        className="px-3 py-2.5 bg-background rounded-lg ring-1 ring-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                      rows={2}
                      placeholder="Reason for leave..."
                      className="w-full px-3 py-2.5 bg-background rounded-lg ring-1 ring-border text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-[10px] font-semibold text-primary mb-1.5 uppercase tracking-wider">Approval Flow</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {["You", "Team Lead", "HR", "Admin"].map((role, idx, arr) => (
                          <span key={role} className="flex items-center gap-1">
                            <span className="text-[9px] font-medium text-foreground bg-background px-2 py-0.5 rounded-full border border-border">{role}</span>
                            {idx < arr.length - 1 && <ChevronRight size={8} className="text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowLeaveForm(false)}
                        className="flex-1 py-2.5 rounded-lg bg-muted text-foreground text-[12px] font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleLeaveSubmit}
                        disabled={!leaveForm.type || !leaveForm.from || !leaveForm.reason}
                        className={`flex-1 py-2.5 rounded-lg text-[12px] font-semibold ${
                          leaveForm.type && leaveForm.from && leaveForm.reason
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <h4 className="text-[13px] font-bold text-foreground mb-3">Leave History</h4>
            <div className="space-y-3">
              {leaveRequests.map((req, idx) => {
                const sColor =
                  req.status === "Approved"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15"
                    : req.status === "Pending"
                    ? "text-amber-600 dark:text-amber-400 bg-amber-500/15"
                    : "text-destructive bg-destructive/15";
                const SIcon = req.status === "Approved" ? CheckCircle2 : req.status === "Pending" ? Clock : XCircle;
                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground">{req.id}</span>
                        <h4 className="text-[13px] font-semibold text-foreground">{req.type}</h4>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sColor}`}>
                        <SIcon size={10} /> {req.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                      <CalendarIcon size={11} /> {req.from} — {req.to}
                    </div>
                    <p className="text-[11px] text-foreground">{req.reason}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Applied: {req.appliedOn}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* HOLIDAYS TAB */}
        {activeTab === "Holidays" && (
          <motion.div key="holidays" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="space-y-2">
              {holidays.map((holiday, idx) => {
                const isPast = isBefore(holiday.date, new Date());
                return (
                  <motion.div
                    key={holiday.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`bg-card border border-border rounded-2xl p-4 flex items-center gap-4 ${isPast ? "opacity-50" : ""}`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/15 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[14px] font-bold text-primary leading-none">{format(holiday.date, "dd")}</span>
                      <span className="text-[9px] font-semibold text-primary uppercase mt-0.5">{format(holiday.date, "MMM")}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[13px] font-semibold text-foreground">{holiday.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{format(holiday.date, "EEEE")}</p>
                    </div>
                    <TreePalm size={18} className={isPast ? "text-muted-foreground" : "text-primary"} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
