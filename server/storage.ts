import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  users,
  processes,
  workshops,
  equipment,
  statusEvents,
  monthlyReports,
  clientContacts,
  workshopSummaries,
  appSettings,
  type InsertUser,
  type InsertProcess,
  type InsertWorkshop,
  type InsertEquipment,
  type InsertStatusEvent,
  type InsertMonthlyReport,
  type InsertClientContact,
  type InsertWorkshopSummary,
} from "../shared/schema.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export async function getUsers() {
  return db.select().from(users).orderBy(users.name);
}

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function createUser(data: InsertUser) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUserRole(id: number, role: string) {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

export async function getClientContacts() {
  return db.select().from(clientContacts).orderBy(clientContacts.clientName);
}

export async function getClientContactById(id: number) {
  const result = await db.select().from(clientContacts).where(eq(clientContacts.id, id));
  return result[0] || null;
}

export async function createClientContact(data: InsertClientContact) {
  const result = await db.insert(clientContacts).values(data).returning();
  return result[0];
}

export async function updateClientContact(id: number, data: Partial<InsertClientContact>) {
  const result = await db
    .update(clientContacts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clientContacts.id, id))
    .returning();
  return result[0];
}

export async function getProcesses() {
  return db.select().from(processes).orderBy(desc(processes.createdAt));
}

export async function getProcessById(id: number) {
  const result = await db.select().from(processes).where(eq(processes.id, id));
  return result[0] || null;
}

export async function createProcess(data: InsertProcess) {
  const result = await db.insert(processes).values(data).returning();
  return result[0];
}

export async function updateProcess(id: number, data: Partial<InsertProcess>) {
  const result = await db
    .update(processes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(processes.id, id))
    .returning();
  return result[0];
}

export async function deleteProcess(id: number) {
  await db.delete(processes).where(eq(processes.id, id));
}

export async function getWorkshops() {
  return db.select().from(workshops).orderBy(desc(workshops.createdAt));
}

export async function getWorkshopById(id: number) {
  const result = await db.select().from(workshops).where(eq(workshops.id, id));
  return result[0] || null;
}

export async function getWorkshopsByProcess(processId: number) {
  return db
    .select()
    .from(workshops)
    .where(eq(workshops.processId, processId))
    .orderBy(desc(workshops.createdAt));
}

export async function getWorkshopsWithDetails(filters?: { month?: number; year?: number; instructorId?: number }) {
  let query = db
    .select({
      id: workshops.id,
      title: workshops.title,
      date: workshops.date,
      location: workshops.location,
      participants: workshops.participants,
      status: workshops.status,
      clientName: workshops.clientName,
      instructorId: workshops.instructorId,
      instructorName: users.name,
      createdAt: workshops.createdAt,
    })
    .from(workshops)
    .leftJoin(users, eq(workshops.instructorId, users.id))
    .orderBy(desc(workshops.date));

  const conditions = [];
  if (filters?.instructorId) {
    conditions.push(eq(workshops.instructorId, filters.instructorId));
  }
  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);
    conditions.push(gte(workshops.date, startDate));
    conditions.push(lte(workshops.date, endDate));
  } else if (filters?.year) {
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year, 11, 31, 23, 59, 59);
    conditions.push(gte(workshops.date, startDate));
    conditions.push(lte(workshops.date, endDate));
  }

  if (conditions.length > 0) {
    return db
      .select({
        id: workshops.id,
        title: workshops.title,
        date: workshops.date,
        location: workshops.location,
        participants: workshops.participants,
        status: workshops.status,
        clientName: workshops.clientName,
        instructorId: workshops.instructorId,
        instructorName: users.name,
        createdAt: workshops.createdAt,
      })
      .from(workshops)
      .leftJoin(users, eq(workshops.instructorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(workshops.date));
  }

  return query;
}

export async function createWorkshop(data: InsertWorkshop) {
  const result = await db.insert(workshops).values(data).returning();
  return result[0];
}

export async function updateWorkshop(id: number, data: Partial<InsertWorkshop>) {
  const result = await db
    .update(workshops)
    .set(data)
    .where(eq(workshops.id, id))
    .returning();
  return result[0];
}

