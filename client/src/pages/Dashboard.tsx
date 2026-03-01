import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderKanban, Calendar, Package, Users } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest("/api/dashboard"),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">טוען...</div>;
  }

  const cards = [
    {
      title: "תהליכים פעילים",
      value: stats?.activeProcesses || 0,
      total: stats?.totalProcesses || 0,
      icon: FolderKanban,
      color: "bg-brand-blue",
    },
    {
      title: "סדנאות",
      value: stats?.totalWorkshops || 0,
      icon: Calendar,
      color: "bg-brand-green",
    },
    {
      title: "ציוד",
      value: stats?.totalEquipment || 0,
      icon: Package,
      color: "bg-brand-yellow",
      iconColor: "text-foreground",
    },
    {
      title: "מדריכים",
      value: stats?.totalInstructors || 0,
      icon: Users,
      color: "bg-brand-blue-light",
    },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ORDERED: { label: "הוזמן", color: "text-status-ordered", bg: "bg-status-ordered-bg" },
    READY: { label: "מוכן", color: "text-status-ready", bg: "bg-status-ready-bg" },
    PICKED_UP: { label: "נאסף", color: "text-status-pickedup", bg: "bg-status-pickedup-bg" },
    RETURNED: { label: "הוחזר", color: "text-status-returned", bg: "bg-status-returned-bg" },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-8rem)]"
    >
      <h2 className="text-2xl font-bold mb-6">לוח בקרה</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-stone p-6 hover:shadow-stone-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-xl ${card.iconColor ? card.iconColor : "text-white"}`}>
                  <Icon size={22} />
                </div>
              </div>
              <h3 className="text-sm text-muted-foreground">{card.title}</h3>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
              {"total" in card && card.total !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  מתוך {card.total} סה"כ
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {stats?.equipmentByStatus && (
        <div className="bg-white rounded-2xl shadow-stone p-6">
          <h3 className="text-lg font-semibold mb-4">סטטוס ציוד</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats.equipmentByStatus).map(([status, count]) => {
              const config = statusConfig[status];
              if (!config) return null;
              return (
                <div
                  key={status}
                  className={`rounded-2xl p-4 text-center ${config.bg} shadow-sm`}
                >
                  <p className={`text-2xl font-bold ${config.color}`}>{count as number}</p>
                  <p className={`text-sm ${config.color} font-medium`}>{config.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
