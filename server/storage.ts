import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import {
  users,
  notificationPreferences,
  notificationSettings,
  processes,
  workshops,
  equipment,
  statusEvents,
  monthlyReports,
  type User,
  type InsertUser,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type NotificationSettings,
  type Process,
  type Workshop,
  type Equipment,
  type MonthlyReport,
} from "../shared/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);

// --- Users ---

export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// --- Notification preferences ---

export async function getNotificationPreferences(
  userId: number
): Promise<NotificationPreferences | undefined> {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  return prefs;
}

export async function upsertNotificationPreferences(
  userId: number,
  data: Partial<InsertNotificationPreferences>
): Promise<NotificationPreferences> {
  const existing = await getNotificationPreferences(userId);

  if (existing) {
    const [updated] = await db
      .update(notificationPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(notificationPreferences)
    .values({ userId, ...data })
    .returning();
  return created;
}

// Get all users who have a specific notification preference enabled
export async function getUsersForNotification(
  preferenceKey: keyof NotificationPreferences
): Promise<User[]> {
  const prefs = await db
    .select({ userId: notificationPreferences.userId })
    .from(notificationPreferences)
    .where(eq(notificationPreferences[preferenceKey] as any, true));

  if (!prefs.length) return [];

  const userIds = prefs.map((p) => p.userId);
  return db
    .select()
    .from(users)
    .where(
      userIds.length === 1
        ? eq(users.id, userIds[0])
        : (users.id as any).inArray(userIds)
    );
}

// --- Global notification settings ---

const SETTINGS_ROW_ID = 1; // single-row config table

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const [row] = await db.select().from(notificationSettings).where(eq(notificationSettings.id, SETTINGS_ROW_ID));
  if (row) return row;

  // Seed default row on first access
  const [created] = await db.insert(notificationSettings).values({ id: SETTINGS_ROW_ID }).returning();
  return created;
}

export async function updateNotificationSettings(
  data: Partial<Omit<NotificationSettings, "id" | "updatedAt">>
): Promise<NotificationSettings> {
  await getNotificationSettings(); // ensure row exists
  const [updated] = await db
    .update(notificationSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notificationSettings.id, SETTINGS_ROW_ID))
    .returning();
  return updated;
}

// --- Processes ---

export async function getProcessById(id: number): Promise<Process | undefined> {
  const [process] = await db.select().from(processes).where(eq(processes.id, id));
  return process;
}

export async function getAllProcesses(): Promise<Process[]> {
  return db.select().from(processes);
}

// --- Workshops ---

export async function getWorkshopById(id: number): Promise<Workshop | undefined> {
  const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id));
  return workshop;
}

// --- Equipment ---

export async function getEquipmentById(id: number): Promise<Equipment | undefined> {
  const [item] = await db.select().from(equipment).where(eq(equipment.id, id));
  return item;
}

export async function updateEquipmentStatus(
  id: number,
  status: Equipment["status"],
  changedById: number
): Promise<Equipment> {
  const existing = await getEquipmentById(id);
  if (!existing) throw new Error(`Equipment ${id} not found`);

  const [updated] = await db
    .update(equipment)
    .set({ status, updatedAt: new Date() })
    .where(eq(equipment.id, id))
    .returning();

  // Record audit event
  await db.insert(statusEvents).values({
    equipmentId: id,
    fromStatus: existing.status,
    toStatus: status,
    changedById,
  });

  return updated;
}

// --- Monthly reports ---

export async function getMonthlyReport(
  instructorId: number,
  month: number,
  year: number
): Promise<MonthlyReport | undefined> {
  const [report] = await db
    .select()
    .from(monthlyReports)
    .where(
      and(
        eq(monthlyReports.instructorId, instructorId),
        eq(monthlyReports.month, month),
        eq(monthlyReports.year, year)
      )
    );
  return report;
}

export async function approveMonthlyReport(
  reportId: number,
  approvedById: number
): Promise<MonthlyReport> {
  const [updated] = await db
    .update(monthlyReports)
    .set({ approved: true, approvedById })
    .where(eq(monthlyReports.id, reportId))
    .returning();
  return updated;
}
