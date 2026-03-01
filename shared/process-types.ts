export const processTypes = [
  { value: "workshop", label: "סדנה" },
  { value: "course", label: "קורס" },
  { value: "odt", label: "ODT - פיתוח ארגוני" },
  { value: "coaching", label: "אימון אישי" },
  { value: "consulting", label: "ייעוץ" },
  { value: "facilitation", label: "הנחיה" },
] as const;

export const processStatuses = [
  { value: "active", label: "פעיל" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
  { value: "on_hold", label: "מושהה" },
] as const;

export const equipmentStatuses = [
  { value: "ORDERED", label: "הוזמן" },
  { value: "READY", label: "מוכן" },
  { value: "PICKED_UP", label: "נאסף" },
  { value: "RETURNED", label: "הוחזר" },
] as const;

export const userRoles = [
  { value: "admin", label: "מנהל" },
  { value: "instructor", label: "מנחה" },
  { value: "office", label: "משרד" },
  { value: "warehouse", label: "מחסן" },
] as const;

export type ProcessType = (typeof processTypes)[number]["value"];
export type ProcessStatus = (typeof processStatuses)[number]["value"];
export type EquipmentStatus = (typeof equipmentStatuses)[number]["value"];
export type UserRole = (typeof userRoles)[number]["value"];
