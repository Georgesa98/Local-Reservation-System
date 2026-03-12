import "@workspace/ui/globals.css";
import "./styles/theme.css";
import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import App from "./App.tsx";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { Toaster } from "@workspace/ui/components/sonner";
import { DirectionProvider } from "@workspace/ui/components/direction";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        return status !== 401 && failureCount < 2;
      },
    },
  },
});

function DynamicDirectionProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  return <DirectionProvider dir={dir}>{children}</DirectionProvider>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DynamicDirectionProvider>
        <ThemeProvider defaultTheme="light" storageKey="theme-ui">
          <App />
          <Toaster />
        </ThemeProvider>
      </DynamicDirectionProvider>
    </QueryClientProvider>
  </StrictMode>,
);
