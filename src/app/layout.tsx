import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Providers } from "@/components/common/Providers";
import AuthInitializer from "@/components/common/AuthInitializer";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PayTrue Admin Panel",
  description: "Enterprise FinTech Admin Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} min-h-screen antialiased`}>
<Providers>
  <AuthInitializer />
  {children}
</Providers>      </body>
    </html>
  );
}
