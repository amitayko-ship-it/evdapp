import { Router, type Request, type Response } from "express";
import {
  getAllUsers,
  getUserById,
  getNotificationPreferences,
  upsertNotificationPreferences,
  updateEquipmentStatus,
  getEquipmentById,
  getWorkshopById,
  getProcessById,
  approveMonthlyReport,
  getAllProcesses,
  db,
} from "./storage";
import {
  notifyEquipmentStatusChanged,
  notifyWorkshopCreated,
  notifyWorkshopUpdated,
  notifyWorkshopCancelled,
  notifyReportApproved,
  notifyProcessAssigned,
} from "./notifications";
import { workshops, processes, monthlyReports, users } from "../shared/schema";
import { eq } from "drizzle-orm";

export const router = Router();

// ---- Users ----

router.get("/users", async (_req: Request, res: Response) => {
  const allUsers = await getAllUsers();
  res.json(allUsers);
});

router.get("/users/:id", async (req: Request, res: Response) => {
  const user = await getUserById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ---- Notification preferences ----

/**
 * GET /api/notifications/preferences/:userId
 * Returns the notification preferences for a user.
 */
router.get("/notifications/preferences/:userId", async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  let prefs = await getNotificationPreferences(userId);

  if (!prefs) {
    // Return defaults (all true)
    prefs = await upsertNotificationPreferences(userId, {});
  }

  res.json(prefs);
});

/**
 * PATCH /api/notifications/preferences/:userId
 * Update notification preferences for a user.
 * Body: partial NotificationPreferences object (boolean flags)
 */
router.patch("/notifications/preferences/:userId", async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const user = await getUserById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const allowedKeys = [
    "onWorkshopCreated",
    "onWorkshopUpdated",
    "onWorkshopCancelled",
    "onEquipmentStatusChanged",
    "onEquipmentReady",
    "onMonthlyReportDue",
    "onReportApproved",
    "onProcessAssigned",
  ];

  const filtered: Record<string, boolean> = {};
  for (const key of allowedKeys) {
    if (key in req.body && typeof req.body[key] === "boolean") {
      filtered[key] = req.body[key];
    }
  }

  const updated = await upsertNotificationPreferences(userId, filtered);
  res.json(updated);
});

// ---- Equipment status ----

/**
 * PATCH /api/equipment/:id/status
 * Updates equipment status and sends email notifications to relevant users.
 */
router.patch("/equipment/:id/status", async (req: Request, res: Response) => {
  const itemId = Number(req.params.id);
  const { status, changedById } = req.body;

  if (!status || !changedById) {
    return res.status(400).json({ error: "status and changedById are required" });
  }

  const item = await getEquipmentById(itemId);
  if (!item) return res.status(404).json({ error: "Equipment not found" });

  const fromStatus = item.status;
  const updated = await updateEquipmentStatus(itemId, status, changedById);

  // Send email notifications
  try {
    const changedBy = await getUserById(changedById);
    if (changedBy) {
      const allUsers = await getAllUsers();
      // Filter users who opted in to equipment notifications
      const prefResults = await Promise.all(
        allUsers.map(async (u) => {
          const prefs = await getNotificationPreferences(u.id);
          const wantsNotif =
            status === "READY"
              ? prefs?.onEquipmentReady ?? true
              : prefs?.onEquipmentStatusChanged ?? true;
          return wantsNotif ? u : null;
        })
      );
      const recipients = prefResults.filter(Boolean) as typeof allUsers;

      await notifyEquipmentStatusChanged(recipients, updated, fromStatus, status, changedBy);
    }
  } catch (err) {
    console.error("Failed to send equipment notification:", err);
  }

  res.json(updated);
});

// ---- Workshops ----

/**
 * POST /api/workshops
 * Creates a workshop and notifies relevant users.
 */
router.post("/workshops", async (req: Request, res: Response) => {
  const { processId, title, scheduledAt, location, notes } = req.body;

  if (!processId || !title) {
    return res.status(400).json({ error: "processId and title are required" });
  }

  const [workshop] = await db
    .insert(workshops)
    .values({ processId, title, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, location, notes })
    .returning();

  const process = await getProcessById(processId);

  // Send notifications
  try {
    if (process) {
      const allUsers = await getAllUsers();
      const prefResults = await Promise.all(
        allUsers.map(async (u) => {
          const prefs = await getNotificationPreferences(u.id);
          return prefs?.onWorkshopCreated ?? true ? u : null;
        })
      );
      const recipients = prefResults.filter(Boolean) as typeof allUsers;
      await notifyWorkshopCreated(recipients, workshop, process);
    }
  } catch (err) {
    console.error("Failed to send workshop created notification:", err);
  }

  res.status(201).json(workshop);
});

