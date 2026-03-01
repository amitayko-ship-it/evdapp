import type { Express, Request, Response } from "express";
import * as storage from "./storage.js";
import PDFDocument from "pdfkit";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export function registerRoutes(app: Express) {
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "נדרש אימייל" });

      const SUPER_ADMIN_EMAIL = "amitay@evd.co.il";
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.createUser({
          email,
          name: email.split("@")[0],
          role: email === SUPER_ADMIN_EMAIL ? "admin" : "instructor",
        });
      } else if (email === SUPER_ADMIN_EMAIL && user.role !== "admin") {
        await storage.updateUserRole(user.id, "admin");
        user = { ...user, role: "admin" };
      }

      req.session.userId = user.id;
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "לא מחובר" });
      }
      const user = await storage.getUserById(req.session.userId);
      if (!user) return res.status(401).json({ error: "משתמש לא נמצא" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getUsers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id/role", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "לא מחובר" });
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "admin") return res.status(403).json({ error: "הרשאה נדרשת" });
      const targetId = parseInt(req.params.id);
      if (targetId === userId) return res.status(400).json({ error: "לא ניתן לשנות את התפקיד שלך" });
      const { role } = req.body;
      if (!["instructor", "admin", "office", "warehouse"].includes(role)) {
        return res.status(400).json({ error: "תפקיד לא חוקי" });
      }
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) return res.status(404).json({ error: "משתמש לא נמצא" });
      await storage.updateUserRole(targetId, role);
      const updated = await storage.getUserById(targetId);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "לא מחובר" });
      const currentUser = await storage.getUserById(userId);
      if (!currentUser || currentUser.role !== "admin") return res.status(403).json({ error: "הרשאה נדרשת" });
      const targetId = parseInt(req.params.id);
      if (targetId === userId) return res.status(400).json({ error: "לא ניתן למחוק את עצמך" });
      const targetUser = await storage.getUserById(targetId);
      if (!targetUser) return res.status(404).json({ error: "משתמש לא נמצא" });
      await storage.deleteUser(targetId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard", async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/client-contacts", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getClientContacts();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/client-contacts", async (req: Request, res: Response) => {
    try {
      const result = await storage.createClientContact(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/client-contacts/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.updateClientContact(Number(req.params.id), req.body);
      if (!result) return res.status(404).json({ error: "איש קשר לא נמצא" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/processes", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getProcesses();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/processes/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.getProcessById(Number(req.params.id));
      if (!result) return res.status(404).json({ error: "תהליך לא נמצא" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/processes", async (req: Request, res: Response) => {
    try {
      const result = await storage.createProcess(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/processes/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.updateProcess(Number(req.params.id), req.body);
      if (!result) return res.status(404).json({ error: "תהליך לא נמצא" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/processes/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteProcess(Number(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/exercises", async (_req: Request, res: Response) => {
    try {
      const { exercises } = await import("../shared/exercises-data.js");
      res.json(exercises);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workshops", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getWorkshops();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workshops/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.getWorkshopById(Number(req.params.id));
      if (!result) return res.status(404).json({ error: "סדנה לא נמצאה" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/processes/:id/workshops", async (req: Request, res: Response) => {
    try {
      const result = await storage.getWorkshopsByProcess(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workshops", async (req: Request, res: Response) => {
    try {
      const { selectedExercises, numGroups, ...workshopData } = req.body;

      const workshopPayload: any = {
        title: workshopData.title || `סדנה - ${workshopData.location || "חדש"}`,
        date: workshopData.date ? new Date(workshopData.date) : null,
        location: workshopData.location,
        participants: workshopData.participants || null,
        checklist: workshopData.checklist || {},
        exercises: selectedExercises || [],
        notes: workshopData.notes || null,
        processId: workshopData.processId || null,
        instructorId: workshopData.instructorId || (req.session.userId ?? null),
        clientName: workshopData.clientName || null,
        hrContactName: workshopData.hrContactName || null,
        hrContactPhone: workshopData.hrContactPhone || null,
        hrContactEmail: workshopData.hrContactEmail || null,
        procurementContactName: workshopData.procurementContactName || null,
        procurementContactPhone: workshopData.procurementContactPhone || null,
        procurementContactEmail: workshopData.procurementContactEmail || null,
      };

      const workshop = await storage.createWorkshop(workshopPayload);

      if (selectedExercises && selectedExercises.length > 0) {
        for (const ex of selectedExercises) {
          if (ex.equipment && ex.equipment.length > 0) {
            for (const item of ex.equipment) {
              await storage.createEquipment({
                name: item,
                workshopId: workshop.id,
                status: "ORDERED",
              });
            }
          }
        }
      }

      res.status(201).json(workshop);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workshops/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWorkshop(Number(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/workshops/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.updateWorkshop(Number(req.params.id), req.body);
      if (!result) return res.status(404).json({ error: "סדנה לא נמצאה" });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workshops/:id/work-order", async (req: Request, res: Response) => {
    try {
      const workshop = await storage.getWorkshopById(Number(req.params.id));
      if (!workshop) return res.status(404).json({ error: "סדנה לא נמצאה" });

      let instructor = null;
      if (workshop.instructorId) {
        instructor = await storage.getUserById(workshop.instructorId);
      }

      const fontPath = new URL("./fonts/NotoSansHebrew-Regular.ttf", import.meta.url).pathname;
      const doc = new PDFDocument({ size: "A4", layout: "portrait" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=work-order-${workshop.id}.pdf`
      );

      doc.pipe(res);

      doc.registerFont("Hebrew", fontPath);
      doc.font("Hebrew");

      const isHebrew = (ch: string) => /[\u0590-\u05FF]/.test(ch);
      const reverseRtl = (text: string): string => {
        const segments: { text: string; rtl: boolean }[] = [];
        let current = "";
        let currentIsRtl = false;

        for (const ch of text) {
          const charIsHebrew = isHebrew(ch);
          if (current.length === 0) {
            current = ch;
            currentIsRtl = charIsHebrew;
          } else if (charIsHebrew === currentIsRtl || ch === " " || ch === "-" || ch === ":" || ch === "," || ch === "." || ch === "(" || ch === ")") {
            current += ch;
          } else {
            segments.push({ text: current, rtl: currentIsRtl });
            current = ch;
            currentIsRtl = charIsHebrew;
          }
        }
        if (current) segments.push({ text: current, rtl: currentIsRtl });

        segments.reverse();
        return segments.map(s => s.rtl ? s.text.split("").reverse().join("") : s.text).join("");
      };

      const addLine = (label: string, value: string) => {
        doc.text(reverseRtl(`${label}: ${value}`), { align: "right" });
        doc.moveDown(0.5);
      };

      doc.fontSize(22).text(reverseRtl("אבן דרך - הזמנת עבודה"), { align: "center" });
      doc.moveDown();
      doc.fontSize(16).text(reverseRtl(workshop.title), { align: "center" });
      doc.moveDown(2);

      doc.fontSize(12);

      if (workshop.clientName) addLine("לקוח", workshop.clientName);
      if (workshop.date) addLine("תאריך", new Date(workshop.date).toLocaleDateString("he-IL"));
      if (workshop.location) addLine("מיקום", workshop.location);
      if (instructor) addLine("מנחה", instructor.name);
      if (workshop.participants) addLine("משתתפים", String(workshop.participants));

      doc.moveDown();

      if (workshop.hrContactName) {
        addLine("איש קשר HR", workshop.hrContactName);
        if (workshop.hrContactPhone) addLine("טלפון HR", workshop.hrContactPhone);
        if (workshop.hrContactEmail) addLine("אימייל HR", workshop.hrContactEmail);
      }

      if (workshop.procurementContactName) {
        addLine("איש קשר רכש", workshop.procurementContactName);
        if (workshop.procurementContactPhone) addLine("טלפון רכש", workshop.procurementContactPhone);
        if (workshop.procurementContactEmail) addLine("אימייל רכש", workshop.procurementContactEmail);
      }

      doc.moveDown();

      if (workshop.exercises && (workshop.exercises as any[]).length > 0) {
        const { exercises: exercisesList } = await import("../shared/exercises-data.js");
        doc.fontSize(14).text(reverseRtl("תרגילים:"), { align: "right", underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        for (const ex of workshop.exercises as any[]) {
          const exerciseDef = exercisesList.find((e: any) => e.id === ex.exerciseId);
          const name = exerciseDef ? exerciseDef.name : `#${ex.exerciseId}`;
          doc.text(reverseRtl(`• ${name}`), { align: "right" });
          if (ex.equipment && ex.equipment.length > 0) {
            doc.text(reverseRtl(`  ציוד: ${ex.equipment.join(", ")}`), { align: "right" });
          }
          if (ex.notes) {
            doc.text(reverseRtl(`  הערות: ${ex.notes}`), { align: "right" });
          }
          doc.moveDown(0.3);
        }
      }

      const checklist = workshop.checklist as Record<string, string> | null;
      if (checklist && Object.keys(checklist).length > 0) {
        doc.moveDown();
        doc.fontSize(14).text(reverseRtl("רשימת בדיקות:"), { align: "right", underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        const checklistLabels: Record<string, string> = {
          assistant: "עוזר לוגיסטי",
          medic: "חובש",
          breakfast: "ארוחת בוקר",
          lunch: "ארוחת צהרים",
          dinner: "ארוחת ערב",
          campfire: "ערב על מדורה",
          workOrder: "הזמנת עבודה חתומה",
          safetyBriefing: "שיחת SV",
        };
        for (const [key, val] of Object.entries(checklist)) {
          const label = checklistLabels[key] || key;
          const valText = val === "yes" ? "כן" : "לא";
          doc.text(reverseRtl(`• ${label} - ${valText}`), { align: "right" });
        }
      }

      if (workshop.notes) {
        doc.moveDown();
        doc.fontSize(14).text(reverseRtl("הערות:"), { align: "right", underline: true });
        doc.fontSize(12);
        doc.moveDown(0.5);
        doc.text(reverseRtl(workshop.notes), { align: "right" });
      }

      doc.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/monthly", async (req: Request, res: Response) => {
    try {
      const { month, year, instructorId } = req.query;
      const filters: any = {};
      if (month) filters.month = Number(month);
      if (year) filters.year = Number(year);
      if (instructorId) filters.instructorId = Number(instructorId);
      const data = await storage.getWorkshopsWithDetails(filters);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports/monthly-export", async (req: Request, res: Response) => {
    try {
      const { month, year, instructorId } = req.query;

      const filters: any = {};
      if (month) filters.month = Number(month);
      if (year) filters.year = Number(year);
      if (instructorId) filters.instructorId = Number(instructorId);

      const data = await storage.getWorkshopsWithDetails(filters);

      const BOM = "\uFEFF";
      const headers = ["שם מנחה", "תאריך", "לקוח", "מיקום", "סטטוס", "משתתפים"];
      const statusLabels: Record<string, string> = {
        planned: "מתוכנן",
        confirmed: "מאושר",
        completed: "הושלם",
        cancelled: "בוטל",
      };

      const rows = data.map((w: any) => [
        w.instructorName || "",
        w.date ? new Date(w.date).toLocaleDateString("he-IL") : "",
        w.clientName || "",
        w.location || "",
        statusLabels[w.status] || w.status,
        w.participants ? String(w.participants) : "",
      ]);

      const csv = BOM + [headers.join(","), ...rows.map((r: string[]) => r.map((v) => `"${v}"`).join(","))].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=monthly-report-${year || "all"}-${month || "all"}.csv`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/equipment", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getEquipment();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workshops/:id/equipment", async (req: Request, res: Response) => {
    try {
      const result = await storage.getEquipmentByWorkshop(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/equipment", async (req: Request, res: Response) => {
    try {
      const result = await storage.createEquipment(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/equipment/batch-status", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) return res.status(401).json({ error: "לא מחובר" });
      const { ids, status } = req.body;
      const validStatuses = ["ORDERED", "READY", "PICKED_UP", "RETURNED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "סטטוס לא חוקי" });
      }
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "נדרשים פריטים לעדכון" });
      }
      const results = [];
      for (const id of ids) {
        const result = await storage.updateEquipmentStatus(id, status, sessionUserId);
        results.push(result);
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/equipment/:id/status", async (req: Request, res: Response) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) return res.status(401).json({ error: "לא מחובר" });
      const { status, notes } = req.body;
      const validStatuses = ["ORDERED", "READY", "PICKED_UP", "RETURNED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "סטטוס לא חוקי" });
      }
      const result = await storage.updateEquipmentStatus(
        Number(req.params.id),
        status,
        sessionUserId,
        notes
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/equipment/:id/events", async (req: Request, res: Response) => {
    try {
      const result = await storage.getStatusEvents(Number(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/reports", async (_req: Request, res: Response) => {
    try {
      const result = await storage.getMonthlyReports();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/reports", async (req: Request, res: Response) => {
    try {
      const result = await storage.createMonthlyReport(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workshops/:id/summary", async (req: Request, res: Response) => {
    try {
      const result = await storage.getWorkshopSummary(Number(req.params.id));
      res.json(result || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workshops/:id/summary", async (req: Request, res: Response) => {
    try {
      const workshopId = Number(req.params.id);
      const workshop = await storage.getWorkshopById(workshopId);
      if (!workshop) return res.status(404).json({ error: "סדנה לא נמצאה" });

      if (req.body.participantsCount <= 0) {
        return res.status(400).json({ error: "מספר משתתפים חייב להיות גדול מ-0" });
      }

      if (req.body.safetyIncident && !req.body.safetyDetails) {
        return res.status(400).json({ error: "נדרש פירוט אירוע בטיחות" });
      }

      const existing = await storage.getWorkshopSummary(workshopId);
      if (existing) {
        const result = await storage.updateWorkshopSummary(workshopId, req.body);
        return res.json(result);
      }

      const result = await storage.createWorkshopSummary({
        ...req.body,
        workshopId,
      });
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const value = await storage.getSetting(req.params.key);
      res.json({ key: req.params.key, value });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: "לא מחובר" });
      const user = await storage.getUserById(userId);
      if (!user || user.role !== "admin") return res.status(403).json({ error: "הרשאה נדרשת" });
      await storage.setSetting(req.params.key, req.body.value);
      res.json({ key: req.params.key, value: req.body.value });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
