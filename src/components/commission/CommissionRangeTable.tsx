"use client";

import { useMemo } from "react";
import {
  Table,
  Select,
  InputNumber,
  Badge,
  Button,
  Tooltip,
  Space,
  Typography,
  Popconfirm,
  Tag,
} from "antd";
import type { ColumnsType, TableProps } from "antd/es/table";
import {
  DeleteOutlined,
  CopyOutlined,
  PercentageOutlined,
  DollarOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  CommissionRangeRow,
  CommissionStatus,
  CommissionValueType,
  FintechService,
} from "@/types/commission";
import { COMMISSION_TYPE_OPTIONS } from "@/constants/commissionServices";
import {
  resolveCommissionServiceLabel,
  toCommissionServiceSelectOptions,
} from "@/lib/commission/serviceOptions";
import {
  getCommissionPersistState,
  type CommissionPersistState,
} from "@/lib/commission/utils";

const { Text } = Typography;

export interface CommissionRangeTableProps {
  rows: CommissionRangeRow[];
  services: FintechService[];
  /** Full catalog for resolving Saved row labels (DMT · IMPS, etc.) */
  catalog?: FintechService[];
  servicesLoading?: boolean;
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onRowChange: (row: CommissionRangeRow) => void;
  onAddSlab: (row: CommissionRangeRow) => void;
  onDuplicate: (row: CommissionRangeRow) => void;
  onDelete: (row: CommissionRangeRow) => void;
  loading?: boolean;
}

function PersistStateTag({ state }: { state: CommissionPersistState }) {
  if (state === "new") {
    return (
      <Tooltip title="Not in database yet — click Save Changes to store">
        <Tag color="orange" icon={<CloudUploadOutlined />}>
          New
        </Tag>
      </Tooltip>
    );
  }
  if (state === "edited") {
    return (
      <Tooltip title="Changed locally — click Save Changes to update database">
        <Tag color="blue" icon={<EditOutlined />}>
          Edited
        </Tag>
      </Tooltip>
    );
  }
  return (
    <Tooltip title="Already saved in database">
      <Tag color="green" icon={<CheckCircleOutlined />}>
        Saved
      </Tag>
    </Tooltip>
  );
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
      style={{ width: 112 }}
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
      style={{ width: 108 }}
    />
  );
}

