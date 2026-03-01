import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Trash2, FileDown, ClipboardCheck, CalendarPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { Exercise, EquipmentItem } from "@shared/exercises-data";
import { getTotalEquipment } from "@shared/exercises-data";

const workshopSchema = z.object({
  clientName: z.string().optional(),
  hrContactName: z.string().optional(),
  hrContactPhone: z.string().optional(),
  hrContactEmail: z.string().optional(),
  procurementContactName: z.string().optional(),
  procurementContactPhone: z.string().optional(),
  procurementContactEmail: z.string().optional(),
  participants: z.coerce.number().min(1, "מספר משתתפים נדרש"),
  location: z.string().min(1, "מיקום נדרש"),
  date: z.string().min(1, "תאריך נדרש"),
  checklist: z.object({
    medic: z.enum(["yes", "no"]).optional(),
    breakfast: z.enum(["yes", "no"]).optional(),
    lunch: z.enum(["yes", "no"]).optional(),
    dinner: z.enum(["yes", "no"]).optional(),
    campfire: z.enum(["yes", "no"]).optional(),
    workOrder: z.enum(["yes", "no"]).optional(),
    safetyBriefing: z.enum(["yes", "no"]).optional(),
    assistant: z.enum(["yes", "no"]).optional(),
  }),
  selectedExercises: z.array(z.object({
    exerciseId: z.number(),
    equipment: z.array(z.string()),
    notes: z.string().optional(),
  })).default([]),
});

type WorkshopFormData = z.infer<typeof workshopSchema>;

