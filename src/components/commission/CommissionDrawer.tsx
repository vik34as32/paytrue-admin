"use client";

import { useEffect } from "react";
import {
  Drawer,
  Form,
  Select,
  InputNumber,
  Switch,
  Space,
  Typography,
  Divider,
  Button,
} from "antd";
import {
  CommissionRangeRow,
  CommissionScope,
  CommissionStatus,
  CommissionValueType,
} from "@/types/commission";
import {
  COMMISSION_TYPE_OPTIONS,
  FINTECH_SERVICES,
} from "@/constants/commissionServices";
import {
  MOCK_DISTRIBUTORS,
  MOCK_MASTER_DISTRIBUTORS,
  MOCK_RETAILERS,
} from "@/lib/commission/mockData";

const { Title, Text } = Typography;

export interface CommissionDrawerProps {
  open: boolean;
  row: CommissionRangeRow | null;
  scope: CommissionScope;
  onClose: () => void;
  onSave: (row: CommissionRangeRow) => void;
}

export function CommissionDrawer({
  open,
  row,
  scope,
  onClose,
  onSave,
}: CommissionDrawerProps) {
  const [form] = Form.useForm<CommissionRangeRow>();

  useEffect(() => {
    if (row && open) {
      form.setFieldsValue(row);
    } else {
      form.resetFields();
    }
  }, [row, open, form]);

  const handleFinish = (values: CommissionRangeRow) => {
    if (!row) return;
    const service = FINTECH_SERVICES.find((s) => s.id === values.serviceId);
    onSave({
      ...row,
      ...values,
      serviceName: service?.name ?? row.serviceName,
      scope,
    });
    onClose();
  };

  return (
    <Drawer
      title="Edit Commission Slab"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { paddingBottom: 80 } }}
      footer={
        <Space style={{ float: "right" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Save Changes
          </Button>
        </Space>
      }
    >
      {row && (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Title level={5}>Service & Range</Title>
          <Form.Item
            name="serviceId"
            label="Service"
            rules={[{ required: true, message: "Select a service" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={FINTECH_SERVICES.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </Form.Item>
          <Space style={{ width: "100%" }} size={12}>
            <Form.Item
              name="rangeFrom"
              label="Range From"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="rangeTo"
              label="Range To"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          {scope === "retailer" && (
            <Form.Item name="retailerId" label="Retailer">
              <Select
                options={MOCK_RETAILERS.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
              />
            </Form.Item>
          )}
          {scope === "distributor" && (
            <Form.Item name="distributorId" label="Distributor">
              <Select
                options={MOCK_DISTRIBUTORS.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
              />
            </Form.Item>
          )}
          {scope === "master_distributor" && (
            <Form.Item name="masterDistributorId" label="Master Distributor">
              <Select
                options={MOCK_MASTER_DISTRIBUTORS.map((m) => ({
                  value: m.id,
                  label: m.name,
                }))}
              />
            </Form.Item>
          )}

          <Divider />
          <Title level={5}>Deduction</Title>
          <Space style={{ width: "100%" }}>
            <Form.Item name="deductionType" label="Type" style={{ flex: 1 }}>
              <Select
                options={COMMISSION_TYPE_OPTIONS.map((o) => ({
                  value: o.value as CommissionValueType,
                  label: o.label,
                }))}
              />
            </Form.Item>
            <Form.Item name="deductionValue" label="Value" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>

          <Divider />
          <Title level={5}>Commissions (RT / DD / MD)</Title>
          {(
            [
              ["retailerCommissionType", "retailerCommission", "Retailer (RT)"],
              [
                "distributorCommissionType",
                "distributorCommission",
                "Distributor (DD)",
              ],
              [
                "masterDistributorCommissionType",
                "masterDistributorCommission",
                "Master Distributor (MD)",
              ],
            ] as const
          ).map(([typeKey, valueKey, label]) => (
            <Space key={typeKey} style={{ width: "100%", marginBottom: 8 }}>
              <Text style={{ width: 120 }}>{label}</Text>
              <Form.Item name={typeKey} noStyle>
                <Select
                  style={{ width: 130 }}
                  options={COMMISSION_TYPE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.suffix,
                  }))}
                />
              </Form.Item>
              <Form.Item name={valueKey} noStyle>
                <InputNumber min={0} style={{ width: 120 }} />
              </Form.Item>
            </Space>
          ))}

          <Divider />
          <Form.Item name="priority" label="Priority">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            valuePropName="checked"
            getValueFromEvent={(checked: boolean) =>
              checked ? "active" : ("inactive" as CommissionStatus)
            }
            getValueProps={(value: CommissionStatus) => ({
              checked: value === "active",
            })}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}
