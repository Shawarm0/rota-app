import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastContainer } from "./components/ui/Toast";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CalendarPage } from "./pages/CalendarPage";
import { MyShiftsPage } from "./pages/MyShiftsPage";
import { ShiftPotPage } from "./pages/ShiftPotPage";
import { HolidaysPage } from "./pages/HolidaysPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ManagerDashboardPage } from "./pages/manager/ManagerDashboardPage";
import { EmployeesPage } from "./pages/manager/EmployeesPage";
import { RotaBuilderPage } from "./pages/manager/RotaBuilderPage";
import { ReportsPage } from "./pages/manager/ReportsPage";
import { ShiftsToCoverPage } from "./pages/manager/ShiftsToCoverPage";
import { AdminPage } from "./pages/admin/AdminPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/my-shifts" element={<MyShiftsPage />} />
          <Route path="/shift-pot" element={<ShiftPotPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/manager" element={<ManagerDashboardPage />} />
          <Route path="/manager/employees" element={<EmployeesPage />} />
          <Route path="/manager/rota-builder" element={<RotaBuilderPage />} />
          <Route path="/manager/reports" element={<ReportsPage />} />
          <Route path="/manager/shifts-to-cover" element={<ShiftsToCoverPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
