"use client";

import { useEffect, useState } from "react";
import { Modal, Table, Tag, Typography, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CommissionHistoryEntry } from "@/types/commission";
import { fetchCommissionHistory } from "@/services/commissionApi";

const { Text } = Typography;

export interface CommissionHistoryModalProps {
  open: boolean;
  commissionId: string | null;
  serviceName?: string;
  onClose: () => void;
}

export function CommissionHistoryModal({
  open,
  commissionId,
  serviceName,
  onClose,
}: CommissionHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<CommissionHistoryEntry[]>([]);

  useEffect(() => {
    if (!open || !commissionId) return;
    setLoading(true);
    fetchCommissionHistory(commissionId)
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [open, commissionId]);

  const columns: ColumnsType<CommissionHistoryEntry> = [
    {
      title: "Field",
      dataIndex: "field",
      width: 160,
      render: (field: string) => <Tag color="blue">{field}</Tag>,
    },
    {
      title: "Old Value",
      dataIndex: "oldValue",
      render: (v: string) => (
        <Text delete type="secondary">
          {v}
        </Text>
      ),
    },
    {
      title: "New Value",
      dataIndex: "newValue",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      width: 130,
    },
    {
      title: "Updated Time",
      dataIndex: "updatedAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <Modal
      title={`Commission History${serviceName ? ` — ${serviceName}` : ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={entries}
          pagination={false}
          locale={{ emptyText: "No history records found" }}
          size="small"
        />
      </Spin>
    </Modal>
  );
}
