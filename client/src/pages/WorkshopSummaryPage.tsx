import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { ClipboardCheck } from "lucide-react";
import type { Workshop, WorkshopSummary } from "@shared/schema";

export default function WorkshopSummaryPage() {
  const [, params] = useRoute("/workshops/:id/summary");
  const workshopId = params?.id ? Number(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: workshop } = useQuery<Workshop>({
    queryKey: [`/api/workshops/${workshopId}`],
    enabled: !!workshopId,
  });

  const { data: existingSummary } = useQuery<WorkshopSummary | null>({
    queryKey: [`/api/workshops/${workshopId}/summary`],
    enabled: !!workshopId,
  });

  const { data: exercises = [] } = useQuery<any[]>({
    queryKey: ["/api/exercises"],
  });


  const [participantsCount, setParticipantsCount] = useState(0);
  const [actualExercises, setActualExercises] = useState<string[]>([]);
  const [instructorInsight, setInstructorInsight] = useState("");
  const [dayInsight, setDayInsight] = useState("");
  const [safetyIncident, setSafetyIncident] = useState(false);
  const [safetyDetails, setSafetyDetails] = useState("");
  const [issuesOrExceptions, setIssuesOrExceptions] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (existingSummary) {
      setParticipantsCount(existingSummary.participantsCount);
      setActualExercises((existingSummary.actualExercises as string[]) || []);
      setInstructorInsight(existingSummary.instructorInsight || "");
      setDayInsight(existingSummary.dayInsight || "");
      setSafetyIncident(existingSummary.safetyIncident);
      setSafetyDetails(existingSummary.safetyDetails || "");
      setIssuesOrExceptions(existingSummary.issuesOrExceptions || "");
      setFeedbackSent(existingSummary.feedbackSent);
    }
  }, [existingSummary]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/workshops/${workshopId}/summary`, {
        method: "POST",
        body: JSON.stringify({
          participantsCount,
          actualExercises,
          instructorInsight,
          dayInsight,
          safetyIncident,
          safetyDetails: safetyIncident ? safetyDetails : null,
          issuesOrExceptions,
          feedbackSent,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshopId}/summary`] });
      toast({ title: "סיכום הסדנה נשמר בהצלחה" });
    },
    onError: (error: any) => {
      toast({ title: "שגיאה בשמירת הסיכום", description: error.message, variant: "destructive" });
    },
  });

  const handleExerciseToggle = (name: string, checked: boolean) => {
    if (checked) {
      setActualExercises((prev) => [...prev, name]);
    } else {
      setActualExercises((prev) => prev.filter((e) => e !== name));
    }
  };

  const workshopExercises = workshop?.exercises as any[] || [];
  const exerciseNames: string[] = [];
  for (const ex of workshopExercises) {
    const exercise = exercises.find((e: any) => e.id === ex.exerciseId);
    if (exercise) {
      if (exercise.subActivities) {
        exercise.subActivities.forEach((sub: any) => exerciseNames.push(sub.name));
      } else {
        exerciseNames.push(exercise.name);
      }
    }
  }

  if (!workshopId || !workshop) {
    return <div className="text-center py-12 text-muted-foreground">טוען...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">סיכום סדנה</h2>
        <p className="text-muted-foreground">{workshop.title}</p>
        {workshop.date && (
          <p className="text-sm text-muted-foreground">
            {new Date(workshop.date).toLocaleDateString("he-IL")}
          </p>
        )}
      </div>

      <Card className="shadow-stone rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium block mb-2">כמות משתתפים</label>
            <Input
              type="number"
              min={1}
              value={participantsCount || ""}
              onChange={(e) => setParticipantsCount(Number(e.target.value))}
              
              className="w-40"
            />
          </div>

          {exerciseNames.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-2">תרגילים שהתקיימו בפועל</label>
              <div className="space-y-2 mr-4">
                {exerciseNames.map((name) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={actualExercises.includes(name)}
                      onCheckedChange={(checked) => handleExerciseToggle(name, !!checked)}
                      
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-2">תובנה על עצמי כמנחה</label>
            <Textarea
              value={instructorInsight}
              onChange={(e) => setInstructorInsight(e.target.value)}
              
              rows={3}
              placeholder="מה למדתי על עצמי בסדנה זו..."
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">תובנה אחת מתוך היום</label>
            <Textarea
              value={dayInsight}
              onChange={(e) => setDayInsight(e.target.value)}
              
              rows={3}
              placeholder="תובנה מרכזית מהיום..."
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">אירוע בטיחות</label>
            <RadioGroup
              value={safetyIncident ? "yes" : "no"}
              onValueChange={(v) => setSafetyIncident(v === "yes")}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="safety-yes" />
                <label htmlFor="safety-yes" className="text-red-600 font-medium cursor-pointer">כן</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="safety-no" />
                <label htmlFor="safety-no" className="text-green-600 font-medium cursor-pointer">לא</label>
              </div>
            </RadioGroup>
            {safetyIncident && (
              <Textarea
                className="mt-2"
                value={safetyDetails}
                onChange={(e) => setSafetyDetails(e.target.value)}
                
                rows={3}
                placeholder="פירוט אירוע הבטיחות (חובה)..."
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">תקלות / חריגים</label>
            <Textarea
              value={issuesOrExceptions}
              onChange={(e) => setIssuesOrExceptions(e.target.value)}
              
              rows={3}
              placeholder="תקלות או חריגים שהיו..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={feedbackSent}
                onCheckedChange={(checked) => setFeedbackSent(!!checked)}
                
              />
              <span className="text-sm font-medium">נשלח משוב למשתתפים</span>
            </label>
          </div>

          <div className="flex justify-end">
              <Button
                onClick={() => saveMutation.mutate()}
                className="bg-brand-green text-white hover:bg-brand-green/90 rounded-full font-semibold"
                disabled={saveMutation.isPending}
              >
                <ClipboardCheck size={18} className="ml-2" />
                {saveMutation.isPending ? "שומר..." : "שמור סיכום"}
              </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
