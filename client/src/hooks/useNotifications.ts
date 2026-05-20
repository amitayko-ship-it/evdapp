import { useQuery } from "@tanstack/react-query";
import type { Workshop, Equipment } from "@shared/schema";

interface Notification {
  id: string;
  type: "equipment_ready" | "workshop_upcoming" | "equipment_overdue";
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
}

export function useNotifications() {
  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
    staleTime: 2 * 60 * 1000,
  });

  const { data: equipment = [] } = useQuery<any[]>({
    queryKey: ["/api/equipment"],
    staleTime: 2 * 60 * 1000,
  });

  const notifications: Notification[] = [];
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const ws of workshops) {
    if (!ws.date) continue;
    const wsDate = new Date(ws.date);
    if (wsDate >= now && wsDate <= in7Days && ws.status !== "cancelled" && ws.status !== "completed") {
      const daysUntil = Math.ceil((wsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `ws-upcoming-${ws.id}`,
        type: "workshop_upcoming",
        title: `סדנה קרובה: ${ws.title}`,
        description: daysUntil === 0
          ? "היום!"
          : daysUntil === 1
          ? "מחר"
          : `בעוד ${daysUntil} ימים`,
        urgency: daysUntil <= 1 ? "high" : daysUntil <= 3 ? "medium" : "low",
      });
    }
  }

  const readyItems = equipment.filter((e: any) => e.status === "READY");
  if (readyItems.length > 0) {
    notifications.push({
      id: "equipment-ready",
      type: "equipment_ready",
      title: `${readyItems.length} פריטי ציוד מוכנים לאיסוף`,
      description: "פריטים ממתינים לאיסוף על ידי המנחה",
      urgency: "medium",
    });
  }

  const orderedItems = equipment.filter((e: any) => e.status === "ORDERED");
  if (orderedItems.length > 0) {
    const soonWorkshops = workshops.filter(ws => {
      if (!ws.date) return false;
      const wsDate = new Date(ws.date);
      return wsDate >= now && wsDate <= in7Days;
    });
    if (soonWorkshops.length > 0) {
      notifications.push({
        id: "equipment-ordered-pending",
        type: "equipment_overdue",
        title: `${orderedItems.length} פריטי ציוד טרם הוכנו`,
        description: "יש סדנאות קרובות עם ציוד שלא מוכן",
        urgency: "high",
      });
    }
  }

  notifications.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.urgency] - order[b.urgency];
  });

  return {
    notifications,
    count: notifications.length,
    highCount: notifications.filter(n => n.urgency === "high").length,
  };
}
