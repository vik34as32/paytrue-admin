"use client";

import { useMemo } from "react";
import {
  Table,
  Select,
  InputNumber,
  Tag,
  Badge,
  Dropdown,
  Button,
  Tooltip,
  Space,
  Typography,
  AutoComplete,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PercentageOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  CommissionRangeRow,
  CommissionStatus,
  CommissionValueType,
} from "@/types/commission";
import {
  COMMISSION_TYPE_OPTIONS,
  FINTECH_SERVICES,
} from "@/constants/commissionServices";
import { formatCommissionValue } from "@/lib/commission/utils";

const { Text } = Typography;

const serviceOptions = FINTECH_SERVICES.map((s) => ({
  value: s.name,
  label: s.name,
}));

function resolveServiceFromName(name: string): {
  serviceId: string;
  serviceName: string;
} {
  const trimmed = name.trim();
  const matched = FINTECH_SERVICES.find(
    (s) => s.name.toLowerCase() === trimmed.toLowerCase() || s.id === trimmed
  );
  if (matched) {
    return { serviceId: matched.id, serviceName: matched.name };
  }
  const customId = trimmed
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
  return {
    serviceId: customId ? `custom_${customId}` : "custom_service",
    serviceName: trimmed,
  };
}

export interface CommissionRangeTableProps {
  rows: CommissionRangeRow[];
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onRowChange: (row: CommissionRangeRow) => void;
  onEdit: (row: CommissionRangeRow) => void;
  onDuplicate: (row: CommissionRangeRow) => void;
  onDelete: (row: CommissionRangeRow) => void;
  onHistory: (row: CommissionRangeRow) => void;
  loading?: boolean;
}

function ValueTypeSelect({
  value,
  onChange,
}: {
  value: CommissionValueType;
  onChange: (v: CommissionValueType) => void;
}) {
  return (
    <Select
      size="small"
      value={value}
      onChange={onChange}
      style={{ width: 110 }}
      options={COMMISSION_TYPE_OPTIONS.map((o) => ({
        value: o.value,
        label: (
          <Space size={4}>
            {o.value === "percentage" ? (
              <PercentageOutlined />
            ) : (
              <DollarOutlined />
            )}
            {o.label}
          </Space>
        ),
      }))}
    />
  );
}

function CommissionValueInput({
  type,
  value,
  onChange,
}: {
  type: CommissionValueType;
  value: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <InputNumber
      size="small"
      min={0}
      max={type === "percentage" ? 100 : undefined}
      value={value}
      onChange={onChange}
      addonAfter={type === "percentage" ? "%" : "₹"}
      style={{ width: 100 }}
    />
  );
}

