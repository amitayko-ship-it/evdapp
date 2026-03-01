# Even Derech (אבן דרך) - Process Management System

## Overview
Hebrew-language responsive web application for "Even Derech" (אבן דרך), a consulting organization that manages instructors conducting processes with clients. Central hub for communication, workshop booking, equipment tracking, and monthly reporting.

## Recent Changes
- 2026-02-13: Added user management page (/admin/users) for admins to control roles. Renamed "מדריך" to "מנחה" across UI. Admin-only nav items, self-demotion prevention, settings panel with Calendly URL config.
- 2026-02-13: Removed Clients page; client contacts now entered manually in workshop form (clientName, hrContactName/Phone/Email, procurementContactName/Phone/Email). Navigation reduced to 4 items (+users for admin).
- 2026-02-28: Removed equipment-returned gate on workshop summary - can fill immediately. Equipment page now supports multi-select with batch status updates.
- 2026-02-13: Fixed PDF work order Hebrew rendering - uses Noto Sans Hebrew font with segment-based RTL reversal. Includes checklist in PDF output.
- 2026-02-13: Added monthly report preview table showing filtered workshops with client name. New /api/reports/monthly JSON endpoint.
- 2026-02-12: Full brand overhaul - Even Derech branding with logo, brand color system (blue/green/yellow), status-specific colors, stone-style shadow cards (rounded-2xl), subtle stone background pattern, yellow primary CTA buttons, rounded-full button style, role badge in header, yellow/green gradient accent line, "Milestone / Lead by nature" footer, branded focus rings on inputs.
- 2026-02-12: Added Work Order PDF export endpoint (/api/workshops/:id/work-order) using pdfkit. Download button on each workshop card.
- 2026-02-12: Added Monthly Report CSV export (/api/reports/monthly-export) with month/year/instructor filters. Admin page at /admin/monthly-report. UTF-8 BOM for Hebrew Excel compatibility.
- 2026-02-12: Added Workshop Summary module (workshop_summaries table). Form at /workshops/:id/summary tracks participants, actual exercises, instructor insights, safety incidents, feedback status. Gated by equipment-returned validation.
- 2026-02-12: Updated navigation to 5 items: Dashboard, Workshops, Equipment, Clients, Monthly Report.
- 2026-02-12: Added 8 new exercises with equipment quantities and scalable flags. Added "number of groups" input to workshop form.
- 2026-02-12: Rewrote Equipment page as Warehouse Dashboard with tabs, search, confirmation dialogs.
- 2026-02-12: Redesigned workshop flow - workshops can be created independently without a parent process.
- 2026-02-10: Initial project setup from README specification.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query (default queryFn uses queryKey as URL)
- **Styling**: Tailwind CSS with brand colors (blue #4A90C2, green #7CB342, yellow #F5D835)
- **Animations**: Framer Motion
- **UI Components**: Custom shadcn-style components (Button, Card, Input, Form, Badge, Tabs, AlertDialog, RadioGroup, Checkbox, Textarea, Toast/Toaster)
- **Language**: Hebrew (RTL layout)
- **Port**: 5000 (0.0.0.0)
- **Path Alias**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Runtime**: Node.js with Express on port 3001 (localhost)
- **Language**: TypeScript
- **API**: RESTful JSON under /api/*
- **Session**: express-session with connect-pg-simple
- **PDF**: pdfkit for work order generation

### Database
- **ORM**: Drizzle ORM with PostgreSQL (node-postgres driver)
- **Schema**: shared/schema.ts
- **Migration**: drizzle-kit push:pg (note: session table is created by connect-pg-simple, not Drizzle)

## Project Structure
```
client/src/          # React frontend
  pages/             # Route components (Dashboard, Workshops, Equipment, ClientContacts, MonthlyReport, WorkshopSummary, Login)
  components/ui/     # Reusable UI components
  components/layout/ # Header, Navigation
  lib/               # queryClient utilities
  hooks/             # useAuth, use-toast hooks
server/              # Express backend
  index.ts           # Server entry (port 3001)
  routes.ts          # API route handlers
  storage.ts         # Data access layer with Drizzle
shared/              # Shared between client/server
  schema.ts          # Drizzle database schema + EQUIPMENT_STATUS constant
  exercises-data.ts  # Predefined exercises with equipment
  process-types.ts   # Process type definitions
```

## Key Data Models
- **Users**: Instructors, office staff, warehouse, admin roles
- **ClientContacts**: Client company contacts with HR/PROCUREMENT roles, isActive soft-delete
- **Processes**: Client consulting engagements (optional, workshops can exist without them)
- **Workshops**: Individual workshop bookings with exercises, checklist, participants, clientName, hrContactId, procurementContactId
- **Equipment**: Items with status state machine (ORDERED → READY → PICKED_UP → RETURNED), linked to workshops
- **StatusEvents**: Audit log for equipment transitions
- **WorkshopSummaries**: Post-workshop feedback (participants count, actual exercises, insights, safety incidents, issues)
- **MonthlyReports**: Instructor activity records

## API Endpoints
- `/api/client-contacts` - GET/POST client contacts, PUT/:id for updates
- `/api/workshops/:id/work-order` - GET PDF download
- `/api/reports/monthly-export` - GET CSV with ?month=&year=&instructorId= filters
- `/api/workshops/:id/summary` - GET/POST workshop summary (POST validates equipment returned)
- Standard CRUD for workshops, equipment, processes, users

## Navigation
- Dashboard (לוח בקרה)
- Workshops (סדנאות) - main workflow for creating workshop orders with PDF/summary buttons
- Equipment (מחסן) - equipment management with tab-based status view
- Clients (לקוחות) - /admin/clients - client contact management
- Monthly Report (דוח חודשי) - /admin/monthly-report - CSV export with filters

## Development
- `npm run dev` - Starts both frontend (Vite) and backend (tsx watch)
- `npm run db:push` - Push schema to database (drizzle-kit push:pg)
- Frontend proxies /api/* to backend at localhost:3001

## User Preferences
- Preferred communication style: Simple, everyday language
- Hebrew (RTL) interface
