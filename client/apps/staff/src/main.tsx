import "@workspace/ui/globals.css";
import "./styles/theme.css";
import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { Toaster } from "@workspace/ui/components/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="theme-ui">
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
