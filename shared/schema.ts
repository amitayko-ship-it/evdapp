import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("instructor"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const clientContacts = pgTable("client_contacts", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  type: text("type").notNull().default("workshop"),
  status: text("status").notNull().default("active"),
  instructorId: integer("instructor_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workshops = pgTable("workshops", {
  id: serial("id").primaryKey(),
  processId: integer("process_id").references(() => processes.id),
  title: text("title").notNull(),
  date: timestamp("date"),
  location: text("location"),
  participants: integer("participants"),
  exercises: jsonb("exercises").$type<any[]>().default([]),
  checklist: jsonb("checklist").$type<Record<string, string>>().default({}),
  notes: text("notes"),
  status: text("status").notNull().default("planned"),
  instructorId: integer("instructor_id").references(() => users.id),
  clientName: text("client_name"),
  hrContactName: text("hr_contact_name"),
  hrContactPhone: text("hr_contact_phone"),
  hrContactEmail: text("hr_contact_email"),
  procurementContactName: text("procurement_contact_name"),
  procurementContactPhone: text("procurement_contact_phone"),
  procurementContactEmail: text("procurement_contact_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  workshopId: integer("workshop_id").references(() => workshops.id),
  status: text("status").notNull().default("ORDERED"),
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const statusEvents = pgTable("status_events", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  changedBy: integer("changed_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  workshopCount: integer("workshop_count").notNull().default(0),
  processCount: integer("process_count").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workshopSummaries = pgTable("workshop_summaries", {
  id: serial("id").primaryKey(),
  workshopId: integer("workshop_id").references(() => workshops.id).notNull().unique(),
  participantsCount: integer("participants_count").notNull(),
  actualExercises: jsonb("actual_exercises").$type<string[]>().default([]),
  instructorInsight: text("instructor_insight"),
  dayInsight: text("day_insight"),
  safetyIncident: boolean("safety_incident").notNull().default(false),
  safetyDetails: text("safety_details"),
  issuesOrExceptions: text("issues_or_exceptions"),
  feedbackSent: boolean("feedback_sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ClientContact = typeof clientContacts.$inferSelect;
export type InsertClientContact = typeof clientContacts.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type InsertProcess = typeof processes.$inferInsert;
export type Workshop = typeof workshops.$inferSelect;
export type InsertWorkshop = typeof workshops.$inferInsert;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = typeof equipment.$inferInsert;
export type StatusEvent = typeof statusEvents.$inferSelect;
export type InsertStatusEvent = typeof statusEvents.$inferInsert;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = typeof monthlyReports.$inferInsert;
export type WorkshopSummary = typeof workshopSummaries.$inferSelect;
export type InsertWorkshopSummary = typeof workshopSummaries.$inferInsert;

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;

export const EQUIPMENT_STATUS = {
  ORDERED: "ORDERED",
  READY: "READY",
  PICKED_UP: "PICKED_UP",
  RETURNED: "RETURNED",
} as const;
