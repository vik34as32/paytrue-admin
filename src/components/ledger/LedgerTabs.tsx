"use client";

import { Tabs } from "antd";
import { LedgerRoleTab } from "@/types/ledger";

const TAB_ITEMS = [
  { key: "ADMIN", label: "Admin Ledger" },
  { key: "MASTER_DISTRIBUTOR", label: "Master Distributor Ledger" },
  { key: "DISTRIBUTOR", label: "Distributor Ledger" },
  { key: "RETAILER", label: "Retailer Ledger" },
];

interface LedgerTabsProps {
  active: LedgerRoleTab;
  onChange: (tab: LedgerRoleTab) => void;
}

export function LedgerTabs({ active, onChange }: LedgerTabsProps) {
  return (
    <Tabs
      activeKey={active}
      onChange={(key) => onChange(key as LedgerRoleTab)}
      items={TAB_ITEMS}
      className="ledger-tabs"
    />
  );
}
