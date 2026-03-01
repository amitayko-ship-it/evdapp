import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface WorkshopReport {
  id: number;
  title: string;
  date: string | null;
  location: string | null;
  participants: number | null;
  status: string;
  clientName: string | null;
  instructorName: string | null;
}

export default function MonthlyReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedInstructor, setSelectedInstructor] = useState("");

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const instructors = users.filter((u) => u.role === "instructor");

  const queryParams = new URLSearchParams();
  if (month) queryParams.set("month", String(month));
  if (year) queryParams.set("year", String(year));
  if (selectedInstructor) queryParams.set("instructorId", selectedInstructor);

  const { data: reportData = [] } = useQuery<WorkshopReport[]>({
    queryKey: ["/api/reports/monthly", month, year, selectedInstructor],
    queryFn: () => apiRequest(`/api/reports/monthly?${queryParams.toString()}`),
  });

  const handleDownload = () => {
    window.open(`/api/reports/monthly-export?${queryParams.toString()}`, "_blank");
  };

  const statusLabels: Record<string, string> = {
    planned: "מתוכנן",
    confirmed: "מאושר",
    completed: "הושלם",
    cancelled: "בוטל",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">דוח חודשי - מנחים</h2>
      </div>

      <Card className="shadow-stone rounded-2xl mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">סינון</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium block mb-1">חודש</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleDateString("he-IL", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">שנה</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">מנחה</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
              >
                <option value="">כל המנחים</option>
                {instructors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handleDownload} className="bg-brand-green text-white hover:bg-brand-green/90 rounded-full font-semibold">
            <Download size={18} className="ml-2" />
            הורדת CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-stone rounded-2xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">תצוגה מקדימה ({reportData.length} סדנאות)</h3>
          {reportData.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">אין נתונים לתקופה שנבחרה</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-2 font-medium">מנחה</th>
                    <th className="text-right py-3 px-2 font-medium">תאריך</th>
                    <th className="text-right py-3 px-2 font-medium">לקוח</th>
                    <th className="text-right py-3 px-2 font-medium">מיקום</th>
                    <th className="text-right py-3 px-2 font-medium">סטטוס</th>
                    <th className="text-right py-3 px-2 font-medium">משתתפים</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((w) => (
                    <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2">{w.instructorName || "-"}</td>
                      <td className="py-2 px-2">{w.date ? new Date(w.date).toLocaleDateString("he-IL") : "-"}</td>
                      <td className="py-2 px-2">{w.clientName || "-"}</td>
                      <td className="py-2 px-2">{w.location || "-"}</td>
                      <td className="py-2 px-2">{statusLabels[w.status] || w.status}</td>
                      <td className="py-2 px-2">{w.participants || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
