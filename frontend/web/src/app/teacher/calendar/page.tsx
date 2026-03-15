"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  MoreHorizontal,
  Bell,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  type: "assignment" | "class" | "meeting" | "deadline" | "reminder";
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
  courseId?: string;
  courseName?: string;
  attendees?: number;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function TeacherCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Mock events data - in real app, fetch from API
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Assignment Due: Calculus Basics",
          type: "deadline",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15, 23, 59).toISOString(),
          status: "scheduled",
          courseName: "Mathematics 101",
        },
        {
          id: "2",
          title: "Live Class: Introduction to AI",
          type: "class",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12, 10, 0).toISOString(),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 12, 11, 30).toISOString(),
          location: "Room 301",
          courseName: "AI Fundamentals",
          attendees: 45,
          status: "scheduled",
        },
        {
          id: "3",
          title: "Faculty Meeting",
          type: "meeting",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 14, 14, 0).toISOString(),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 14, 15, 30).toISOString(),
          location: "Conference Room A",
          status: "scheduled",
        },
        {
          id: "4",
          title: "Office Hours",
          type: "class",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10, 15, 0).toISOString(),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10, 17, 0).toISOString(),
          location: "Office 205",
          status: "scheduled",
        },
        {
          id: "5",
          title: "Quiz: Data Structures",
          type: "assignment",
          startTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 9, 0).toISOString(),
          endTime: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18, 10, 0).toISOString(),
          courseName: "Computer Science",
          status: "scheduled",
        },
      ];
      setEvents(mockEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "assignment":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "class":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "meeting":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "deadline":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "reminder":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return "📝";
      case "class":
        return "📚";
      case "meeting":
        return "👥";
      case "deadline":
        return "⏰";
      case "reminder":
        return "🔔";
      default:
        return "📅";
    }
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-white/5 bg-white/[0.02]" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={cn(
            "h-24 border border-white/5 p-2 text-left transition-all hover:bg-white/5",
            isSelected && "bg-amber-500/10 border-amber-500/30",
            isToday && !isSelected && "bg-white/5 border-amber-500/20"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={cn(
                "text-sm font-medium",
                isToday ? "text-amber-400" : "text-white",
                isSelected && "text-amber-400"
              )}
            >
              {day}
            </span>
            {isToday && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                Today
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded truncate",
                  getEventTypeColor(event.type)
                )}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[10px] text-gray-400 px-1.5">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-gray-400">Manage your schedule, classes, and deadlines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  viewMode === mode
                    ? "bg-amber-500 text-black"
                    : "text-gray-400 hover:text-white"
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-xl font-bold text-white min-w-[200px] text-center">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
        >
          Today
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-v2 border-white/5 rounded-2xl p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden">
            {renderCalendarGrid()}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-white/10">
            {[
              { type: "class", label: "Class" },
              { type: "assignment", label: "Assignment" },
              { type: "deadline", label: "Deadline" },
              { type: "meeting", label: "Meeting" },
              { type: "reminder", label: "Reminder" },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", getEventTypeColor(type).split(" ")[0])} />
                <span className="text-sm text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="glass-v2 border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <p className="text-sm text-gray-400">{selectedDateEvents.length} events</p>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    getEventTypeColor(event.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getEventTypeIcon(event.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-white">{event.title}</p>
                      {event.courseName && (
                        <p className="text-sm opacity-80">{event.courseName}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {event.endTime &&
                            ` - ${new Date(event.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        {event.attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.attendees} attendees
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No events scheduled</p>
                <button className="mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium">
                  + Add Event
                </button>
              </div>
            )}
          </div>

          {/* Upcoming Events Summary */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Upcoming This Week</h3>
            <div className="space-y-2">
              {events
                .filter((e) => new Date(e.startTime) > new Date())
                .slice(0, 3)
                .map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        getEventTypeColor(event.type).split(" ")[0]
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{event.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.startTime).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
