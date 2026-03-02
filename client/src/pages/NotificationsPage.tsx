import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, Send, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function NotificationsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { isSupported, isSubscribed, isLoading: subLoading, subscribe, unsubscribe } = usePushNotifications();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ["/api/push/subscriptions"],
    enabled: currentUser?.role === "admin",
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/push/send", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          url: url || undefined,
          userIds: sendToAll ? undefined : selectedUserIds,
        }),
      }),
    onSuccess: (data: any) => {
      toast({ title: `ההתראה נשלחה ל-${data.sent} משתמשים` });
      setTitle("");
      setBody("");
      setUrl("");
      setSelectedUserIds([]);
    },
    onError: () => {
      toast({ title: "שגיאה בשליחת ההתראה", variant: "destructive" });
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

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={28} className="text-brand-blue" />
        <h1 className="text-2xl font-bold">ניהול התראות</h1>
      </div>

      {/* My subscription status */}
      <Card className="shadow-stone rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">הגדרות ההתראות שלי</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            {!isSupported ? (
              <p className="text-sm text-muted-foreground">הדפדפן שלך אינו תומך בהתראות</p>
            ) : isSubscribed ? (
              <p className="text-sm text-green-600 font-medium">ההתראות מופעלות במכשיר זה</p>
            ) : (
              <p className="text-sm text-muted-foreground">ההתראות כבויות במכשיר זה</p>
            )}
          </div>
          {isSupported && (
            isSubscribed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribe}
                disabled={subLoading}
                className="gap-2"
              >
                <BellOff size={16} />
                כבה התראות
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={subscribe}
                disabled={subLoading}
                className="gap-2"
              >
                <Bell size={16} />
                הפעל התראות
              </Button>
            )
          )}
        </CardContent>
      </Card>

      {/* Send notification form */}
      <Card className="shadow-stone rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send size={18} />
            שליחת התראה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">כותרת</Label>
            <Input
              id="notif-title"
              placeholder="כותרת ההתראה"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              dir="rtl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-body">תוכן</Label>
            <Textarea
              id="notif-body"
              placeholder="תוכן ההתראה..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              dir="rtl"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-url">קישור (אופציונלי)</Label>
            <Input
              id="notif-url"
              placeholder="/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users size={16} />
              נמענים
            </Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="send-all"
                checked={sendToAll}
                onCheckedChange={(v) => setSendToAll(!!v)}
              />
              <label htmlFor="send-all" className="text-sm cursor-pointer">
                שלח לכולם ({subscriptions.length} משתמשים רשומים)
              </label>
            </div>

            {!sendToAll && (
              <div className="space-y-2 pr-4 border-r-2 border-gray-100">
                {subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">אין משתמשים רשומים להתראות</p>
                ) : (
                  subscriptions.map((sub: any) => (
                    <div key={sub.userId} className="flex items-center gap-2">
                      <Checkbox
                        id={`user-${sub.userId}`}
                        checked={selectedUserIds.includes(sub.userId)}
                        onCheckedChange={() => toggleUser(sub.userId)}
                      />
                      <label htmlFor={`user-${sub.userId}`} className="text-sm cursor-pointer">
                        {sub.userName}
                        <span className="text-muted-foreground mr-1">({sub.userEmail})</span>
                      </label>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            onClick={() => sendMutation.mutate()}
            disabled={!title || !body || sendMutation.isPending || (subscriptions.length === 0)}
          >
            <Send size={16} />
            {sendMutation.isPending ? "שולח..." : "שלח התראה"}
          </Button>
        </CardContent>
      </Card>

      {/* Subscribed users list */}
      <Card className="shadow-stone rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users size={18} />
            משתמשים רשומים להתראות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין משתמשים רשומים עדיין
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub: any) => (
                <div key={sub.userId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium">{sub.userName}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{sub.userEmail}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                    פעיל
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
