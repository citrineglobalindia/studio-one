import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Users, Clock, Filter, Search, UserPlus, X, Check, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { sampleClients, type ClientEvent } from "@/data/clients-data";
import { cn } from "@/lib/utils";

interface EventWithClient extends ClientEvent {
  clientName: string;
  clientId: string;
  assignedTeam: TeamMember[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

const teamMembers: TeamMember[] = [
  { id: "t1", name: "Arjun Mehta", role: "Lead Photographer", avatar: "AM" },
  { id: "t2", name: "Sneha Patil", role: "Videographer", avatar: "SP" },
  { id: "t3", name: "Vikram Joshi", role: "Editor", avatar: "VJ" },
  { id: "t4", name: "Riya Das", role: "Assistant Photographer", avatar: "RD" },
  { id: "t5", name: "Karan Singh", role: "Drone Operator", avatar: "KS" },
  { id: "t6", name: "Meera Nair", role: "Makeup & Styling", avatar: "MN" },
  { id: "t7", name: "Rohit Verma", role: "Lighting Technician", avatar: "RV" },
  { id: "t8", name: "Ananya Gupta", role: "Second Shooter", avatar: "AG" },
];

const eventEmojis: Record<string, string> = {
  wedding: "💒",
  mehendi: "🌿",
  haldi: "💛",
  sangeet: "💃",
  reception: "🥂",
  engagement: "💍",
  "pre-wedding": "📸",
  other: "🎉",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  upcoming: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Upcoming" },
  "in-progress": { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "In Progress" },
  completed: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Completed" },
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    clientId: "", name: "", type: "wedding" as ClientEvent["type"],
    date: "", venue: "", notes: "",
  });
  const [extraEvents, setExtraEvents] = useState<EventWithClient[]>([]);

  const allEvents: EventWithClient[] = useMemo(() => {
    return sampleClients.flatMap(client =>
      client.events.map(event => ({
        ...event,
        clientName: client.name,
        clientId: client.id,
        assignedTeam: (assignments[event.id] || [])
          .map(tid => teamMembers.find(t => t.id === tid)!)
          .filter(Boolean),
      }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [assignments]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchSearch =
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.clientName.toLowerCase().includes(search.toLowerCase()) ||
        event.venue.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || event.type === filterType;
      const matchTab =
        activeTab === "all" ||
        (activeTab === "upcoming" && event.status === "upcoming") ||
        (activeTab === "in-progress" && event.status === "in-progress") ||
        (activeTab === "completed" && event.status === "completed") ||
        (activeTab === "unassigned" && (!assignments[event.id] || assignments[event.id].length === 0));
      return matchSearch && matchType && matchTab;
    });
  }, [allEvents, search, filterType, activeTab, assignments]);

  const stats = useMemo(() => ({
    total: allEvents.length,
    upcoming: allEvents.filter(e => e.status === "upcoming").length,
    inProgress: allEvents.filter(e => e.status === "in-progress").length,
    unassigned: allEvents.filter(e => !assignments[e.id] || assignments[e.id].length === 0).length,
  }), [allEvents, assignments]);

  const openAssignSheet = (event: EventWithClient) => {
    setSelectedEvent(event);
    setAssignSheetOpen(true);
  };

  const toggleMember = (eventId: string, memberId: string) => {
    setAssignments(prev => {
      const current = prev[eventId] || [];
      const updated = current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId];
      return { ...prev, [eventId]: updated };
    });
  };

  const saveAssignment = () => {
    if (selectedEvent) {
      const count = assignments[selectedEvent.id]?.length || 0;
      toast.success(`${count} team member${count !== 1 ? "s" : ""} assigned to ${selectedEvent.name}`);
    }
    setAssignSheetOpen(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all client events & assign your team</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, icon: CalendarDays, color: "text-primary" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-blue-500" },
          { label: "In Progress", value: stats.inProgress, icon: MapPin, color: "text-amber-500" },
          { label: "Unassigned", value: stats.unassigned, icon: Users, color: "text-red-500" },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, clients, venues..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="wedding">💒 Wedding</SelectItem>
            <SelectItem value="mehendi">🌿 Mehendi</SelectItem>
            <SelectItem value="haldi">💛 Haldi</SelectItem>
            <SelectItem value="sangeet">💃 Sangeet</SelectItem>
            <SelectItem value="reception">🥂 Reception</SelectItem>
            <SelectItem value="engagement">💍 Engagement</SelectItem>
            <SelectItem value="pre-wedding">📸 Pre-Wedding</SelectItem>
            <SelectItem value="other">🎉 Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="in-progress">Active</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <Card className="border-dashed border-border/50">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No events found</p>
                    <p className="text-sm mt-1">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                filteredEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-border/50 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          {/* Event Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="text-2xl mt-0.5">{eventEmojis[event.type] || "🎉"}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
                                <Badge variant="outline" className={statusConfig[event.status]?.color}>
                                  {statusConfig[event.status]?.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Client: <span className="font-medium text-foreground">{event.clientName}</span>
                              </p>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(event.date).toLocaleDateString("en-IN", {
                                    day: "numeric", month: "short", year: "numeric",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.venue}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Assigned Team */}
                          <div className="flex items-center gap-2">
                            {event.assignedTeam.length > 0 ? (
                              <div className="flex -space-x-2">
                                {event.assignedTeam.slice(0, 4).map(member => (
                                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                      {member.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {event.assignedTeam.length > 4 && (
                                  <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                    +{event.assignedTeam.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No team assigned</span>
                            )}
                            <Button
                              size="sm"
                              variant={event.assignedTeam.length > 0 ? "outline" : "default"}
                              className="shrink-0"
                              onClick={() => openAssignSheet(event)}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                              {event.assignedTeam.length > 0 ? "Edit" : "Assign"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Assign Team Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-left">
              Assign Team
              {selectedEvent && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  {eventEmojis[selectedEvent.type]} {selectedEvent.name} — {selectedEvent.clientName}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedEvent && (
            <div className="mt-6 space-y-4">
              {/* Event Summary */}
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-3 flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {new Date(selectedEvent.date).toLocaleDateString("en-IN", {
                      weekday: "short", day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="truncate">{selectedEvent.venue}</span>
                </CardContent>
              </Card>

              {/* Team List */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Select Team Members</p>
                {teamMembers.map(member => {
                  const isAssigned = (assignments[selectedEvent.id] || []).includes(member.id);
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isAssigned
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 hover:bg-muted/50"
                      }`}
                      onClick={() => toggleMember(selectedEvent.id, member.id)}
                    >
                      <Checkbox checked={isAssigned} className="pointer-events-none" />
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      {isAssigned && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <Button className="w-full mt-4" onClick={saveAssignment}>
                <Check className="h-4 w-4 mr-2" />
                Save Assignment ({(assignments[selectedEvent.id] || []).length} selected)
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
