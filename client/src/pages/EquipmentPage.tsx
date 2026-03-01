import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Search, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { EQUIPMENT_STATUS } from "@shared/schema";
import { motion } from "framer-motion";

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "ממתין להכנה",
  READY: "מוכן לאיסוף",
  PICKED_UP: "נאסף",
  RETURNED: "הוחזר",
};

const NEXT_STATUS: Record<string, string> = {
  ORDERED: "READY",
  READY: "PICKED_UP",
  PICKED_UP: "RETURNED",
};

const NEXT_STATUS_ACTION: Record<string, string> = {
  ORDERED: "סמן מוכן לאיסוף",
  READY: "סמן כנאסף",
  PICKED_UP: "סמן כהוחזר",
};

const CONFIRM_MESSAGES: Record<string, { title: string; description: string }> = {
  ORDERED: {
    title: "אישור הכנת ציוד",
    description: "אני מאשר/ת שהציוד הוכן בפועל ומוכן לאיסוף.",
  },
  READY: {
    title: "אישור איסוף ציוד",
    description: "אני מאשר/ת שהציוד נאסף.",
  },
  PICKED_UP: {
    title: "אישור החזרת ציוד",
    description: "אני מאשר/ת שהציוד הוחזר למחסן.",
  },
};

interface EquipmentWithWorkshop {
  id: number;
  name: string;
  workshopId: number | null;
  status: string;
  assignedTo: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  workshopTitle: string | null;
  workshopDate: string | null;
  workshopLocation: string | null;
}

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: equipmentList = [], isLoading } = useQuery<EquipmentWithWorkshop[]>({
    queryKey: ["/api/equipment"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ equipmentId, toStatus }: { equipmentId: number; toStatus: string }) => {
      return apiRequest(`/api/equipment/${equipmentId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: toStatus,
          userId: user?.id || 1,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "סטטוס עודכן בהצלחה" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: error.message || "אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: async ({ ids, toStatus }: { ids: number[]; toStatus: string }) => {
      return apiRequest("/api/equipment/batch-status", {
        method: "PUT",
        body: JSON.stringify({
          ids,
          status: toStatus,
          userId: user?.id || 1,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setSelectedIds(new Set());
      toast({ title: "כל הפריטים שנבחרו עודכנו בהצלחה" });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: error.message || "אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case EQUIPMENT_STATUS.ORDERED:
        return "bg-status-ordered-bg text-status-ordered";
      case EQUIPMENT_STATUS.READY:
        return "bg-status-ready-bg text-status-ready";
      case EQUIPMENT_STATUS.PICKED_UP:
        return "bg-status-pickedup-bg text-status-pickedup";
      case EQUIPMENT_STATUS.RETURNED:
        return "bg-status-returned-bg text-status-returned";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case EQUIPMENT_STATUS.ORDERED:
        return <Clock className="h-4 w-4" />;
      case EQUIPMENT_STATUS.READY:
        return <CheckCircle className="h-4 w-4" />;
      case EQUIPMENT_STATUS.PICKED_UP:
        return <Package className="h-4 w-4" />;
      case EQUIPMENT_STATUS.RETURNED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => STATUS_LABELS[status] || status;

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInTab = (items: EquipmentWithWorkshop[]) => {
    const allSelected = items.every(i => selectedIds.has(i.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        items.forEach(i => next.delete(i.id));
      } else {
        items.forEach(i => next.add(i.id));
      }
      return next;
    });
  };

  const getSelectedInStatus = (status: string) => {
    return equipmentList.filter(e => e.status === status && selectedIds.has(e.id));
  };

  const filteredEquipment = equipmentList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      (item.workshopTitle || "").toLowerCase().includes(searchLower) ||
      (item.workshopLocation || "").toLowerCase().includes(searchLower) ||
      getStatusLabel(item.status).includes(searchLower)
    );
  });

  const pendingEquipment = filteredEquipment.filter((item) => item.status === EQUIPMENT_STATUS.ORDERED);
  const readyEquipment = filteredEquipment.filter((item) => item.status === EQUIPMENT_STATUS.READY);
  const collectedEquipment = filteredEquipment.filter((item) => item.status === EQUIPMENT_STATUS.PICKED_UP);
  const returnedEquipment = filteredEquipment.filter((item) => item.status === EQUIPMENT_STATUS.RETURNED);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">טוען...</div>;
  }

  const EquipmentCard = ({ item }: { item: EquipmentWithWorkshop }) => {
    const nextStatus = NEXT_STATUS[item.status];
    const actionLabel = NEXT_STATUS_ACTION[item.status];
    const confirmMsg = CONFIRM_MESSAGES[item.status];
    const isSelected = selectedIds.has(item.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`hover:shadow-stone-lg transition-all rounded-2xl shadow-stone ${isSelected ? "ring-2 ring-brand-blue bg-blue-50/30" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {item.status !== "RETURNED" && (
                <div className="pt-1">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSelection(item.id)}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="mt-2 space-y-1">
                      {item.workshopTitle && (
                        <p className="text-sm font-medium">סדנה: {item.workshopTitle}</p>
                      )}
                      {item.workshopDate && (
                        <p className="text-sm text-gray-500">
                          תאריך: {new Date(item.workshopDate).toLocaleDateString("he-IL")}
                        </p>
                      )}
                      {item.workshopLocation && (
                        <p className="text-sm text-gray-500">מיקום: {item.workshopLocation}</p>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getStatusColor(item.status)} flex items-center gap-1 rounded-full shadow-sm border-0`}>
                      {getStatusIcon(item.status)}
                      {getStatusLabel(item.status)}
                    </Badge>

                    {nextStatus && confirmMsg && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className={`rounded-full ${
                              item.status === EQUIPMENT_STATUS.ORDERED
                                ? "bg-brand-yellow text-foreground hover:bg-brand-yellow/90"
                                : item.status === EQUIPMENT_STATUS.READY
                                ? "bg-brand-blue text-white hover:bg-brand-blue/90"
                                : "bg-brand-green text-white hover:bg-brand-green/90"
                            }`}
                            disabled={updateStatusMutation.isPending}
                          >
                            {actionLabel}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{confirmMsg.title}</AlertDialogTitle>
                            <AlertDialogDescription>{confirmMsg.description}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogAction
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  equipmentId: item.id,
                                  toStatus: nextStatus,
                                })
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              אישור
                            </AlertDialogAction>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const BatchActionBar = ({ status, items }: { status: string; items: EquipmentWithWorkshop[] }) => {
    const selected = getSelectedInStatus(status);
    const nextStatus = NEXT_STATUS[status];
    const confirmMsg = CONFIRM_MESSAGES[status];
    const allSelected = items.length > 0 && items.every(i => selectedIds.has(i.id));

    if (!nextStatus || !confirmMsg || items.length === 0) return null;

    return (
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => selectAllInTab(items)}
          />
          <span className="text-sm text-gray-600">
            {selected.length > 0
              ? `נבחרו ${selected.length} פריטים`
              : "בחר הכל"}
          </span>
        </div>
        {selected.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className={`rounded-full ${
                  status === EQUIPMENT_STATUS.ORDERED
                    ? "bg-brand-yellow text-foreground hover:bg-brand-yellow/90"
                    : status === EQUIPMENT_STATUS.READY
                    ? "bg-brand-blue text-white hover:bg-brand-blue/90"
                    : "bg-brand-green text-white hover:bg-brand-green/90"
                }`}
                disabled={batchUpdateMutation.isPending}
              >
                {batchUpdateMutation.isPending ? "מעדכן..." : `${NEXT_STATUS_ACTION[status]} (${selected.length})`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>{confirmMsg.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmMsg.description} ({selected.length} פריטים)
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogAction
                  onClick={() =>
                    batchUpdateMutation.mutate({
                      ids: selected.map(e => e.id),
                      toStatus: nextStatus,
                    })
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  אישור
                </AlertDialogAction>
                <AlertDialogCancel>ביטול</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold">ממשק מחסנאי</h2>
        <p className="text-muted-foreground mt-1">ניהול ועדכון סטטוס ציוד</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="חפש לפי שם ציוד, סדנה או מיקום..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6" onValueChange={() => setSelectedIds(new Set())}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">ממתין להכנה</span>
            <span className="sm:hidden">ממתין</span>
            ({pendingEquipment.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">מוכן לאיסוף</span>
            <span className="sm:hidden">מוכן</span>
            ({readyEquipment.length})
          </TabsTrigger>
          <TabsTrigger value="collected" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">נאסף</span>
            ({collectedEquipment.length})
          </TabsTrigger>
          <TabsTrigger value="returned" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">הוחזר</span>
            ({returnedEquipment.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                ציוד הממתין להכנה
              </CardTitle>
              <CardDescription>פריטי ציוד שהוזמנו ומחכים להכנה במחסן</CardDescription>
            </CardHeader>
          </Card>

          {pendingEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">כל הציוד מוכן!</h3>
                <p className="text-muted-foreground text-center">אין ציוד הממתין להכנה</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <BatchActionBar status="ORDERED" items={pendingEquipment} />
              <div className="grid gap-4">
                {pendingEquipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                ציוד מוכן לאיסוף
              </CardTitle>
              <CardDescription>פריטי ציוד שהוכנו ומחכים למנחים לאסוף</CardDescription>
            </CardHeader>
          </Card>

          {readyEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-muted-foreground text-center">אין ציוד מוכן לאיסוף</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <BatchActionBar status="READY" items={readyEquipment} />
              <div className="grid gap-4">
                {readyEquipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="collected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-yellow-600" />
                ציוד שנאסף
              </CardTitle>
              <CardDescription>פריטי ציוד שנאספו על ידי המנחים</CardDescription>
            </CardHeader>
          </Card>

          {collectedEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-muted-foreground text-center">אין ציוד שנאסף</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <BatchActionBar status="PICKED_UP" items={collectedEquipment} />
              <div className="grid gap-4">
                {collectedEquipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="returned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                ציוד שהוחזר
              </CardTitle>
              <CardDescription>פריטי ציוד שהוחזרו למחסן</CardDescription>
            </CardHeader>
          </Card>

          {returnedEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-muted-foreground text-center">אין ציוד שהוחזר</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {returnedEquipment.map((item) => (
                <EquipmentCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
