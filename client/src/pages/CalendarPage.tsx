import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Calendar, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Workshop } from "@shared/schema";

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const HEBREW_DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "מתוכנן",
  confirmed: "מאושר",
  completed: "הושלם",
  cancelled: "בוטל",
};

const STATUS_DOT: Record<string, string> = {
  planned: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-400",
};

export default function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const workshopsByDate: Record<string, Workshop[]> = {};
  for (const ws of workshops) {
    if (!ws.date) continue;
    const d = new Date(ws.date);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const key = d.getDate().toString();
      if (!workshopsByDate[key]) workshopsByDate[key] = [];
      workshopsByDate[key].push(ws);
    }
  }

  const selectedDateWorkshops = selectedDate ? (workshopsByDate[selectedDate] ?? []) : [];

  const todayStr = today.getFullYear() === viewYear && today.getMonth() === viewMonth
    ? today.getDate().toString()
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">לוח שנה</h2>
          <p className="text-muted-foreground mt-1">תצוגת סדנאות לפי חודש</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-stone p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
            <h3 className="text-xl font-bold">
              {HEBREW_MONTHS[viewMonth]} {viewYear}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {HEBREW_DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = (i + 1).toString();
              const hasWorkshops = !!workshopsByDate[day];
              const isToday = day === todayStr;
              const isSelected = day === selectedDate;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-start pt-1.5 rounded-xl text-sm font-medium transition-all
                    ${isSelected ? "bg-brand-blue text-white shadow-md" : ""}
                    ${isToday && !isSelected ? "bg-brand-yellow/20 font-bold" : ""}
                    ${!isSelected && !isToday ? "hover:bg-gray-100" : ""}
                  `}
                >
                  <span>{i + 1}</span>
                  {hasWorkshops && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                      {workshopsByDate[day].slice(0, 3).map((ws, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : STATUS_DOT[ws.status] ?? "bg-gray-400"}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[key]}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-stone p-6">
          {selectedDate ? (
            <>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-brand-blue" />
                {selectedDate} {HEBREW_MONTHS[viewMonth]}
              </h3>
              {selectedDateWorkshops.length === 0 ? (
                <p className="text-muted-foreground text-sm">אין סדנאות ביום זה</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateWorkshops.map(ws => (
                    <div key={ws.id} className="border rounded-xl p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug">{ws.title}</p>
                        <Badge className={`${STATUS_COLORS[ws.status]} border-0 text-xs shrink-0`}>
                          {STATUS_LABELS[ws.status] ?? ws.status}
                        </Badge>
                      </div>
                      {ws.clientName && (
                        <p className="text-xs text-muted-foreground mt-1">{ws.clientName}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-2">
                        {ws.location && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} />
                            {ws.location}
                          </div>
                        )}
                        {ws.participants && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Users size={12} />
                            {ws.participants} משתתפים
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Calendar size={36} className="text-brand-blue/30 mb-3" />
              <p className="text-muted-foreground text-sm">בחר יום בלוח לראות סדנאות</p>
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">סדנאות החודש</h4>
            <p className="text-2xl font-bold text-brand-blue">
              {Object.values(workshopsByDate).flat().length}
            </p>
            <p className="text-xs text-muted-foreground">
              {HEBREW_MONTHS[viewMonth]} {viewYear}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
