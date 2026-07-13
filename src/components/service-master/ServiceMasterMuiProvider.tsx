"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export function ServiceMasterMuiProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#3b82f6" : "#4318ff",
          },
          success: {
            main: "#05cd99",
          },
          error: {
            main: "#ee5d50",
          },
          background: {
            default: mode === "dark" ? "#0a0f1e" : "#f4f7fe",
            paper: mode === "dark" ? "#111827" : "#ffffff",
          },
          text: {
            primary: mode === "dark" ? "#e8ecf4" : "#1b2559",
            secondary: mode === "dark" ? "#94a3b8" : "#a3aed0",
          },
          divider: mode === "dark" ? "#1e293b" : "#e9edf7",
        },
        shape: {
          borderRadius: 12,
        },
        typography: {
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow:
                  mode === "dark"
                    ? "0 8px 24px rgba(0,0,0,0.35)"
                    : "0 8px 24px rgba(67, 24, 255, 0.06)",
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 10,
                fontWeight: 600,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
