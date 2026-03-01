import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { processTypes, processStatuses } from "@shared/process-types";

export default function ProcessesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    type: "workshop",
    notes: "",
  });

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["processes"],
    queryFn: () => apiRequest("/api/processes"),
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      apiRequest("/api/processes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      setError(null);
      setFormData({ name: "", clientName: "", clientEmail: "", clientPhone: "", type: "workshop", notes: "" });
    },
    onError: (err: Error) => {
      setError(err.message || "שגיאה ביצירת התהליך");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/processes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getTypeLabel = (type: string) =>
    processTypes.find((t) => t.value === type)?.label || type;

  const getStatusLabel = (status: string) =>
    processStatuses.find((s) => s.value === status)?.label || status;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
      on_hold: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">תהליכים</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors"
        >
          <Plus size={18} />
          תהליך חדש
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl shadow-sm border p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4">יצירת תהליך חדש</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">שם התהליך</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">שם הלקוח</label>
              <input
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">אימייל</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">טלפון</label>
              <input
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סוג</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {processTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">הערות</label>
              <input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            {error && (
              <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-green/90 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "שומר..." : "שמור"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : processes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-muted-foreground">אין תהליכים עדיין</p>
          <p className="text-sm text-muted-foreground mt-1">לחץ על "תהליך חדש" כדי להוסיף</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map((process: any) => (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold">{process.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(process.status)}`}>
                    {getStatusLabel(process.status)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {getTypeLabel(process.type)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  לקוח: {process.clientName}
                  {process.clientEmail && ` | ${process.clientEmail}`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm("למחוק את התהליך?")) deleteMutation.mutate(process.id);
                }}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
