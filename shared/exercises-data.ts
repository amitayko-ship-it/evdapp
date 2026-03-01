export interface EquipmentItem {
  item: string;
  quantity: number;
  scalable: boolean;
}

export interface SubActivity {
  id: number;
  name: string;
  equipment: EquipmentItem[];
}

export interface Exercise {
  id: number;
  name: string;
  subActivities?: SubActivity[];
  equipment?: EquipmentItem[];
  options?: string[];
  notes?: string;
}

export function getTotalEquipment(equipment: EquipmentItem[], numGroups: number): { item: string; total: number }[] {
  return equipment.map(eq => ({
    item: eq.item,
    total: eq.scalable ? eq.quantity * numGroups : eq.quantity,
  }));
}

export const exercises: Exercise[] = [
  {
    id: 1,
    name: "ריבוי משימות",
    subActivities: [
      {
        id: 1,
        name: "שטיח מעופף",
        equipment: [{ item: "יריעת שטיח", quantity: 1, scalable: true }],
      },
      {
        id: 2,
        name: "טנגרם",
        equipment: [{ item: "ערכת משולשים + צלליות", quantity: 1, scalable: true }],
      },
      {
        id: 3,
        name: "הטלת ביצה",
        equipment: [
          { item: "ביצה", quantity: 1, scalable: true },
          { item: "10 קשים", quantity: 1, scalable: true },
          { item: '10 ס"מ סרט הדבקה', quantity: 1, scalable: true },
        ],
      },
      {
        id: 4,
        name: "קפיצה על חבל",
        equipment: [{ item: "חבל", quantity: 1, scalable: true }],
      },
      {
        id: 5,
        name: "גשר דה וינצ'י",
        equipment: [{ item: "10 מקלות מטאטא קצרים (1 מ')", quantity: 1, scalable: true }],
      },
      {
        id: 6,
        name: "אוריגמי קובייה",
        equipment: [
          { item: "40 ניירות צבעוניים", quantity: 1, scalable: true },
          { item: "דף הוראות", quantity: 1, scalable: true },
        ],
      },
      {
        id: 7,
        name: "הקפצת כדור 50 פעמים רצוף",
        equipment: [{ item: "כדור", quantity: 1, scalable: true }],
      },
      {
        id: 8,
        name: "מגדל מרשמלו",
        equipment: [
          { item: "20 מקלות מקרוני", quantity: 1, scalable: true },
          { item: "מטר נייר דבק", quantity: 1, scalable: true },
          { item: "מטר חוט", quantity: 1, scalable: true },
          { item: "מרשמלו", quantity: 1, scalable: true },
        ],
      },
      {
        id: 9,
        name: "נסיוב",
        equipment: [
          { item: 'בקבוק כחול+אדום', quantity: 1, scalable: true },
          { item: "6 חבלים לבנים", quantity: 1, scalable: true },
          { item: "מיכל אגירה", quantity: 1, scalable: true },
        ],
      },
      {
        id: 10,
        name: "טבעת צוות",
        equipment: [
          { item: "כדור", quantity: 1, scalable: true },
          { item: "טבעת קשורה לחוטים לבנים", quantity: 1, scalable: true },
        ],
      },
      {
        id: 11,
        name: "קשר סבתא",
        equipment: [{ item: "חבל", quantity: 1, scalable: true }],
      },
    ],
  },
  {
    id: 2,
    name: "ג'אגלינג",
    equipment: [
      { item: "דליים", quantity: 2, scalable: true },
      { item: "כדורים וחפצים", quantity: 20, scalable: true },
      { item: "בלונים עם מים", quantity: 12, scalable: true },
      { item: "ביצים", quantity: 6, scalable: true },
    ],
  },
  {
    id: 3,
    name: "פירמידת טרזן",
    equipment: [
      { item: "חבל אדום", quantity: 1, scalable: true },
      { item: "מעגלי חבלים צהובים", quantity: 20, scalable: true },
      { item: "עיגולי סיליקון (מדרכי מקלדת)", quantity: 6, scalable: true },
    ],
  },
  {
    id: 4,
    name: "שלושת האיים",
    equipment: [
      { item: "סט חבלים (כחול, אדום, צהוב)", quantity: 1, scalable: true },
      { item: "דלי עם 3 כדורי טניס", quantity: 1, scalable: true },
      { item: "כיסויי עיניים", quantity: 10, scalable: true },
      { item: "שעון עצר", quantity: 1, scalable: false },
      { item: "ערכת חידות (אזיקים, מסמרים, טנגרם)", quantity: 1, scalable: true },
      { item: "מדרכי עץ / מנעלים", quantity: 1, scalable: true },
    ],
  },
  {
    id: 5,
    name: "יהלום",
    equipment: [
      { item: "מקלות במבוק", quantity: 20, scalable: true },
      { item: "מסקינטייפ", quantity: 4, scalable: true },
      { item: "מספריים", quantity: 1, scalable: true },
      { item: "חבל אדום", quantity: 1, scalable: true },
      { item: "מדבקות לבנות + טוש", quantity: 20, scalable: true },
      { item: "אופציונלי: ערכת נסיוב", quantity: 1, scalable: true },
    ],
  },
  {
    id: 6,
    name: "מקלדת",
    equipment: [
      { item: "חבל כחול", quantity: 1, scalable: true },
      { item: "סט מספרים 1-30", quantity: 1, scalable: true },
      { item: "חבלים אדומים", quantity: 2, scalable: true },
    ],
  },
  {
    id: 7,
    name: "ניווט",
    options: ["פארק הירקון", "נען", "ברוטיה", "עקבה", "פארק קנדה", "נחל גחר", "כתף שאול"],
    equipment: [
      { item: "מפות ומצפנים בהתאם לתא שטח", quantity: 1, scalable: true },
    ],
  },
  {
    id: 8,
    name: "רוב גולדברג",
    notes: "ציוד מחושב לקבוצה של 18 משתתפים",
    equipment: [
      { item: "ערכות פלסטיק", quantity: 3, scalable: true },
      { item: "במבוקים", quantity: 18, scalable: true },
      { item: "מדרכי עץ", quantity: 12, scalable: true },
      { item: "ערכת צינורות PVC ומקלות מטאטא", quantity: 4, scalable: true },
      { item: "בלונים ומסקינטייפ ספייר", quantity: 1, scalable: true },
    ],
  },
  {
    id: 9,
    name: "קוד פתוח",
    equipment: [
      { item: "תיבות עץ (עם 2 מנעולי קומבינציה ו-2 מפתחות)", quantity: 3, scalable: true },
      { item: "דלי + נסורת + מפתחות בלאי", quantity: 1, scalable: true },
      { item: "דף למינציה (טבלת שליטה)", quantity: 1, scalable: false },
      { item: "חבל אדום", quantity: 1, scalable: true },
      { item: "פותחן יין", quantity: 1, scalable: false },
      { item: 'כוסות חד"פ ליין', quantity: 50, scalable: true },
      { item: "בקבוקי יין", quantity: 2, scalable: true },
      { item: "אופציונלי: שטיח מעופף, אבנים לרוג'ום", quantity: 1, scalable: true },
    ],
  },
];