export default function WorkshopsPage() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<number[]>([]);
  const [selectedSubActivities, setSelectedSubActivities] = useState<Record<number, number[]>>({});
  const [exerciseEquipment, setExerciseEquipment] = useState<Record<number, EquipmentItem[]>>({});
  const [exerciseNotes, setExerciseNotes] = useState<Record<number, string>>({});
  const [exerciseGroups, setExerciseGroups] = useState<Record<number, number>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: workshopsList = [], isLoading } = useQuery({
    queryKey: ["workshops"],
    queryFn: () => apiRequest("/api/workshops"),
  });

  const { data: svCalendlyData } = useQuery({
    queryKey: ["/api/settings/sv_calendly_url"],
  });
  const svCalendlyUrl = (svCalendlyData as any)?.value || "";

  const form = useForm<WorkshopFormData>({
    resolver: zodResolver(workshopSchema),
    defaultValues: {
      clientName: "",
      hrContactName: "",
      hrContactPhone: "",
      hrContactEmail: "",
      procurementContactName: "",
      procurementContactPhone: "",
      procurementContactEmail: "",
      participants: 0,
      location: "",
      date: "",
      checklist: {},
      selectedExercises: [],
    },
  });

  const createWorkshopMutation = useMutation({
    mutationFn: async (data: WorkshopFormData) => {
      const selectedExercises = selectedExerciseIds.map(id => {
        const equipItems = exerciseEquipment[id] || [];
        const groups = exerciseGroups[id] || 1;
        const totals = getTotalEquipment(equipItems, groups);
        const equipmentStrings = totals.map(t => `${t.item}: ${t.total}`);
        const option = selectedOptions[id];
        let notes = exerciseNotes[id] || "";
        if (option) {
          notes = notes ? `${option} - ${notes}` : option;
        }
        return {
          exerciseId: id,
          equipment: equipmentStrings,
          notes,
          numGroups: groups,
        };
      });

      return apiRequest("/api/workshops", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          date: new Date(data.date).toISOString(),
          selectedExercises,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "הזמנת סדנה נשלחה בהצלחה",
        description: "ההזמנה נשלחה למשרד ולמחסן",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "אנא נסה שנית",
        variant: "destructive",
      });
    },
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/workshops/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workshops"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({ title: "הסדנה נמחקה בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה במחיקת הסדנה", description: "אנא נסה שנית", variant: "destructive" });
    },
  });

  const resetForm = () => {
    form.reset();
    setShowForm(false);
    setSelectedExerciseIds([]);
    setSelectedSubActivities({});
    setExerciseEquipment({});
    setExerciseNotes({});
    setExerciseGroups({});
    setSelectedOptions({});
  };

  const onSubmit = (data: WorkshopFormData) => {
    createWorkshopMutation.mutate(data);
  };

  const handleExerciseToggle = (exercise: Exercise, checked: boolean) => {
    if (checked) {
      setSelectedExerciseIds(prev => [...prev, exercise.id]);
      if (exercise.equipment && !exercise.subActivities) {
        setExerciseEquipment(prev => ({
          ...prev,
          [exercise.id]: [...exercise.equipment!],
        }));
      }
    } else {
      setSelectedExerciseIds(prev => prev.filter(id => id !== exercise.id));
      setSelectedSubActivities(prev => { const { [exercise.id]: _, ...rest } = prev; return rest; });
      setExerciseEquipment(prev => { const { [exercise.id]: _, ...rest } = prev; return rest; });
      setExerciseNotes(prev => { const { [exercise.id]: _, ...rest } = prev; return rest; });
      setExerciseGroups(prev => { const { [exercise.id]: _, ...rest } = prev; return rest; });
      setSelectedOptions(prev => { const { [exercise.id]: _, ...rest } = prev; return rest; });
    }
  };

  const handleSubActivityToggle = (exerciseId: number, subActivity: { id: number; equipment: EquipmentItem[] }, checked: boolean) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise || !exercise.subActivities) return;

    if (checked) {
      const newSubs = [...(selectedSubActivities[exerciseId] || []), subActivity.id];
      setSelectedSubActivities(prev => ({ ...prev, [exerciseId]: newSubs }));
      const allEquip = exercise.subActivities
        .filter(sub => newSubs.includes(sub.id))
        .flatMap(sub => sub.equipment);
      setExerciseEquipment(prev => ({ ...prev, [exerciseId]: mergeEquipment(allEquip) }));
    } else {
      const newSubs = (selectedSubActivities[exerciseId] || []).filter(id => id !== subActivity.id);
      setSelectedSubActivities(prev => ({ ...prev, [exerciseId]: newSubs }));
      const allEquip = exercise.subActivities
        .filter(sub => newSubs.includes(sub.id))
        .flatMap(sub => sub.equipment);
      setExerciseEquipment(prev => ({ ...prev, [exerciseId]: mergeEquipment(allEquip) }));
    }
  };

  const mergeEquipment = (items: EquipmentItem[]): EquipmentItem[] => {
    const map = new Map<string, EquipmentItem>();
    for (const item of items) {
      const existing = map.get(item.item);
      if (existing) {
        if (!item.scalable || !existing.scalable) {
          map.set(item.item, {
            ...existing,
            quantity: Math.max(existing.quantity, item.quantity),
            scalable: false,
          });
        } else {
          map.set(item.item, { ...existing, quantity: existing.quantity + item.quantity });
        }
      } else {
        map.set(item.item, { ...item });
      }
    }
    return Array.from(map.values());
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { planned: "מתוכנן", confirmed: "מאושר", completed: "הושלם", cancelled: "בוטל" };
    return labels[status] || status;
  };
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { planned: "bg-status-ordered-bg text-status-ordered", confirmed: "bg-status-ready-bg text-status-ready", completed: "bg-status-returned-bg text-status-returned", cancelled: "bg-status-safety-bg text-status-safety" };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const checklistItems = [
    { key: "assistant", label: "עוזר לוגיסטי" },
    { key: "medic", label: "חובש" },
    { key: "breakfast", label: "ארוחת בוקר" },
    { key: "lunch", label: "ארוחת צהרים" },
    { key: "dinner", label: "ארוחת ערב" },
    { key: "campfire", label: "ערב על מדורה" },
    { key: "workOrder", label: "הזמנת עבודה חתומה" },
    { key: "safetyBriefing", label: "שיחת SV" },
  ];

  const renderEquipmentSummary = (exerciseId: number) => {
    const equip = exerciseEquipment[exerciseId];
    if (!equip || equip.length === 0) return null;
    const groups = exerciseGroups[exerciseId] || 1;
    const totals = getTotalEquipment(equip, groups);
    return (
      <div className="space-y-2 mb-3 bg-gray-50 rounded-md p-3">
        <p className="text-sm font-medium">ציוד נדרש ({groups} {groups === 1 ? "קבוצה" : "קבוצות"}):</p>
        <div className="flex flex-wrap gap-2">
          {totals.map(({ item, total }) => (
            <span key={item} className="text-xs px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
              {item}: {total}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">סדנאות</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-yellow text-foreground hover:bg-brand-yellow/90 rounded-full font-semibold shadow-sm"
        >
          <Plus size={18} className="ml-2" />
          הזמנת סדנה חדשה
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-stone rounded-2xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center ml-3">
                <Calendar className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-semibold">הזמנת סדנה</h3>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div>
                  <h4 className="text-lg font-medium mb-4">פרטי לקוח</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם לקוח</FormLabel>
                          <FormControl>
                            <Input placeholder="שם החברה/הארגון" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <h5 className="text-sm font-medium mt-4 mb-2 text-muted-foreground">איש קשר HR</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="hrContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם</FormLabel>
                          <FormControl>
                            <Input placeholder="שם איש קשר" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hrContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון</FormLabel>
                          <FormControl>
                            <Input placeholder="050-0000000" dir="ltr" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hrContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימייל</FormLabel>
                          <FormControl>
                            <Input placeholder="email@company.com" dir="ltr" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <h5 className="text-sm font-medium mt-4 mb-2 text-muted-foreground">איש קשר רכש</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="procurementContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם</FormLabel>
                          <FormControl>
                            <Input placeholder="שם איש קשר" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="procurementContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון</FormLabel>
                          <FormControl>
                            <Input placeholder="050-0000000" dir="ltr" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="procurementContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימייל</FormLabel>
                          <FormControl>
                            <Input placeholder="email@company.com" dir="ltr" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">פרטים בסיסיים</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="participants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מספר משתתפים</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מיקום</FormLabel>
                          <FormControl>
                            <Input placeholder="כתובת מלאה" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תאריך</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} dir="ltr" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">רשימת בדיקות</h4>
                  <div className="space-y-3">
                    {checklistItems.map((item) => (
                      <FormField
                        key={item.key}
                        control={form.control}
                        name={`checklist.${item.key}` as any}
                        render={({ field }) => (
                          <FormItem className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <FormLabel className="text-base font-medium mb-3 block">
                              {item.label}
                            </FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex gap-6"
                              >
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                                  <label htmlFor={`${item.key}-yes`} className="text-green-600 font-medium cursor-pointer">
                                    כן
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <RadioGroupItem value="no" id={`${item.key}-no`} />
                                  <label htmlFor={`${item.key}-no`} className="text-red-600 font-medium cursor-pointer">
                                    לא
                                  </label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            {item.key === "safetyBriefing" && field.value === "no" && svCalendlyUrl && (
                              <a
                                href={svCalendlyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-blue/90 transition-colors"
                              >
                                <CalendarPlus size={16} />
                                תאם פגישת SV ביומן
                              </a>
                            )}
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-4">בחירת תרגילים וציוד</h4>
                  {exercisesLoading ? (
                    <div className="text-center py-8 text-muted-foreground">טוען תרגילים...</div>
                  ) : (
                    <div className="space-y-3">
                      {exercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className={`border rounded-lg transition-colors ${
                            selectedExerciseIds.includes(exercise.id)
                              ? "border-brand-blue bg-brand-blue/5"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={selectedExerciseIds.includes(exercise.id)}
                                onCheckedChange={(checked) => handleExerciseToggle(exercise, !!checked)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{exercise.name}</p>
                                {exercise.notes && (
                                  <p className="text-xs text-muted-foreground">{exercise.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {selectedExerciseIds.includes(exercise.id) && (
                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                              {exercise.subActivities && (
                                <div className="space-y-2 mb-3">
                                  <p className="text-sm font-medium">בחר פעילויות:</p>
                                  <div className="space-y-2 mr-4">
                                    {exercise.subActivities.map((sub) => (
                                      <label key={sub.id} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                          checked={selectedSubActivities[exercise.id]?.includes(sub.id) || false}
                                          onCheckedChange={(checked) => handleSubActivityToggle(exercise.id, sub, !!checked)}
                                        />
                                        <span className="text-sm">{sub.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({sub.equipment.map(e => e.item).join(", ")})
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {exercise.options && (
                                <div className="space-y-2 mb-3">
                                  <p className="text-sm font-medium">בחר מסלול:</p>
                                  <div className="flex flex-wrap gap-2 mr-4">
                                    {exercise.options.map((option) => (
                                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`option-${exercise.id}`}
                                          checked={selectedOptions[exercise.id] === option}
                                          onChange={() => setSelectedOptions(prev => ({ ...prev, [exercise.id]: option }))}
                                          className="accent-brand-blue"
                                        />
                                        <span className="text-sm">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(exerciseEquipment[exercise.id] || []).length > 0 && (
                                <div className="flex items-center gap-3 mb-3">
                                  <label className="text-sm font-medium whitespace-nowrap">מספר קבוצות:</label>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="w-20 h-8 text-sm"
                                    value={exerciseGroups[exercise.id] || 1}
                                    onChange={(e) => setExerciseGroups(prev => ({
                                      ...prev,
                                      [exercise.id]: Math.max(1, parseInt(e.target.value) || 1),
                                    }))}
                                  />
                                </div>
                              )}

                              {renderEquipmentSummary(exercise.id)}

                              <Textarea
                                className="mt-2 text-sm"
                                rows={2}
                                placeholder="הערות כלליות לתרגיל..."
                                value={exerciseNotes[exercise.id] || ""}
                                onChange={(e) => setExerciseNotes(prev => ({ ...prev, [exercise.id]: e.target.value }))}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="bg-brand-green text-white hover:bg-brand-green/90 rounded-full font-semibold"
                    disabled={createWorkshopMutation.isPending}
                  >
                    {createWorkshopMutation.isPending ? "שולח..." : "שלח הזמנה"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : workshopsList.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Calendar className="mx-auto mb-3 text-muted-foreground" size={48} />
          <p className="text-muted-foreground">אין סדנאות עדיין</p>
          <p className="text-sm text-muted-foreground mt-1">לחץ על "הזמנת סדנה חדשה" כדי להוסיף</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workshopsList.map((workshop: any) => (
            <motion.div
              key={workshop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-stone hover:shadow-stone-lg transition-shadow p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{workshop.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(workshop.status)}`}>
                    {getStatusLabel(workshop.status)}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto">
                        <Trash2 size={16} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת סדנה</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתה בטוח שברצונך למחוק את הסדנה "{workshop.title}"? פעולה זו תמחק גם את כל הציוד המשויך ולא ניתן לבטלה.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteWorkshopMutation.mutate(workshop.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {workshop.clientName && <p>לקוח: {workshop.clientName}</p>}
                {workshop.participants && <p>משתתפים: {workshop.participants}</p>}
                {workshop.location && <p>מיקום: {workshop.location}</p>}
                {workshop.date && (
                  <p>תאריך: {new Date(workshop.date).toLocaleDateString("he-IL")}</p>
                )}
                {workshop.exercises && (workshop.exercises as any[]).length > 0 && (
                  <p>תרגילים: {(workshop.exercises as any[]).length}</p>
                )}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/workshops/${workshop.id}/work-order`, "_blank")}
                >
                  <FileDown size={14} className="ml-1" />
                  הזמנת עבודה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/workshops/${workshop.id}/summary`)}
                >
                  <ClipboardCheck size={14} className="ml-1" />
                  סיכום סדנה
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
