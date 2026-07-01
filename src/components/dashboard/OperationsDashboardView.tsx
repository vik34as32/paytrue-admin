"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { WalletBalanceCards } from "@/components/super-admin/WalletBalanceCard";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { ROUTES } from "@/constants";
import {
  UserPlus,
  Users,
  ArrowRightLeft,
  History,
  Wallet,
  Shield,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  {
    title: "Admin Management",
    desc: "Create admins and view all administrators",
    href: ROUTES.superAdminAdmins,
    icon: Users,
    gradient: "from-[#4318FF] to-[#868CFF]",
  },
  {
    title: "Add Virtual Balance",
    desc: "Top up super admin wallet",
    href: ROUTES.superAdminAddBalance,
    icon: Wallet,
    gradient: "from-[#6AD2FF] to-[#0085FF]",
  },
  {
    title: "Transfer Balance",
    desc: "Send balance to admin accounts",
    href: ROUTES.superAdminTransferBalance,
    icon: ArrowRightLeft,
    gradient: "from-[#05CD99] to-[#00B087]",
  },
  {
    title: "Wallet History",
    desc: "View all wallet transactions",
    href: ROUTES.superAdminWalletHistory,
    icon: History,
    gradient: "from-[#7551FF] to-[#3311DB]",
  },
  {
    title: "Create Admin",
    desc: "Quick link to create new admin",
    href: ROUTES.superAdminCreateAdmin,
    icon: Shield,
    gradient: "from-[#FFB547] to-[#FF8F0D]",
  },
  {
    title: "Admin Management",
    desc: "View registered administrators",
    href: ROUTES.superAdminAdmins,
    icon: UserPlus,
    gradient: "from-[#FF947A] to-[#F2709C]",
  },
];

interface OperationsDashboardViewProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  autoFetchWallet?: boolean;
}

export function OperationsDashboardView({
  title = "Admin Dashboard",
  subtitle = "Manage admins, wallet balance, and transfers",
  breadcrumb,
  autoFetchWallet = true,
}: OperationsDashboardViewProps) {
  useWalletBalance({ autoFetch: autoFetchWallet });

  return (
    <div className="page-container">
      <PageHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} />

      <WalletBalanceCards autoFetch={false} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="group relative h-full overflow-hidden transition-all hover:shadow-lg">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
              <CardHeader
                title={item.title}
                subtitle={item.desc}
                action={
                  <div className={`rounded-xl bg-gradient-to-br p-2.5 text-white ${item.gradient}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                }
              />
              <Link href={item.href}>
                <Button size="sm" className="group-hover:shadow-md">
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
