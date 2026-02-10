
Even Derech (אבן דרך) - Process Management System
Overview
This is a Hebrew-language responsive web application for "Even Derech" (אבן דרך), a consulting organization that manages instructors conducting dozens of processes with clients each month. The system serves as a central management hub for communication, workshop booking, equipment tracking, and monthly reporting.

Core Features:

Process/workshop creation and management with flexible contact management
Workshop booking with equipment selection from predefined exercises
Equipment status tracking with role-based state machine (ORDERED → READY → PICKED_UP → RETURNED)
Monthly instructor activity and salary reporting
Management dashboard with analytics
Email-only authentication (no password required)
User Preferences
Preferred communication style: Simple, everyday language.

System Architecture
Frontend Architecture
Framework: React 18 with TypeScript
Routing: Wouter (lightweight React router)
State Management: TanStack React Query for server state
UI Components: shadcn/ui component library built on Radix UI primitives
Styling: Tailwind CSS with custom brand colors (blue #4A90C2, green #7CB342, yellow #F5D835)
Animations: Framer Motion for page transitions and micro-interactions
Form Handling: React Hook Form with Zod validation
Language: Hebrew (RTL layout)
Backend Architecture
Runtime: Node.js with Express
Language: TypeScript with ES modules
API Style: RESTful JSON API under /api/* prefix
Build Tool: Vite for frontend, esbuild for server bundling
Data Layer
ORM: Drizzle ORM with PostgreSQL dialect
Database: PostgreSQL (Neon serverless)
Schema Location: shared/schema.ts - contains all table definitions
Migrations: Drizzle Kit with db:push command
Key Data Models
Users: Instructors, office staff, warehouse, admin roles
Processes: Client consulting engagements with various types (workshop, course, ODT, etc.)
Workshops: Individual workshop bookings with checklists and exercises
Equipment: Items with strict status state machine (ORDERED/READY/PICKED_UP/RETURNED)
StatusEvents: Audit log for equipment status transitions
MonthlyReports: Instructor activity and salary calculations
Equipment Status State Machine
The system enforces strict role-based transitions:

Warehouse users: ORDERED → READY (marks equipment as prepared)
Instructor users: READY → PICKED_UP, PICKED_UP → RETURNED
Admin users: All transitions allowed
Project Structure
client/src/          # React frontend
  pages/             # Route components
  components/ui/     # shadcn UI components
  components/layout/ # Header, Navigation
  lib/               # Utilities, query client
  hooks/             # Custom React hooks
server/              # Express backend
  index.ts           # Server entry point
  routes.ts          # API route handlers
  storage.ts         # Data access layer
  google-sheets.ts   # Google Sheets integration
  outlook-email.ts   # Microsoft Outlook email service
shared/              # Shared between client/server
  schema.ts          # Drizzle database schema
  exercises-data.ts  # Predefined exercises with equipment
  process-types.ts   # Process type definitions
External Dependencies
Database
PostgreSQL via Neon serverless (@neondatabase/serverless)
Connection string via DATABASE_URL environment variable
Google Services
Google Sheets API for data synchronization/backup
Service account authentication
Spreadsheet ID: 10jMFkBgmVKKPaUW_Bi9n9lh4t0yQ-BXi6rEmrCD82Hw
Credentials stored as environment variables or in service account JSON
Environment Variables Required
DATABASE_URL - PostgreSQL connection string
GOOGLE_SHEETS_ID - Target spreadsheet ID
Google service account credentials (client_email, private_key)
Key NPM Packages
drizzle-orm / drizzle-kit - Database ORM and migrations
googleapis - Google Sheets integration
express / express-session - HTTP server
@tanstack/react-query - Data fetching
react-hook-form / zod - Form validation
framer-motion - Animations
Full shadcn/ui component set via Radix primitives# evdapp
ניהול אבן דרך