/**
 * PATCH /api/workshops/:id
 * Updates a workshop and notifies relevant users.
 */
router.patch("/workshops/:id", async (req: Request, res: Response) => {
  const workshopId = Number(req.params.id);
  const { title, scheduledAt, location, notes, cancelled } = req.body;

  const existing = await getWorkshopById(workshopId);
  if (!existing) return res.status(404).json({ error: "Workshop not found" });

  const updates: Partial<typeof existing> = {};
  if (title !== undefined) updates.title = title;
  if (scheduledAt !== undefined) updates.scheduledAt = new Date(scheduledAt);
  if (location !== undefined) updates.location = location;
  if (notes !== undefined) updates.notes = notes;
  if (cancelled !== undefined) updates.cancelled = cancelled;

  const [updated] = await db
    .update(workshops)
    .set(updates)
    .where(eq(workshops.id, workshopId))
    .returning();

  const process = await getProcessById(existing.processId);

  // Send notifications
  try {
    if (process) {
      const allUsers = await getAllUsers();
      if (cancelled === true) {
        const prefResults = await Promise.all(
          allUsers.map(async (u) => {
            const prefs = await getNotificationPreferences(u.id);
            return prefs?.onWorkshopCancelled ?? true ? u : null;
          })
        );
        const recipients = prefResults.filter(Boolean) as typeof allUsers;
        await notifyWorkshopCancelled(recipients, updated, process);
      } else {
        const prefResults = await Promise.all(
          allUsers.map(async (u) => {
            const prefs = await getNotificationPreferences(u.id);
            return prefs?.onWorkshopUpdated ?? true ? u : null;
          })
        );
        const recipients = prefResults.filter(Boolean) as typeof allUsers;
        await notifyWorkshopUpdated(recipients, updated, process);
      }
    }
  } catch (err) {
    console.error("Failed to send workshop update notification:", err);
  }

  res.json(updated);
});

// ---- Processes ----

router.get("/processes", async (_req: Request, res: Response) => {
  const all = await getAllProcesses();
  res.json(all);
});

/**
 * POST /api/processes
 * Creates a process. If instructorId is provided, notifies that instructor.
 */
router.post("/processes", async (req: Request, res: Response) => {
  const { name, type, clientName, instructorId } = req.body;

  if (!name || !type || !clientName) {
    return res.status(400).json({ error: "name, type, and clientName are required" });
  }

  const [process] = await db
    .insert(processes)
    .values({ name, type, clientName, instructorId })
    .returning();

  // Notify assigned instructor
  try {
    if (instructorId) {
      const instructor = await getUserById(instructorId);
      if (instructor) {
        const prefs = await getNotificationPreferences(instructorId);
        if (prefs?.onProcessAssigned ?? true) {
          await notifyProcessAssigned(instructor, process);
        }
      }
    }
  } catch (err) {
    console.error("Failed to send process assignment notification:", err);
  }

  res.status(201).json(process);
});

// ---- Monthly Reports ----

/**
 * POST /api/reports/:id/approve
 * Approves a monthly report and notifies the instructor.
 */
router.post("/reports/:id/approve", async (req: Request, res: Response) => {
  const reportId = Number(req.params.id);
  const { approvedById } = req.body;

  if (!approvedById) {
    return res.status(400).json({ error: "approvedById is required" });
  }

  const report = await approveMonthlyReport(reportId, approvedById);

  // Send notification to instructor
  try {
    const instructor = await getUserById(report.instructorId);
    const approvedBy = await getUserById(approvedById);
    if (instructor && approvedBy) {
      const prefs = await getNotificationPreferences(instructor.id);
      if (prefs?.onReportApproved ?? true) {
        await notifyReportApproved(instructor, report, approvedBy);
      }
    }
  } catch (err) {
    console.error("Failed to send report approval notification:", err);
  }

  res.json(report);
});
