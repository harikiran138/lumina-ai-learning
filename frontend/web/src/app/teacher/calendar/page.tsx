"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  BookOpen,
  ClipboardCheck,
  Users,
  X,
  Loader2,
  CalendarDays,
  Video,
  MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─────────────────────────── types ─────────────────────────── */
type EventType = "class" | "assignment" | "office-hours" | "meeting" | "exam";

interface CalEvent {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM"
  endTime?: string;
  type: EventType;
  courseId?: string;
  courseName?: string;
  location?: string;
  description?: string;
  isExternal?: boolean; // came from API (assignments etc.)
}

const TYPE_META: Record<EventType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  class:          { label: "Class",         color: "text-blue-400",   bg: "bg-blue-500/15 border-blue-500/30",   icon: Video },
  assignment:     { label: "Assignment Due", color: "text-amber-400",  bg: "bg-amber-500/15 border-amber-500/30", icon: ClipboardCheck },
  "office-hours": { label: "Office Hours",  color: "text-green-400",  bg: "bg-green-500/15 border-green-500/30", icon: Users },
  meeting:        { label: "Meeting",       color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30",icon: Users },
  exam:           { label: "Exam",          color: "text-red-400",    bg: "bg-red-500/15 border-red-500/30",     icon: ClipboardCheck },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* ─────────────────────────── helpers ─────────────────────────── */
function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ─────────────────────────── page ─────────────────────────── */
export default function FacultyCalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [view, setView] = useState<"month" | "week" | "agenda">("month");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<CalEvent> | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

  /* ── seed local storage key ── */
  const STORAGE_KEY = "lumina_faculty_calendar_events";

  /* ── load stored + API events ── */
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Load locally stored events
      let stored: CalEvent[] = [];
      try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch {}

      // Fetch assignments to surface due dates
      const [assignments, courseList] = await Promise.all([
        api.getTeacherAssignments().catch(() => []),
        api.listCourses().catch(() => []),
      ]);
      setCourses(courseList);

      const assignmentEvents: CalEvent[] = (assignments ?? [])
        .filter((a: any) => a.due_date)
        .map((a: any) => ({
          id: `assignment-${a.id}`,
          title: a.title,
          date: toYMD(new Date(a.due_date)),
          time: new Date(a.due_date).toTimeString().slice(0, 5),
          type: "assignment" as EventType,
          courseId: a.course_id,
          courseName: a.course_name || courseList.find((c: any) => c.id === a.course_id)?.name,
          description: a.description,
          isExternal: true,
        }));

      setEvents([...stored, ...assignmentEvents]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  /* ── persist local events ── */
  const saveLocalEvents = (evts: CalEvent[]) => {
    const local = evts.filter((e) => !e.isExternal);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
  };

  /* ── navigation ── */
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  /* ── event helpers ── */
  const eventsOn = (dateStr: string) => events.filter((e) => e.date === dateStr);

  const openCreateModal = (date?: string) => {
    setEditingEvent({ date: date ?? toYMD(today), type: "class" });
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleSaveEvent = (evt: CalEvent) => {
    setEvents((prev) => {
      const filtered = prev.filter((e) => e.id !== evt.id);
      const next = [...filtered, evt];
      saveLocalEvents(next);
      return next;
    });
    toast.success(editingEvent?.id ? "Event updated" : "Event created");
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocalEvents(next);
      return next;
    });
    toast.success("Event removed");
    setSelectedEvent(null);
  };

  /* ── calendar grid ── */
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const todayStr = toYMD(today);

  /* ── agenda: next 30 days ── */
  const agendaEvents = events
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => (a.date + (a.time ?? "00:00")).localeCompare(b.date + (b.time ?? "00:00")))
    .slice(0, 60);

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Calendar</h1>
          <p className="text-gray-400 text-sm">Schedule classes, track deadlines, manage office hours.</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      {/* ── View controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <button onClick={prevMonth} className="p-1 hover:text-white text-gray-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white font-semibold text-sm min-w-[140px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1 hover:text-white text-gray-400 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 bg-white/5 rounded-xl transition-colors"
        >
          Today
        </button>

        {/* View toggle */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 ml-auto">
          {(["month", "week", "agenda"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                view === v
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-gray-400 hover:text-white"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([type, meta]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className={cn("w-2 h-2 rounded-full", meta.color.replace("text-", "bg-"))} />
            {meta.label}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Month view ── */}
          {view === "month" && (
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-white/10">
                {DAYS.map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {d}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }).map((_, i) => {
                  const dayNum = i - firstDay + 1;
                  const isValid = dayNum >= 1 && dayNum <= daysInMonth;
                  const dateStr = isValid
                    ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                    : null;
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const dayEvents = dateStr ? eventsOn(dateStr) : [];

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (!isValid || !dateStr) return;
                        setSelectedDate(dateStr === selectedDate ? null : dateStr);
                      }}
                      className={cn(
                        "min-h-[90px] p-2 border-b border-r border-white/5 transition-colors cursor-pointer",
                        !isValid && "opacity-30 pointer-events-none",
                        isSelected && "bg-amber-500/10",
                        isValid && !isSelected && "hover:bg-white/[0.03]",
                      )}
                    >
                      {isValid && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
                                isToday
                                  ? "bg-amber-500 text-black"
                                  : "text-gray-300"
                              )}
                            >
                              {dayNum}
                            </span>
                            {dayEvents.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openCreateModal(dateStr!); }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map((evt) => {
                              const meta = TYPE_META[evt.type];
                              return (
                                <button
                                  key={evt.id}
                                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(evt); setSelectedDate(null); }}
                                  className={cn(
                                    "w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate border transition-all hover:opacity-90",
                                    meta.bg, meta.color
                                  )}
                                >
                                  {evt.time && <span className="opacity-70 mr-1">{evt.time}</span>}
                                  {evt.title}
                                </button>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <span className="text-[10px] text-gray-500 pl-1">+{dayEvents.length - 3} more</span>
                            )}
                          </div>
                          {dayEvents.length === 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openCreateModal(dateStr!); }}
                              className="mt-1 w-full text-[10px] text-gray-600 hover:text-gray-400 opacity-0 hover:opacity-100 transition-all text-center"
                            >
                              + add
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Week view ── */}
          {view === "week" && (
            <WeekView
              viewYear={viewYear}
              viewMonth={viewMonth}
              today={todayStr}
              events={events}
              onEventClick={setSelectedEvent}
              onAddClick={openCreateModal}
            />
          )}

          {/* ── Agenda view ── */}
          {view === "agenda" && (
            <div className="space-y-3">
              {agendaEvents.length === 0 ? (
                <EmptyState message="No upcoming events" />
              ) : (
                agendaEvents.map((evt) => (
                  <AgendaRow key={evt.id} event={evt} onEdit={() => { setEditingEvent(evt); setShowModal(true); }} onDelete={() => handleDeleteEvent(evt.id)} />
                ))
              )}
            </div>
          )}

          {/* ── Selected date panel ── */}
          {selectedDate && view === "month" && (
            <DateDetailPanel
              date={selectedDate}
              events={eventsOn(selectedDate)}
              onAdd={() => openCreateModal(selectedDate)}
              onEventClick={setSelectedEvent}
            />
          )}
        </>
      )}

      {/* ── Event detail modal ── */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => { setEditingEvent(selectedEvent); setSelectedEvent(null); setShowModal(true); }}
          onDelete={!selectedEvent.isExternal ? () => handleDeleteEvent(selectedEvent.id) : undefined}
        />
      )}

      {/* ── Create / edit modal ── */}
      {showModal && editingEvent !== null && (
        <EventFormModal
          initial={editingEvent}
          courses={courses}
          onSave={handleSaveEvent}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── WeekView ─────────────────────────── */
function WeekView({
  viewYear, viewMonth, today, events, onEventClick, onAddClick,
}: {
  viewYear: number; viewMonth: number; today: string;
  events: CalEvent[];
  onEventClick: (e: CalEvent) => void;
  onAddClick: (date: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = new Date(viewYear, viewMonth, 1);
  // find current week's Sunday
  const todayDate = new Date();
  const sundayOfWeek = new Date(todayDate);
  sundayOfWeek.setDate(todayDate.getDate() - todayDate.getDay() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sundayOfWeek);
    d.setDate(sundayOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-300 font-medium">
          {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={() => setWeekOffset(0)} className="ml-1 px-3 py-1 text-xs border border-white/10 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
          This week
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((d) => {
          const dateStr = toYMD(d);
          const isToday = dateStr === today;
          const dayEvts = events.filter((e) => e.date === dateStr);
          return (
            <div key={dateStr} className={cn(
              "bg-white/5 border rounded-2xl p-3 min-h-[140px] flex flex-col gap-2 transition-colors",
              isToday ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 hover:bg-white/[0.07]"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-medium uppercase">{DAYS[d.getDay()]}</div>
                  <div className={cn("text-lg font-bold", isToday ? "text-amber-400" : "text-white")}>{d.getDate()}</div>
                </div>
                <button onClick={() => onAddClick(dateStr)} className="p-1 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvts.map((evt) => {
                  const meta = TYPE_META[evt.type];
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick(evt)}
                      className={cn("w-full text-left px-1.5 py-1 rounded-lg text-[11px] font-medium truncate border", meta.bg, meta.color)}
                    >
                      {evt.time && <span className="opacity-60 mr-1">{evt.time}</span>}
                      {evt.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── DateDetailPanel ─────────────────────────── */
function DateDetailPanel({ date, events, onAdd, onEventClick }: {
  date: string; events: CalEvent[];
  onAdd: () => void; onEventClick: (e: CalEvent) => void;
}) {
  const d = new Date(date + "T00:00:00");
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors border border-amber-500/30"
        >
          <Plus className="w-3 h-3" /> Add Event
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-6">No events on this day.</p>
      ) : (
        <div className="space-y-2">
          {events.sort((a, b) => (a.time ?? "00:00").localeCompare(b.time ?? "00:00")).map((evt) => (
            <AgendaRow key={evt.id} event={evt} onEdit={() => onEventClick(evt)} onDelete={() => {}} compact />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── AgendaRow ─────────────────────────── */
function AgendaRow({ event, onEdit, onDelete, compact }: {
  event: CalEvent; onEdit: () => void; onDelete: () => void; compact?: boolean;
}) {
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
        meta.bg,
        !compact && "hover:scale-[1.01]"
      )}
      onClick={onEdit}
    >
      <div className={cn("p-2 rounded-xl bg-black/20 shrink-0", meta.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-white truncate">{event.title}</h4>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/20", meta.color)}>{meta.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <CalendarDays className="w-3 h-3" />
            {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
          {event.time && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {event.time}{event.endTime ? ` – ${event.endTime}` : ""}
            </div>
          )}
          {event.courseName && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <BookOpen className="w-3 h-3" />
              {event.courseName}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3" />
              {event.location}
            </div>
          )}
        </div>
      </div>
      {!event.isExternal && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────── EventDetailModal ─────────────────────────── */
function EventDetailModal({ event, onClose, onEdit, onDelete }: {
  event: CalEvent; onClose: () => void; onEdit: () => void; onDelete?: () => void;
}) {
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#09090b] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={cn("p-3 rounded-xl bg-black/30 shrink-0", meta.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{event.title}</h2>
            <span className={cn("text-xs font-medium", meta.color)}>{meta.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Date" value={new Date(event.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} />
          {event.time && <InfoRow icon={<Clock className="w-4 h-4" />} label="Time" value={`${event.time}${event.endTime ? ` – ${event.endTime}` : ""}`} />}
          {event.courseName && <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course" value={event.courseName} />}
          {event.location && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value={event.location} />}
          {event.description && (
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-gray-400 text-xs leading-relaxed">{event.description}</p>
            </div>
          )}
          {event.isExternal && (
            <p className="text-[11px] text-gray-600 italic">Synced from Assignments</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          {!event.isExternal && onDelete && (
            <button onClick={onDelete} className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors">
              Delete
            </button>
          )}
          {!event.isExternal && (
            <button onClick={onEdit} className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all">
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-500 mt-0.5 shrink-0">{icon}</span>
      <div>
        <span className="text-gray-500 text-xs">{label}</span>
        <p className="text-gray-200">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────── EventFormModal ─────────────────────────── */
function EventFormModal({
  initial, courses, onSave, onClose,
}: {
  initial: Partial<CalEvent>; courses: any[];
  onSave: (evt: CalEvent) => void; onClose: () => void;
}) {
  const isEdit = !!initial.id;
  const [form, setForm] = useState<Partial<CalEvent>>({
    type: "class",
    ...initial,
  });

  const set = (key: keyof CalEvent, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error("Title and date are required");
      return;
    }
    onSave({
      ...form,
      id: form.id ?? `local-${Date.now()}`,
    } as CalEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-[#09090b] border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{isEdit ? "Edit Event" : "New Event"}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Title *</label>
          <input
            required
            value={form.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Lecture: Chapter 5"
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
        </div>

        {/* Type + Course */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Type *</label>
            <select
              value={form.type ?? "class"}
              onChange={(e) => set("type", e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            >
              {(Object.entries(TYPE_META) as [EventType, typeof TYPE_META[EventType]][]).map(([k, v]) => (
                <option key={k} value={k} className="bg-gray-900">{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Course</label>
            <select
              value={form.courseId ?? ""}
              onChange={(e) => {
                const course = courses.find((c) => c.id === e.target.value);
                setForm((f) => ({ ...f, courseId: e.target.value, courseName: course?.name ?? "" }));
              }}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            >
              <option value="" className="bg-gray-900">None</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Date *</label>
            <input
              required
              type="date"
              value={form.date ?? ""}
              onChange={(e) => set("date", e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Start</label>
            <input
              type="time"
              value={form.time ?? ""}
              onChange={(e) => set("time", e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">End</label>
            <input
              type="time"
              value={form.endTime ?? ""}
              onChange={(e) => set("endTime", e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Location / Link</label>
          <input
            value={form.location ?? ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Room 301 or Zoom link"
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Notes</label>
          <textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Optional notes..."
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            {isEdit ? "Save Changes" : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─────────────────────────── EmptyState ─────────────────────────── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-7 h-7 text-gray-600" />
      </div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
