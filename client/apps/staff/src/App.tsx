import { HashRouter, Link, Route, Routes } from "react-router";
import { DevRouteBar } from "./components/DevRouteBar";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { UIProvider } from "../../../packages/ui/src/context/UIProvider";
import { OtpPage } from "./pages/otp";
import { ForgotPasswordPage } from "./pages/forgot-password";

function App() {
  return (
    <>
      <HashRouter>
        <UIProvider Link={Link}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/otp" element={<OtpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Routes>
        </UIProvider>
        <DevRouteBar />
      </HashRouter>
    </>
  );
}

export default App;
