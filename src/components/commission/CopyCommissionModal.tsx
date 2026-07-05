"use client";

import { Form, Modal, Select, Tabs, Typography, Button, Space } from "antd";
import {
  CommissionScope,
  CopyCommissionPayload,
} from "@/types/commission";
import {
  COMMISSION_SCOPE_OPTIONS,
  FINTECH_SERVICES,
} from "@/constants/commissionServices";
import {
  MOCK_RETAILERS,
} from "@/lib/commission/mockData";

const { Text } = Typography;

export interface CopyCommissionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CopyCommissionPayload) => void;
}

export function CopyCommissionModal({
  open,
  onClose,
  onSubmit,
}: CopyCommissionModalProps) {
  const [serviceForm] = Form.useForm();
  const [fullForm] = Form.useForm();
  const [cloneForm] = Form.useForm();

  const retailerOptions = MOCK_RETAILERS.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.code})`,
  }));

  const scopeOptions = COMMISSION_SCOPE_OPTIONS.map((o) => ({
    value: o.value as CommissionScope,
    label: o.label,
  }));

  const serviceOptions = FINTECH_SERVICES.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const handleServiceCopy = () => {
    serviceForm.validateFields().then((values) => {
      onSubmit({
        mode: "service",
        sourceServiceId: values.sourceServiceId,
        targetScope: values.targetScope,
        targetEntityId: values.targetEntityId,
      });
      serviceForm.resetFields();
      onClose();
    });
  };

  const handleFullCopy = () => {
    fullForm.validateFields().then((values) => {
      onSubmit({
        mode: "full",
        sourceRetailerId: values.sourceRetailerId,
        targetScope: values.targetScope,
        targetEntityId: values.targetEntityId,
      });
      fullForm.resetFields();
      onClose();
    });
  };

  const handleClone = () => {
    cloneForm.validateFields().then((values) => {
      onSubmit({
        mode: "clone_retailer",
        sourceRetailerId: values.sourceRetailerId,
        targetRetailerId: values.targetRetailerId,
        targetScope: "retailer",
      });
      cloneForm.resetFields();
      onClose();
    });
  };

  return (
    <Modal
      title="Copy Commission"
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      <Tabs
        items={[
          {
            key: "service",
            label: "One Service",
            children: (
              <>
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  Copy all slabs for a single service to another scope or entity.
                </Text>
                <Form form={serviceForm} layout="vertical">
                  <Form.Item
                    name="sourceServiceId"
                    label="Source Service"
                    rules={[{ required: true }]}
                  >
                    <Select showSearch optionFilterProp="label" options={serviceOptions} />
                  </Form.Item>
                  <Form.Item
                    name="targetScope"
                    label="Target Scope"
                    rules={[{ required: true }]}
                  >
                    <Select options={scopeOptions} />
                  </Form.Item>
                  <Form.Item name="targetEntityId" label="Target Entity (optional)">
                    <Select allowClear options={retailerOptions} placeholder="Retailer / entity ID" />
                  </Form.Item>
                  <ModalFooterActions onCancel={onClose} onOk={handleServiceCopy} okText="Copy Service" />
                </Form>
              </>
            ),
          },
          {
            key: "full",
            label: "Complete Retailer",
            children: (
              <>
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  Copy the entire commission profile from one retailer.
                </Text>
                <Form form={fullForm} layout="vertical">
                  <Form.Item
                    name="sourceRetailerId"
                    label="Source Retailer"
                    rules={[{ required: true }]}
                  >
                    <Select options={retailerOptions} />
                  </Form.Item>
                  <Form.Item
                    name="targetScope"
                    label="Target Scope"
                    rules={[{ required: true }]}
                  >
                    <Select options={scopeOptions} />
                  </Form.Item>
                  <Form.Item name="targetEntityId" label="Target Entity">
                    <Select allowClear options={retailerOptions} />
                  </Form.Item>
                  <ModalFooterActions onCancel={onClose} onOk={handleFullCopy} okText="Copy All" />
                </Form>
              </>
            ),
          },
          {
            key: "clone",
            label: "Clone From Retailer",
            children: (
              <>
                <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
                  Clone all commission slabs from an existing retailer to a new retailer.
                </Text>
                <Form form={cloneForm} layout="vertical">
                  <Form.Item
                    name="sourceRetailerId"
                    label="Clone From"
                    rules={[{ required: true }]}
                  >
                    <Select options={retailerOptions} />
                  </Form.Item>
                  <Form.Item
                    name="targetRetailerId"
                    label="Clone To"
                    rules={[{ required: true }]}
                  >
                    <Select options={retailerOptions} />
                  </Form.Item>
                  <ModalFooterActions onCancel={onClose} onOk={handleClone} okText="Clone" />
                </Form>
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}

function ModalFooterActions({
  onCancel,
  onOk,
  okText,
}: {
  onCancel: () => void;
  onOk: () => void;
  okText: string;
}) {
  return (
    <Space style={{ marginTop: 16 }}>
      <Button onClick={onCancel}>Cancel</Button>
      <Button type="primary" onClick={onOk}>
        {okText}
      </Button>
    </Space>
  );
}