export function CommissionRangeTable({
  rows,
  services,
  catalog,
  servicesLoading,
  selectedRowKeys,
  onSelectionChange,
  onAddSlab,
  onDuplicate,
  onDelete,
  onRowChange,
  loading,
}: CommissionRangeTableProps) {
  const lookup = catalog?.length ? catalog : services;
  const serviceOptions = useMemo(
    () => toCommissionServiceSelectOptions(services),
    [services]
  );

  const columns: ColumnsType<CommissionRangeRow> = useMemo(
    () => [
      {
        title: "DB Status",
        key: "persistState",
        fixed: "left",
        width: 110,
        render: (_, record) => (
          <PersistStateTag state={getCommissionPersistState(record)} />
        ),
      },
      {
        title: "Service",
        dataIndex: "serviceName",
        fixed: "left",
        width: 220,
        render: (_, record) => {
          const state = getCommissionPersistState(record);
          const label = resolveCommissionServiceLabel(
            record.serviceId,
            record.serviceName,
            lookup
          );

          if (state === "saved" || state === "edited") {
            return (
              <Tooltip title={label}>
                <Text strong style={{ fontSize: 13, display: "block" }}>
                  {label}
                </Text>
              </Tooltip>
            );
          }

          return (
            <Select
              showSearch
              size="small"
              loading={servicesLoading}
              placeholder="Select service"
              optionFilterProp="label"
              value={record.serviceId || undefined}
              options={serviceOptions}
              onChange={(serviceId) => {
                const service = services.find((item) => item.id === serviceId);
                if (!service) return;
                onRowChange({
                  ...record,
                  serviceId: service.id,
                  serviceName: service.label ?? service.name,
                });
              }}
              style={{ width: "100%", minWidth: 180 }}
            />
          );
        },
      },
      {
        title: "Slab Range",
        children: [
          {
            title: "From",
            dataIndex: "rangeFrom",
            width: 110,
            align: "right",
            render: (_, record) => (
              <InputNumber
                size="small"
                min={0}
                value={record.rangeFrom}
                onChange={(v) => onRowChange({ ...record, rangeFrom: v ?? 0 })}
                style={{ width: 96 }}
              />
            ),
          },
          {
            title: "To",
            dataIndex: "rangeTo",
            width: 110,
            align: "right",
            render: (_, record) => (
              <InputNumber
                size="small"
                min={0}
                value={record.rangeTo}
                onChange={(v) => onRowChange({ ...record, rangeTo: v ?? 0 })}
                style={{ width: 96 }}
              />
            ),
          },
        ],
      },
      {
        title: "Deduction",
        children: [
          {
            title: "Type",
            width: 128,
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
            title: "Value",
            width: 120,
            align: "right",
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
        ],
      },
      {
        title: "Retailer (RT)",
        children: [
          {
            title: "Type",
            width: 128,
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
            title: "Value",
            width: 120,
            align: "right",
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
        ],
      },
      {
        title: "Distributor (DD)",
        children: [
          {
            title: "Type",
            width: 128,
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
            title: "Value",
            width: 120,
            align: "right",
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
        ],
      },
      {
        title: "Master Dist (MD)",
        children: [
          {
            title: "Type",
            width: 128,
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
            title: "Value",
            width: 120,
            align: "right",
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
        ],
      },
      {
        title: "Priority",
        dataIndex: "priority",
        width: 88,
        align: "center",
        render: (_, record) => (
          <InputNumber
            size="small"
            min={0}
            value={record.priority}
            onChange={(v) => onRowChange({ ...record, priority: v ?? 0 })}
            style={{ width: 68 }}
          />
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 110,
        align: "center",
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
                label: <Badge status="success" text="Active" />,
              },
              {
                value: "inactive",
                label: <Badge status="default" text="Inactive" />,
              },
            ]}
          />
        ),
      },
      {
        title: "Actions",
        fixed: "right",
        width: 128,
        align: "center",
        render: (_, record) => (
          <Space size={4}>
            <Tooltip title="Add slab for this service">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => onAddSlab(record)}
              />
            </Tooltip>
            <Tooltip title="Duplicate slab">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onDuplicate(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Remove this slab?"
              description={`${record.serviceName} (${record.rangeFrom}–${record.rangeTo})`}
              okText="Remove"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(record)}
            >
              <Tooltip title="Remove slab">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [
      onRowChange,
      onAddSlab,
      onDuplicate,
      onDelete,
      serviceOptions,
      services,
      lookup,
      servicesLoading,
    ]
  );

  const rowSelection: TableProps<CommissionRangeRow>["rowSelection"] = {
    selectedRowKeys,
    onChange: (keys) => onSelectionChange(keys as string[]),
  };

  return (
    <div
      className="commission-table-shell"
      style={{
        width: "100%",
        overflow: "auto",
        maxHeight: "calc(100vh - 320px)",
        borderRadius: 14,
        border: "1px solid var(--border)",
        background: "var(--card)",
      }}
    >
      <Table<CommissionRangeRow>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={rows}
        loading={loading}
        rowSelection={rowSelection}
        pagination={false}
        sticky
        scroll={{ x: 1780 }}
        rowClassName={(record) => {
          const state = getCommissionPersistState(record);
          if (state === "new") return "commission-row-new";
          if (state === "edited") return "commission-row-edited";
          return "commission-row-saved";
        }}
        locale={{
          emptyText: (
            <div style={{ padding: "28px 12px" }}>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                No commission slabs yet
              </Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Click “Add Service” to create the first slab, then Save Changes
                to store it in the database.
              </Text>
            </div>
          ),
        }}
      />
    </div>
  );
}
