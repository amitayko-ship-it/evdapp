import { Route, Switch } from "wouter";
import { AnimatePresence } from "framer-motion";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import WorkshopsPage from "./pages/WorkshopsPage";
import EquipmentPage from "./pages/EquipmentPage";
import MonthlyReportPage from "./pages/MonthlyReportPage";
import UsersPage from "./pages/UsersPage";
import WorkshopSummaryPage from "./pages/WorkshopSummaryPage";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "./components/ui/toaster";

export default function App() {
  const { user, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6 max-w-7xl flex-1 stone-bg-pattern">
        <AnimatePresence mode="wait">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/workshops" component={WorkshopsPage} />
            <Route path="/workshops/:id/summary" component={WorkshopSummaryPage} />
            <Route path="/equipment" component={EquipmentPage} />
            <Route path="/admin/monthly-report" component={MonthlyReportPage} />
            <Route path="/admin/users" component={UsersPage} />
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
