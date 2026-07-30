"use client";

import { Card, Skeleton } from "antd";

export function LedgerSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading ledger">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: "60%" }} />
          </Card>
        ))}
      </div>
      <Card className="rounded-2xl">
        <Skeleton active paragraph={{ rows: 1 }} />
      </Card>
      <Card className="rounded-2xl">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    </div>
  );
}

export function LedgerDrawerSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton active avatar paragraph={{ rows: 3 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
      <Skeleton active paragraph={{ rows: 4 }} />
    </div>
  );
}
