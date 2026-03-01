import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Shield, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const roleLabels: Record<string, string> = {
  instructor: "מנחה",
  admin: "מנהל",
  office: "משרד",
  warehouse: "מחסנאי",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  instructor: "bg-blue-100 text-blue-700 border-blue-200",
  office: "bg-purple-100 text-purple-700 border-purple-200",
  warehouse: "bg-orange-100 text-orange-700 border-orange-200",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      apiRequest(`/api/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "התפקיד עודכן בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה בעדכון התפקיד", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "המשתמש נמחק בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת המשתמש", variant: "destructive" });
    },
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto mb-3 text-muted-foreground" size={48} />
        <p className="text-muted-foreground">אין לך הרשאה לצפות בדף זה</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-brand-blue" />
          <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : (
        <div className="space-y-3">
          {(users as any[]).map((u: any) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <Card key={u.id} className="shadow-stone rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-sm text-muted-foreground" dir="ltr">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                        disabled={isSelf}
                        className="h-9 px-3 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="instructor">מנחה</option>
                        <option value="admin">מנהל</option>
                        <option value="office">משרד</option>
                        <option value="warehouse">מחסנאי</option>
                      </select>
                      <Badge className={`${roleColors[u.role] || "bg-gray-100 text-gray-700"} text-xs px-2 py-1 rounded-full border`}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">(את/ה)</span>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto">
                              <Trash2 size={16} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>מחיקת משתמש</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את המשתמש "{u.name}" ({u.email})? פעולה זו לא ניתנת לביטול.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUserMutation.mutate(u.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
