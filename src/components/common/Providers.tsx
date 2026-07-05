"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { store } from "@/store";
import AuthInitializer from "./AuthInitializer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
  <AuthInitializer />

  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    {children}
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        className: "font-sans",
      }}
    />
  </ThemeProvider>
</Provider>
  );
}
