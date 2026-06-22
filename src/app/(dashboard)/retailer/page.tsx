"use client";

import { Card, CardHeader } from "@/components/common/Card";
import { useRoleAccess } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { formatCurrency } from "@/lib/utils";

export default function RetailerPage() {
  const { user } = useRoleAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Retailer Panel</h1>
        <p className="text-sm text-muted">Request balance and view transactions</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Current Balance" />
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(user?.balance || 0)}
          </p>
        </Card>
        <Card>
          <CardHeader title="Request Balance" subtitle="Submit a balance request to your distributor" />
          <Link href={ROUTES.requests}>
            <Button>Request Amount</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
