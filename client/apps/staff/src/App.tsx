import { HashRouter, Navigate, Route, Routes } from "react-router";
import { DevRouteBar } from "./components/DevRouteBar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { OtpPage } from "./pages/otp";
import { ForgotPasswordPage } from "./pages/forgot-password";
import { DashboardPage, RoomsPage, SpecificRoomPage, NewRoomPage, BookingsPage } from "./pages/dashboard";

function App() {
  return (
    <>
      <HashRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard/rooms" replace />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/new"
            element={
              <ProtectedRoute>
                <NewRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/:id"
            element={
              <ProtectedRoute>
                <SpecificRoomPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <BookingsPage />
              </ProtectedRoute>
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
