import { Route, Switch, Redirect } from "wouter";
import { AnimatePresence } from "framer-motion";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import WorkshopsPage from "./pages/WorkshopsPage";
import EquipmentPage from "./pages/EquipmentPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import UsersPage from "./pages/UsersPage";
import WorkshopSummaryPage from "./pages/WorkshopSummaryPage";
import CalendarPage from "./pages/CalendarPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import { usePermissions } from "./hooks/usePermissions";
import { Toaster } from "./components/ui/toaster";

export default function App() {
  const { user, isLoading } = useAuth();
  const perms = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  const defaultPath = perms.canViewDashboard ? "/" : "/equipment";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6 max-w-7xl flex-1 stone-bg-pattern">
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/">
              {perms.canViewDashboard ? <Dashboard /> : <Redirect to="/equipment" />}
            </Route>
            <Route path="/calendar">
              {perms.canViewCalendar ? <CalendarPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route path="/workshops">
              {perms.canViewWorkshops ? <WorkshopsPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route path="/workshops/:id/summary">
              {perms.canViewWorkshopSummary ? <WorkshopSummaryPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route path="/equipment">
              {perms.canViewEquipment ? <EquipmentPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route path="/admin/monthly-report">
              {perms.canViewMonthlyReport ? <MonthlyReportPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route path="/admin/users">
              {perms.canViewUsers ? <UsersPage /> : <Redirect to={defaultPath} />}
            </Route>
            <Route>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold">404 - דף לא נמצא</h2>
              </div>
            </Route>
          </Switch>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
