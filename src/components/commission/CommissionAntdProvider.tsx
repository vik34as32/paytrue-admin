"use client";

import { ConfigProvider, App, theme } from "antd";
import { useTheme } from "next-themes";

interface CommissionAntdProviderProps {
  children: React.ReactNode;
}

export function CommissionAntdProvider({ children }: CommissionAntdProviderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          borderRadius: 12,
          colorPrimary: "#4318FF",
          fontFamily: "inherit",
        },
        components: {
          Card: { paddingLG: 20 },
          Table: {
            headerBg: isDark ? "#1f1f1f" : "#f8fafc",
            stickyScrollBarBg: isDark ? "#334155" : "#cbd5e1",
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
