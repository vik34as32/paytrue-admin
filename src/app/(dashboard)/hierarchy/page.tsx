"use client";

import { Card, CardHeader } from "@/components/common/Card";

export default function HierarchyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Hierarchy</h1>
        <p className="text-sm text-muted">
          Organizational tree showing who created whom
        </p>
      </div>

      <Card>
        <CardHeader
          title="Organization Tree"
          subtitle="Live hierarchy API is not yet connected"
        />
        <p className="text-sm text-muted">
          Admin hierarchy will load from the backend when the live endpoint is available.
          Use Admin Management to view registered admins from the live API.
        </p>
      </Card>
    </div>
  );
}
