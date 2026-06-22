import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
