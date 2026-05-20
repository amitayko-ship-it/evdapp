import { useAuth } from "./useAuth";

export type UserRole = "admin" | "instructor" | "warehouse" | "office";

interface Permissions {
  canViewDashboard: boolean;
  canViewWorkshops: boolean;
  canCreateWorkshop: boolean;
  canViewEquipment: boolean;
  canUpdateEquipment: boolean;
  canViewMonthlyReport: boolean;
  canViewUsers: boolean;
  canManageUsers: boolean;
  canViewCalendar: boolean;
  canViewWorkshopSummary: boolean;
  canCreateWorkshopSummary: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  admin: {
    canViewDashboard: true,
    canViewWorkshops: true,
    canCreateWorkshop: true,
    canViewEquipment: true,
    canUpdateEquipment: true,
    canViewMonthlyReport: true,
    canViewUsers: true,
    canManageUsers: true,
    canViewCalendar: true,
    canViewWorkshopSummary: true,
    canCreateWorkshopSummary: true,
  },
  instructor: {
    canViewDashboard: true,
    canViewWorkshops: true,
    canCreateWorkshop: true,
    canViewEquipment: true,
    canUpdateEquipment: true,
    canViewMonthlyReport: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewCalendar: true,
    canViewWorkshopSummary: true,
    canCreateWorkshopSummary: true,
  },
  warehouse: {
    canViewDashboard: false,
    canViewWorkshops: false,
    canCreateWorkshop: false,
    canViewEquipment: true,
    canUpdateEquipment: true,
    canViewMonthlyReport: false,
    canViewUsers: false,
    canManageUsers: false,
    canViewCalendar: false,
    canViewWorkshopSummary: false,
    canCreateWorkshopSummary: false,
  },
  office: {
    canViewDashboard: true,
    canViewWorkshops: true,
    canCreateWorkshop: false,
    canViewEquipment: true,
    canUpdateEquipment: false,
    canViewMonthlyReport: true,
    canViewUsers: false,
    canManageUsers: false,
    canViewCalendar: true,
    canViewWorkshopSummary: true,
    canCreateWorkshopSummary: false,
  },
};

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const role = (user?.role as UserRole) ?? "instructor";
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.instructor;
}