export function CommissionRangeTable({
  rows,
  selectedRowKeys,
  onSelectionChange,
  onRowChange,
  onEdit,
  onDuplicate,
  onDelete,
  onHistory,
  loading,
}: CommissionRangeTableProps) {
  const columns: ColumnsType<CommissionRangeRow> = useMemo(
    () => [
      {
        title: "Service",
        dataIndex: "serviceName",
        fixed: "left",
        width: 200,
        render: (_, record) => (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <AutoComplete
              size="small"
              value={record.serviceName}
              options={serviceOptions}
              onChange={(value) => {
                const resolved = resolveServiceFromName(value);
                onRowChange({ ...record, ...resolved });
              }}
              style={{ width: "100%", minWidth: 150 }}
              placeholder="Service name"
              allowClear={false}
            />
            {record.retailerName && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.retailerName}
              </Text>
            )}
            {record.distributorName && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.distributorName}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: "Range From",
        dataIndex: "rangeFrom",
        width: 120,
        render: (_, record) => (
          <InputNumber
            size="small"
            min={0}
            value={record.rangeFrom}
            onChange={(v) =>
              onRowChange({ ...record, rangeFrom: v ?? 0 })
            }
            style={{ width: 100 }}
          />
        ),
      },
      {
        title: "Range To",
        dataIndex: "rangeTo",
        width: 120,
        render: (_, record) => (
          <InputNumber
            size="small"
            min={0}
            value={record.rangeTo}
            onChange={(v) => onRowChange({ ...record, rangeTo: v ?? 0 })}
            style={{ width: 100 }}
          />
        ),
      },
      {
        title: "Deduction Type",
        width: 140,
        render: (_, record) => (
          <ValueTypeSelect
            value={record.deductionType}
            onChange={(deductionType) =>
              onRowChange({ ...record, deductionType })
            }
          />
        ),
      },
      {
        title: "Deduction Value",
        width: 130,
        render: (_, record) => (
          <CommissionValueInput
            type={record.deductionType}
            value={record.deductionValue}
            onChange={(v) =>
              onRowChange({ ...record, deductionValue: v ?? 0 })
            }
          />
        ),
      },
      {
        title: "Retailer Type",
        width: 140,
        render: (_, record) => (
          <ValueTypeSelect
            value={record.retailerCommissionType}
            onChange={(retailerCommissionType) =>
              onRowChange({ ...record, retailerCommissionType })
            }
          />
        ),
      },
      {
        title: "Retailer Comm.",
        width: 130,
        render: (_, record) => (
          <CommissionValueInput
            type={record.retailerCommissionType}
            value={record.retailerCommission}
            onChange={(v) =>
              onRowChange({ ...record, retailerCommission: v ?? 0 })
            }
          />
        ),
      },
      {
        title: "Distributor Type",
        width: 150,
        render: (_, record) => (
          <ValueTypeSelect
            value={record.distributorCommissionType}
            onChange={(distributorCommissionType) =>
              onRowChange({ ...record, distributorCommissionType })
            }
          />
        ),
      },
      {
        title: "Distributor Comm.",
        width: 140,
        render: (_, record) => (
          <CommissionValueInput
            type={record.distributorCommissionType}
            value={record.distributorCommission}
            onChange={(v) =>
              onRowChange({ ...record, distributorCommission: v ?? 0 })
            }
          />
        ),
      },
      {
        title: "MD Type",
        width: 130,
        render: (_, record) => (
          <ValueTypeSelect
            value={record.masterDistributorCommissionType}
            onChange={(masterDistributorCommissionType) =>
              onRowChange({ ...record, masterDistributorCommissionType })
            }
          />
        ),
      },
      {
        title: "MD Comm.",
        width: 120,
        render: (_, record) => (
          <CommissionValueInput
            type={record.masterDistributorCommissionType}
            value={record.masterDistributorCommission}
            onChange={(v) =>
              onRowChange({
                ...record,
                masterDistributorCommission: v ?? 0,
              })
            }
          />
        ),
      },
      {
        title: "Company Type",
        width: 130,
        render: (_, record) => (
          <ValueTypeSelect
            value={record.companyMarginType}
            onChange={(companyMarginType) =>
              onRowChange({ ...record, companyMarginType })
            }
          />
        ),
      },
      {
        title: "Company Margin",
        width: 130,
        render: (_, record) => (
          <CommissionValueInput
            type={record.companyMarginType}
            value={record.companyMargin}
            onChange={(v) =>
              onRowChange({ ...record, companyMargin: v ?? 0 })
            }
          />
        ),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        width: 90,
        render: (_, record) => (
          <InputNumber
            size="small"
            min={0}
            value={record.priority}
            onChange={(v) => onRowChange({ ...record, priority: v ?? 0 })}
            style={{ width: 70 }}
          />
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 110,
        render: (status: CommissionStatus, record) => (
          <Select
            size="small"
            value={status}
            onChange={(s: CommissionStatus) =>
              onRowChange({ ...record, status: s })
            }
            style={{ width: 100 }}
            options={[
              {
                value: "active",
                label: (
                  <Badge status="success" text="Active" />
                ),
              },
              {
                value: "inactive",
                label: (
                  <Badge status="default" text="Inactive" />
                ),
              },
            ]}
          />
        ),
      },
      {
        title: "Action",
        fixed: "right",
        width: 80,
        render: (_, record) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  onClick: () => onEdit(record),
                },
                {
                  key: "duplicate",
                  icon: <CopyOutlined />,
                  label: "Duplicate",
                  onClick: () => onDuplicate(record),
                },
                {
                  key: "history",
                  icon: <HistoryOutlined />,
                  label: "History",
                  onClick: () => onHistory(record),
                },
                { type: "divider" },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete",
                  danger: true,
                  onClick: () => onDelete(record),
                },
              ],
            }}
            trigger={["click"]}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      },
    ],
    [onRowChange, onEdit, onDuplicate, onDelete, onHistory]
  );

  const rowSelection: TableProps<CommissionRangeRow>["rowSelection"] = {
    selectedRowKeys,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  return (
    <Table<CommissionRangeRow>
      rowKey="id"
      columns={columns}
      dataSource={rows}
      loading={loading}
      rowSelection={rowSelection}
      pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} slabs` }}
      scroll={{ x: 2400, y: "calc(100vh - 340px)" }}
      size="small"
      sticky
      bordered
      summary={() =>
        rows.length > 0 ? (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={columns.length + 1}>
                <Space wrap>
                  {FINTECH_SERVICES.slice(0, 4).map((s) => {
                    const count = rows.filter((r) => r.serviceId === s.id).length;
                    if (!count) return null;
                    return (
                      <Tooltip
                        key={s.id}
                        title={`${count} slab(s) configured`}
                      >
                        <Tag color="blue">{s.name}: {count}</Tag>
                      </Tooltip>
                    );
                  })}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Preview: DMT retailer{" "}
                    {formatCommissionValue("flat", 5)} · AEPS{" "}
                    {formatCommissionValue("percentage", 0.5)}
                  </Text>
                </Space>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      }
    />
  );
}

/** Alias for the editable commission grid */
export const CommissionTable = CommissionRangeTable;
