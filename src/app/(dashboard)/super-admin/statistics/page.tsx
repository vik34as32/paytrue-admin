"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchStatistics } from "@/store/api/superAdminApi";
import { selectStatistics } from "@/store/selectors/superAdminSelectors";
import { ROUTES } from "@/constants";
import {
  SuperAdminStatisticsEmpty,
  SuperAdminStatisticsView,
} from "@/components/super-admin/SuperAdminStatisticsView";

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

  const hasServices = Boolean(
    statistics?.services && Object.keys(statistics.services).length
  );
  const hasCore = Boolean(
    statistics &&
      (statistics.users ||
        statistics.transactions ||
        statistics.business ||
        statistics.wallet ||
        statistics.roleWallets ||
        statistics.fundRequests ||
        statistics.profit)
  );

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Super Admin"
        title="Statistics"
        subtitle={
          statistics?.period?.monthLabel
            ? `Live platform metrics · ${statistics.period.monthLabel}`
            : "Live platform metrics from the super admin API"
        }
      />

      {error && (
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {isLoadingStatistics && !statistics ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-muted/20"
            />
          ))}
        </div>
      ) : !statistics || (!hasServices && !hasCore) ? (
        <SuperAdminStatisticsEmpty />
      ) : (
        <SuperAdminStatisticsView statistics={statistics} />
      )}
    </div>
  );
}
