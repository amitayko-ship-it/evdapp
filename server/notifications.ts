import { sendEmail } from "./outlook-email";
import type { User, NotificationPreferences, Workshop, Equipment, MonthlyReport, Process } from "../shared/schema";

// --- Email template helpers ---

function baseTemplate(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #4A90C2; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 24px 32px; color: #333; line-height: 1.6; }
    .footer { background: #f0f0f0; padding: 16px 32px; font-size: 12px; color: #888; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; }
    .badge-green { background: #e8f5e9; color: #2e7d32; }
    .badge-blue { background: #e3f2fd; color: #1565c0; }
    .badge-yellow { background: #fffde7; color: #f57f17; }
    .badge-red { background: #ffebee; color: #c62828; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>אבן דרך – ${title}</h1></div>
    <div class="body">${body}</div>
    <div class="footer">מערכת ניהול אבן דרך · הודעה אוטומטית</div>
  </div>
</body>
</html>`;
}

// --- Notification senders ---

export async function notifyWorkshopCreated(
  recipients: User[],
  workshop: Workshop,
  process: Process
): Promise<void> {
  const eligible = recipients.filter((u) => u.role === "admin" || u.role === "office");
  if (!eligible.length) return;

  const emails = eligible.map((u) => u.email);
  const body = `
    <p>סדנה חדשה נוצרה במערכת:</p>
    <ul>
      <li><strong>כותרת:</strong> ${workshop.title}</li>
      <li><strong>תהליך:</strong> ${process.name} (${process.clientName})</li>
      ${workshop.scheduledAt ? `<li><strong>תאריך:</strong> ${new Date(workshop.scheduledAt).toLocaleDateString("he-IL")}</li>` : ""}
      ${workshop.location ? `<li><strong>מיקום:</strong> ${workshop.location}</li>` : ""}
    </ul>`;

  await sendEmail({
    to: emails,
    subject: `סדנה חדשה נוצרה: ${workshop.title}`,
    html: baseTemplate("סדנה חדשה", body),
  });
}

export async function notifyWorkshopUpdated(
  recipients: User[],
  workshop: Workshop,
  process: Process
): Promise<void> {
  const eligible = recipients.filter((u) => u.role === "admin" || u.role === "office");
  if (!eligible.length) return;

  const emails = eligible.map((u) => u.email);
  const body = `
    <p>פרטי סדנה עודכנו:</p>
    <ul>
      <li><strong>כותרת:</strong> ${workshop.title}</li>
      <li><strong>תהליך:</strong> ${process.name} (${process.clientName})</li>
      ${workshop.scheduledAt ? `<li><strong>תאריך:</strong> ${new Date(workshop.scheduledAt).toLocaleDateString("he-IL")}</li>` : ""}
      ${workshop.location ? `<li><strong>מיקום:</strong> ${workshop.location}</li>` : ""}
    </ul>`;

  await sendEmail({
    to: emails,
    subject: `סדנה עודכנה: ${workshop.title}`,
    html: baseTemplate("עדכון סדנה", body),
  });
}

export async function notifyWorkshopCancelled(
  recipients: User[],
  workshop: Workshop,
  process: Process
): Promise<void> {
  const eligible = recipients.filter((u) => u.role === "admin" || u.role === "office" || u.role === "instructor");
  if (!eligible.length) return;

  const emails = eligible.map((u) => u.email);
  const body = `
    <p>⚠️ סדנה <strong>בוטלה</strong>:</p>
    <ul>
      <li><strong>כותרת:</strong> ${workshop.title}</li>
      <li><strong>תהליך:</strong> ${process.name} (${process.clientName})</li>
      ${workshop.scheduledAt ? `<li><strong>תאריך מתוכנן:</strong> ${new Date(workshop.scheduledAt).toLocaleDateString("he-IL")}</li>` : ""}
    </ul>`;

  await sendEmail({
    to: emails,
    subject: `סדנה בוטלה: ${workshop.title}`,
    html: baseTemplate("ביטול סדנה", body),
  });
}

export async function notifyEquipmentStatusChanged(
  recipients: User[],
  item: Equipment,
  fromStatus: string,
  toStatus: string,
  changedBy: User
): Promise<void> {
  if (!recipients.length) return;

  const statusLabel: Record<string, string> = {
    ORDERED: "הוזמן",
    READY: "מוכן לאיסוף",
    PICKED_UP: "נאסף",
    RETURNED: "הוחזר",
  };

  const badgeClass: Record<string, string> = {
    ORDERED: "badge-yellow",
    READY: "badge-green",
    PICKED_UP: "badge-blue",
    RETURNED: "badge-red",
  };

  // For READY status – notify instructors specifically
  let eligible = recipients;
  if (toStatus === "READY") {
    eligible = recipients.filter((u) => u.role === "instructor" || u.role === "admin");
  }
  if (!eligible.length) return;

  const emails = eligible.map((u) => u.email);
  const body = `
    <p>סטטוס ציוד השתנה:</p>
    <ul>
      <li><strong>פריט:</strong> ${item.name}</li>
      <li><strong>מ:</strong> <span class="badge ${badgeClass[fromStatus]}">${statusLabel[fromStatus] ?? fromStatus}</span></li>
      <li><strong>ל:</strong> <span class="badge ${badgeClass[toStatus]}">${statusLabel[toStatus] ?? toStatus}</span></li>
      <li><strong>עודכן על ידי:</strong> ${changedBy.name}</li>
    </ul>`;

  await sendEmail({
    to: emails,
    subject: `עדכון ציוד: ${item.name} – ${statusLabel[toStatus] ?? toStatus}`,
    html: baseTemplate("עדכון סטטוס ציוד", body),
  });
}

export async function notifyMonthlyReportDue(
  instructor: User,
  month: number,
  year: number
): Promise<void> {
  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  const monthName = monthNames[month - 1] ?? String(month);

  const body = `
    <p>שלום ${instructor.name},</p>
    <p>הגיע הזמן להגיש את <strong>דוח הפעילות החודשי</strong> לחודש ${monthName} ${year}.</p>
    <p>אנא היכנס למערכת ומלא את הדוח בהקדם.</p>`;

  await sendEmail({
    to: instructor.email,
    subject: `תזכורת: הגשת דוח חודשי – ${monthName} ${year}`,
    html: baseTemplate("תזכורת – דוח חודשי", body),
  });
}

export async function notifyReportApproved(
  instructor: User,
  report: MonthlyReport,
  approvedBy: User
): Promise<void> {
  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  const monthName = monthNames[report.month - 1] ?? String(report.month);

  const body = `
    <p>שלום ${instructor.name},</p>
    <p>הדוח החודשי שלך לחודש <strong>${monthName} ${report.year}</strong> אושר על ידי ${approvedBy.name}.</p>
    <ul>
      <li><strong>מספר סדנאות:</strong> ${report.workshopsCount}</li>
    </ul>`;

  await sendEmail({
    to: instructor.email,
    subject: `דוח חודשי אושר – ${monthName} ${report.year}`,
    html: baseTemplate("אישור דוח חודשי", body),
  });
}

export async function notifyProcessAssigned(
  instructor: User,
  process: Process
): Promise<void> {
  const body = `
    <p>שלום ${instructor.name},</p>
    <p>תהליך חדש שויך אליך:</p>
    <ul>
      <li><strong>שם התהליך:</strong> ${process.name}</li>
      <li><strong>לקוח:</strong> ${process.clientName}</li>
      <li><strong>סוג:</strong> ${process.type}</li>
    </ul>`;

  await sendEmail({
    to: instructor.email,
    subject: `תהליך חדש שויך אליך: ${process.name}`,
    html: baseTemplate("שיוך תהליך", body),
  });
}
