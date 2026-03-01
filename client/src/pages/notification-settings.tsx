import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationSettings, User, NotificationPreferences } from "../../../shared/schema";

// ---- API helpers ----

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patchJson<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---- Sub-components ----

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-500 transition-colors" />
        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:-translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 mt-6 first:mt-0">
      {children}
    </h3>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {children}
    </div>
  );
}

// ---- Global settings panel ----

function GlobalSettingsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<NotificationSettings>({
    queryKey: ["notification-settings"],
    queryFn: () => fetchJson("/api/notifications/settings"),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) =>
      patchJson("/api/notifications/settings", patch),
    onSuccess: (updated) => {
      qc.setQueryData(["notification-settings"], updated);
    },
  });

  if (isLoading || !data) return <p className="text-sm text-gray-400">טוען...</p>;

  const toggle = (key: keyof NotificationSettings, value: boolean) =>
    mutation.mutate({ [key]: value });

  return (
    <div className="flex flex-col gap-1">
      <SectionTitle>אירועי סדנאות</SectionTitle>
      <Card>
        <Toggle
          label="סדנה חדשה נוצרה"
          description="שלח מייל לצוות המשרד כאשר נוצרת סדנה חדשה"
          checked={data.workshopCreatedEnabled}
          onChange={(v) => toggle("workshopCreatedEnabled", v)}
        />
        <Toggle
          label="סדנה עודכנה"
          description="שלח מייל כאשר פרטי סדנה קיימת השתנו"
          checked={data.workshopUpdatedEnabled}
          onChange={(v) => toggle("workshopUpdatedEnabled", v)}
        />
        <Toggle
          label="סדנה בוטלה"
          description="שלח מייל למדריך ולמשרד כאשר סדנה מבוטלת"
          checked={data.workshopCancelledEnabled}
          onChange={(v) => toggle("workshopCancelledEnabled", v)}
        />
      </Card>

      <SectionTitle>ציוד</SectionTitle>
      <Card>
        <Toggle
          label="ציוד מוכן לאיסוף"
          description="שלח מייל למדריך כאשר הציוד שלו עבר לסטטוס 'מוכן'"
          checked={data.equipmentReadyEnabled}
          onChange={(v) => toggle("equipmentReadyEnabled", v)}
        />
        <Toggle
          label="שינוי סטטוס ציוד"
          description="שלח מייל על כל שינוי סטטוס של ציוד"
          checked={data.equipmentStatusEnabled}
          onChange={(v) => toggle("equipmentStatusEnabled", v)}
        />
      </Card>

      <SectionTitle>תהליכים ודוחות</SectionTitle>
      <Card>
        <Toggle
          label="שיוך תהליך למדריך"
          description="שלח מייל למדריך כאשר תהליך חדש משויך אליו"
          checked={data.processAssignedEnabled}
          onChange={(v) => toggle("processAssignedEnabled", v)}
        />
        <Toggle
          label="אישור דוח חודשי"
          description="שלח מייל למדריך כאשר הדוח החודשי שלו אושר"
          checked={data.reportApprovedEnabled}
          onChange={(v) => toggle("reportApprovedEnabled", v)}
        />
      </Card>

      <SectionTitle>תזכורת דוח חודשי</SectionTitle>
      <Card>
        <Toggle
          label="שלח תזכורת חודשית"
          description="שלח מייל אוטומטי למדריכים שלא הגישו דוח"
          checked={data.monthlyReminderEnabled}
          onChange={(v) => toggle("monthlyReminderEnabled", v)}
        />
        {data.monthlyReminderEnabled && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                יום בחודש לשליחה
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={data.monthlyReminderDay}
                onChange={(e) =>
                  mutation.mutate({ monthlyReminderDay: Number(e.target.value) })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-gray-400 mt-1">בין 1 ל-28</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                שעת שליחה
              </label>
              <input
                type="time"
                value={data.monthlyReminderTime}
                onChange={(e) =>
                  mutation.mutate({ monthlyReminderTime: e.target.value })
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Per-user preferences panel ----

function UserPreferencesPanel() {
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => fetchJson("/api/users"),
  });

  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);

  const { data: userPrefs } = useQuery<{
    user: User;
    prefs: NotificationPreferences;
  }>({
    queryKey: ["user-prefs", selectedUserId],
    queryFn: () =>
      fetchJson(`/api/users/${selectedUserId}/notification-preferences`),
    enabled: selectedUserId !== null,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      patchJson(`/api/notifications/preferences/${selectedUserId}`, patch),
    onSuccess: (updated) => {
      qc.setQueryData(["user-prefs", selectedUserId], (old: any) => ({
        ...old,
        prefs: updated,
      }));
    },
  });

  if (isLoading) return <p className="text-sm text-gray-400">טוען משתמשים...</p>;

  const prefs = userPrefs?.prefs;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">בחר משתמש</label>
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={selectedUserId ?? ""}
          onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
        >
          <option value="">-- בחר משתמש --</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email}) · {roleLabel(u.role)}
            </option>
          ))}
        </select>
      </div>

      {selectedUserId && prefs && (
        <Card>
          <SectionTitle>העדפות התראות אישיות</SectionTitle>
          <Toggle
            label="סדנה חדשה נוצרה"
            checked={prefs.onWorkshopCreated}
            onChange={(v) => mutation.mutate({ onWorkshopCreated: v })}
          />
          <Toggle
            label="סדנה עודכנה"
            checked={prefs.onWorkshopUpdated}
            onChange={(v) => mutation.mutate({ onWorkshopUpdated: v })}
          />
          <Toggle
            label="סדנה בוטלה"
            checked={prefs.onWorkshopCancelled}
            onChange={(v) => mutation.mutate({ onWorkshopCancelled: v })}
          />
          <Toggle
            label="ציוד מוכן לאיסוף"
            checked={prefs.onEquipmentReady}
            onChange={(v) => mutation.mutate({ onEquipmentReady: v })}
          />
          <Toggle
            label="שינוי סטטוס ציוד"
            checked={prefs.onEquipmentStatusChanged}
            onChange={(v) => mutation.mutate({ onEquipmentStatusChanged: v })}
          />
          <Toggle
            label="תהליך שויך אלי"
            checked={prefs.onProcessAssigned}
            onChange={(v) => mutation.mutate({ onProcessAssigned: v })}
          />
          <Toggle
            label="תזכורת דוח חודשי"
            checked={prefs.onMonthlyReportDue}
            onChange={(v) => mutation.mutate({ onMonthlyReportDue: v })}
          />
          <Toggle
            label="אישור דוח חודשי"
            checked={prefs.onReportApproved}
            onChange={(v) => mutation.mutate({ onReportApproved: v })}
          />
        </Card>
      )}
    </div>
  );
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: "מנהל",
    office: "משרד",
    instructor: "מדריך",
    warehouse: "מחסן",
  };
  return map[role] ?? role;
}

// ---- Main page ----

type Tab = "global" | "users";

import React, { useState } from "react";

export default function NotificationSettingsPage() {
  const [tab, setTab] = useState<Tab>("global");

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ניהול התראות מייל</h1>
          <p className="text-sm text-gray-500 mt-1">
            שלוט אילו התראות נשלחות ומתי, ברמת המערכת ולכל משתמש בנפרד
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("global")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              tab === "global"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            הגדרות מערכת
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              tab === "users"
                ? "bg-white shadow text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            העדפות משתמשים
          </button>
        </div>

        {/* Content */}
        {tab === "global" ? <GlobalSettingsPanel /> : <UserPreferencesPanel />}
      </div>
    </div>
  );
}
