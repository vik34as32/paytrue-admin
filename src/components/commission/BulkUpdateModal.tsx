"use client";

import { Form, Modal, Select, InputNumber, Radio, Space, Typography, Checkbox } from "antd";
import {
  BulkUpdatePayload,
  CommissionStatus,
  CommissionValueType,
} from "@/types/commission";
import {
  COMMISSION_STATUS_OPTIONS,
  COMMISSION_TYPE_OPTIONS,
} from "@/constants/commissionServices";

const { Text } = Typography;

interface BulkUpdateFormValues extends BulkUpdatePayload {
  applyType?: boolean;
  applyValue?: boolean;
  applyStatus?: boolean;
  applyPriority?: boolean;
}

export interface BulkUpdateModalProps {
  open: boolean;
  selectedCount: number;
  onClose: () => void;
  onSubmit: (payload: BulkUpdatePayload) => void;
}

export function BulkUpdateModal({
  open,
  selectedCount,
  onClose,
  onSubmit,
}: BulkUpdateModalProps) {
  const [form] = Form.useForm<BulkUpdateFormValues>();

  const handleOk = () => {
    form.validateFields().then((values) => {
      const payload: BulkUpdatePayload = {
        target: values.target,
      };
      if (values.applyType && values.commissionType) {
        payload.commissionType = values.commissionType;
      }
      if (values.applyValue && values.commissionValue !== undefined) {
        payload.commissionValue = values.commissionValue;
      }
      if (values.applyStatus && values.status) {
        payload.status = values.status;
      }
      if (values.applyPriority && values.priority !== undefined) {
        payload.priority = values.priority;
      }
      onSubmit(payload);
      form.resetFields();
      onClose();
    });
  };

  return (
    <Modal
      title="Bulk Update Commission"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Apply to Selected"
      destroyOnClose
      width={520}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Update {selectedCount} selected row(s). Only checked fields will be
        changed.
      </Text>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          target: "retailer",
          applyType: true,
          applyValue: true,
          applyStatus: false,
          applyPriority: false,
          commissionType: "flat",
        }}
      >
        <Form.Item
          name="target"
          label="Apply changes to"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="retailer">Retailer Commission</Radio>
            <Radio value="distributor">Distributor Commission</Radio>
            <Radio value="master_distributor">Master Distributor</Radio>
            <Radio value="company">Company Margin</Radio>
          </Radio.Group>
        </Form.Item>

        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Form.Item name="applyType" valuePropName="checked" noStyle>
            <Checkbox>Update Commission Type</Checkbox>
          </Form.Item>
          <Form.Item name="commissionType" label="Commission Type">
            <Select
              options={COMMISSION_TYPE_OPTIONS.map((o) => ({
                value: o.value as CommissionValueType,
                label: o.label,
              }))}
            />
          </Form.Item>

          <Form.Item name="applyValue" valuePropName="checked" noStyle>
            <Checkbox>Update Commission Value</Checkbox>
          </Form.Item>
          <Form.Item name="commissionValue" label="Commission Value">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="applyStatus" valuePropName="checked" noStyle>
            <Checkbox>Update Status</Checkbox>
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select
              options={COMMISSION_STATUS_OPTIONS.map((o) => ({
                value: o.value as CommissionStatus,
                label: o.label,
              }))}
            />
          </Form.Item>

          <Form.Item name="applyPriority" valuePropName="checked" noStyle>
            <Checkbox>Update Priority</Checkbox>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