export async function deleteWorkshop(id: number) {
  await db.delete(workshopSummaries).where(eq(workshopSummaries.workshopId, id));
  const workshopEquipment = await db.select({ id: equipment.id }).from(equipment).where(eq(equipment.workshopId, id));
  for (const eq_item of workshopEquipment) {
    await db.delete(statusEvents).where(eq(statusEvents.equipmentId, eq_item.id));
  }
  await db.delete(equipment).where(eq(equipment.workshopId, id));
  await db.delete(workshops).where(eq(workshops.id, id));
}

export async function getEquipment() {
  const result = await db
    .select({
      id: equipment.id,
      name: equipment.name,
      workshopId: equipment.workshopId,
      status: equipment.status,
      assignedTo: equipment.assignedTo,
      notes: equipment.notes,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      workshopTitle: workshops.title,
      workshopDate: workshops.date,
      workshopLocation: workshops.location,
    })
    .from(equipment)
    .leftJoin(workshops, eq(equipment.workshopId, workshops.id))
    .orderBy(desc(equipment.createdAt));
  return result;
}

export async function getEquipmentByWorkshop(workshopId: number) {
  return db
    .select()
    .from(equipment)
    .where(eq(equipment.workshopId, workshopId));
}

export async function createEquipment(data: InsertEquipment) {
  const result = await db.insert(equipment).values(data).returning();
  return result[0];
}

export async function updateEquipmentStatus(
  id: number,
  newStatus: string,
  userId: number,
  notes?: string
) {
  const existing = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id));
  if (!existing[0]) throw new Error("Equipment not found");

  const oldStatus = existing[0].status;

  await db.insert(statusEvents).values({
    equipmentId: id,
    fromStatus: oldStatus,
    toStatus: newStatus,
    changedBy: userId,
    notes,
  });

  const result = await db
    .update(equipment)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(equipment.id, id))
    .returning();
  return result[0];
}

export async function getStatusEvents(equipmentId: number) {
  return db
    .select()
    .from(statusEvents)
    .where(eq(statusEvents.equipmentId, equipmentId))
    .orderBy(desc(statusEvents.createdAt));
}

export async function getMonthlyReports() {
  return db
    .select()
    .from(monthlyReports)
    .orderBy(desc(monthlyReports.year), desc(monthlyReports.month));
}

export async function createMonthlyReport(data: InsertMonthlyReport) {
  const result = await db.insert(monthlyReports).values(data).returning();
  return result[0];
}

export async function getWorkshopSummary(workshopId: number) {
  const result = await db.select().from(workshopSummaries).where(eq(workshopSummaries.workshopId, workshopId));
  return result[0] || null;
}

export async function createWorkshopSummary(data: InsertWorkshopSummary) {
  const result = await db.insert(workshopSummaries).values(data).returning();
  return result[0];
}

export async function updateWorkshopSummary(workshopId: number, data: Partial<InsertWorkshopSummary>) {
  const result = await db
    .update(workshopSummaries)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workshopSummaries.workshopId, workshopId))
    .returning();
  return result[0];
}

export async function getDashboardStats() {
  const allProcesses = await db.select().from(processes);
  const allWorkshops = await db.select().from(workshops);
  const allEquipment = await db.select().from(equipment);
  const allUsers = await db.select().from(users);

  return {
    totalProcesses: allProcesses.length,
    activeProcesses: allProcesses.filter((p) => p.status === "active").length,
    totalWorkshops: allWorkshops.length,
    totalEquipment: allEquipment.length,
    equipmentByStatus: {
      ORDERED: allEquipment.filter((e) => e.status === "ORDERED").length,
      READY: allEquipment.filter((e) => e.status === "READY").length,
      PICKED_UP: allEquipment.filter((e) => e.status === "PICKED_UP").length,
      RETURNED: allEquipment.filter((e) => e.status === "RETURNED").length,
    },
    totalInstructors: allUsers.filter((u) => u.role === "instructor").length,
  };
}

export async function getSetting(key: string) {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));
  if (existing) {
    await db.update(appSettings).set({ value, updatedAt: new Date() }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value });
  }
}
