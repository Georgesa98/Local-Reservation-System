import { HashRouter, Route, Routes } from "react-router";
import { DevRouteBar } from "./components/DevRouteBar";
import { RoleBasedRoute } from "./components/RoleBasedRoute";
import { RootRedirect } from "./components/RootRedirect";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { OtpPage } from "./pages/otp";
import { ForgotPasswordPage } from "./pages/forgot-password";
import {
  DashboardPage,
  RoomsPage,
  SpecificRoomPage,
  NewRoomPage,
  NewBooking,
  BookingsPage,
} from "./pages/dashboard";
import { AdminDashboardPage } from "./pages/admin";
import { SettingsPage } from "./pages/settings/Settings";

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          {/* Root redirect - smart routing based on auth and role */}
          <Route path="/" element={<RootRedirect />} />

          {/* Manager routes - Under /dashboard prefix */}
          <Route
            path="/dashboard"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <DashboardPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/rooms"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <RoomsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/rooms/new"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <NewRoomPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/rooms/:id"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <SpecificRoomPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/bookings"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <BookingsPage />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/bookings/new"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <NewBooking />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <RoleBasedRoute allowedRoles={["ADMIN", "MANAGER"]}>
                <SettingsPage />
              </RoleBasedRoute>
            }
          />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp" element={<OtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
        <DevRouteBar />
      </HashRouter>
    </>
  );
}

export default App;
