"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { StatCard } from "@/components/cards/StatCard";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchStatistics } from "@/store/api/superAdminApi";
import {
  flattenStatistics,
  selectStatistics,
} from "@/store/selectors/superAdminSelectors";
import { ROUTES, GRADIENT_CARDS } from "@/constants";
import { formatCurrency } from "@/lib/utils";

export default function SuperAdminStatisticsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const statistics = useAppSelector(selectStatistics);
  const { isLoadingStatistics, error } = useAppSelector(
    (state) => state.superAdmin
  );

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
      return;
    }
    dispatch(fetchStatistics({ force: true }));
  }, [dispatch, hasSuperAdminWalletAccess, router]);

  if (!hasSuperAdminWalletAccess) return null;

  const rows = flattenStatistics(statistics);
  const sections = [...new Set(rows.map((r) => r.section))];

  const formatStatValue = (label: string, value: number) => {
    const lower = label.toLowerCase();
    if (
      lower.includes("balance") ||
      lower.includes("business") ||
      lower.includes("profit") ||
      lower.includes("commission") ||
      lower.includes("earned")
    ) {
      return formatCurrency(value);
    }
    return value;
  };

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Statistics"
        subtitle="Live platform metrics from the super admin API"
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {isLoadingStatistics && !statistics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl bg-muted/20"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader
            title="No statistics available"
            subtitle="The API returned no statistics data"
          />
        </Card>
      ) : (
        sections.map((section, sectionIndex) => (
          <div key={section} className="space-y-4">
            <h2 className="text-lg font-bold">{section}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows
                .filter((row) => row.section === section)
                .map((row, index) => (
                  <StatCard
                    key={`${row.section}-${row.label}`}
                    title={row.label}
                    value={formatStatValue(row.label, row.value)}
                    gradient={`bg-gradient-to-br ${GRADIENT_CARDS[(sectionIndex + index) % GRADIENT_CARDS.length]}`}
                  />
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
