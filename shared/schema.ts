import { pgTable, text, integer, boolean, timestamp, pgEnum, time } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["instructor", "office", "warehouse", "admin"]);
export const equipmentStatusEnum = pgEnum("equipment_status", ["ORDERED", "READY", "PICKED_UP", "RETURNED"]);
export const processTypeEnum = pgEnum("process_type", ["workshop", "course", "ODT", "other"]);

// Users table
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("instructor"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences per user
export const notificationPreferences = pgTable("notification_preferences", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull().references(() => users.id),
  // Workshop events
  onWorkshopCreated: boolean("on_workshop_created").notNull().default(true),
  onWorkshopUpdated: boolean("on_workshop_updated").notNull().default(true),
  onWorkshopCancelled: boolean("on_workshop_cancelled").notNull().default(true),
  // Equipment events
  onEquipmentStatusChanged: boolean("on_equipment_status_changed").notNull().default(true),
  onEquipmentReady: boolean("on_equipment_ready").notNull().default(true),
  // Report events
  onMonthlyReportDue: boolean("on_monthly_report_due").notNull().default(true),
  onReportApproved: boolean("on_report_approved").notNull().default(true),
  // Process events
  onProcessAssigned: boolean("on_process_assigned").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Processes (client consulting engagements)
export const processes = pgTable("processes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  type: processTypeEnum("type").notNull(),
  clientName: text("client_name").notNull(),
  instructorId: integer("instructor_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Workshops
export const workshops = pgTable("workshops", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  processId: integer("process_id").notNull().references(() => processes.id),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  location: text("location"),
  notes: text("notes"),
  cancelled: boolean("cancelled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment
export const equipment = pgTable("equipment", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  workshopId: integer("workshop_id").notNull().references(() => workshops.id),
  name: text("name").notNull(),
  status: equipmentStatusEnum("status").notNull().default("ORDERED"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment status audit log
export const statusEvents = pgTable("status_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  equipmentId: integer("equipment_id").notNull().references(() => equipment.id),
  fromStatus: equipmentStatusEnum("from_status"),
  toStatus: equipmentStatusEnum("to_status").notNull(),
  changedById: integer("changed_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly reports
export const monthlyReports = pgTable("monthly_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  instructorId: integer("instructor_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  workshopsCount: integer("workshops_count").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
  approvedById: integer("approved_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Global notification settings (admin-controlled, system-wide)
// One row per "key" – acts as a key-value store for notification config.
export const notificationSettings = pgTable("notification_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // Global toggles – disable a notification type for the whole system
  workshopCreatedEnabled: boolean("workshop_created_enabled").notNull().default(true),
  workshopUpdatedEnabled: boolean("workshop_updated_enabled").notNull().default(true),
  workshopCancelledEnabled: boolean("workshop_cancelled_enabled").notNull().default(true),
  equipmentStatusEnabled: boolean("equipment_status_enabled").notNull().default(true),
  equipmentReadyEnabled: boolean("equipment_ready_enabled").notNull().default(true),
  processAssignedEnabled: boolean("process_assigned_enabled").notNull().default(true),
  reportApprovedEnabled: boolean("report_approved_enabled").notNull().default(true),
  // Monthly report reminder settings
  monthlyReminderEnabled: boolean("monthly_reminder_enabled").notNull().default(true),
  // Day of month to send the reminder (1–28)
  monthlyReminderDay: integer("monthly_reminder_day").notNull().default(25),
  // Time of day to send (HH:MM, stored as text for simplicity)
  monthlyReminderTime: text("monthly_reminder_time").notNull().default("09:00"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type Process = typeof processes.$inferSelect;
export type Workshop = typeof workshops.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
