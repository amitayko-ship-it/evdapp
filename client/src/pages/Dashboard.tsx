import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderKanban, CalendarDays, Package, Users, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../hooks/useAuth";
import type { Workshop } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ORDERED: { label: "ממתין להכנה", color: "text-status-ordered", bg: "bg-status-ordered-bg" },
  READY: { label: "מוכן לאיסוף", color: "text-status-ready", bg: "bg-status-ready-bg" },
  PICKED_UP: { label: "נאסף", color: "text-status-pickedup", bg: "bg-status-pickedup-bg" },
  RETURNED: { label: "הוחזר", color: "text-status-returned", bg: "bg-status-returned-bg" },
};

const workshopStatusConfig: Record<string, { label: string; color: string }> = {
  planned: { label: "מתוכנן", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "מאושר", color: "bg-green-100 text-green-800" },
  completed: { label: "הושלם", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-700" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard", { credentials: "include" });
      return res.json();
    },
  });

  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען...</div>;
  }

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const upcomingWorkshops = workshops
    .filter(ws => {
      if (!ws.date) return false;
      const d = new Date(ws.date);
      return d >= now && d <= in30Days && ws.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 5);

  const cards = [
    {
      title: "תהליכים פעילים",
      value: stats?.activeProcesses ?? 0,
      total: stats?.totalProcesses,
      icon: FolderKanban,
      color: "bg-brand-blue",
    },
    {
      title: "סדנאות",
      value: stats?.totalWorkshops ?? 0,
      icon: CalendarDays,
      color: "bg-brand-green",
    },
    {
      title: "פריטי ציוד",
      value: stats?.totalEquipment ?? 0,
      icon: Package,
      color: "bg-brand-yellow",
      iconColor: "text-foreground",
    },
    {
      title: "מנחים",
      value: stats?.totalInstructors ?? 0,
      icon: Users,
      color: "bg-brand-blue-light",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-8rem)]"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">לוח בקרה</h2>
        <p className="text-muted-foreground text-sm mt-1">שלום, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl shadow-stone p-5 hover:shadow-stone-lg transition-shadow"
            >
              <div className={`${card.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.iconColor ?? "text-white"}`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{card.title}</p>
              {"total" in card && card.total !== undefined && (
                <p className="text-xs text-muted-foreground">מתוך {card.total} סה"כ</p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.equipmentByStatus && (
          <div className="bg-white rounded-2xl shadow-stone p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">סטטוס ציוד</h3>
              <Link href="/equipment">
                <button className="text-sm text-brand-blue flex items-center gap-1 hover:underline">
                  לכל הציוד <ArrowLeft size={14} />
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.equipmentByStatus).map(([status, count]) => {
                const cfg = statusConfig[status];
                if (!cfg) return null;
                return (
                  <div key={status} className={`rounded-xl p-4 text-center ${cfg.bg}`}>
                    <p className={`text-2xl font-bold ${cfg.color}`}>{count as number}</p>
                    <p className={`text-xs ${cfg.color} font-medium mt-0.5`}>{cfg.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-stone p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">סדנאות קרובות</h3>
            <Link href="/workshops">
              <button className="text-sm text-brand-blue flex items-center gap-1 hover:underline">
                לכל הסדנאות <ArrowLeft size={14} />
              </button>
            </Link>
          </div>
          {upcomingWorkshops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={32} className="text-green-300 mb-2" />
              <p className="text-sm text-muted-foreground">אין סדנאות ב-30 הימים הקרובים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingWorkshops.map(ws => {
                const d = new Date(ws.date!);
                const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const statusCfg = workshopStatusConfig[ws.status] ?? { label: ws.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <div key={ws.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="bg-brand-blue/10 text-brand-blue rounded-xl w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                      <span className="text-[10px]">{d.toLocaleDateString("he-IL", { month: "short" })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ws.title}</p>
                      {ws.clientName && (
                        <p className="text-xs text-muted-foreground truncate">{ws.clientName}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock size={10} />
                        {daysUntil === 0 ? "היום" : daysUntil === 1 ? "מחר" : `${daysUntil}י`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
