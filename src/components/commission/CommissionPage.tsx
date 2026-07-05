"use client";

import { useState } from "react";
import {
  Card,
  Flex,
  Space,
  Button,
  Tag,
  Typography,
  Statistic,
  Tooltip,
  Select,
  App,
} from "antd";
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  CopyOutlined,
  UserSwitchOutlined,
  EditOutlined,
  AppstoreAddOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { CommissionAntdProvider } from "@/components/commission/CommissionAntdProvider";
import { CommissionRangeTable } from "@/components/commission/CommissionRangeTable";
import { CommissionDrawer } from "@/components/commission/CommissionDrawer";
import { CommissionHistoryModal } from "@/components/commission/CommissionHistoryModal";
import { BulkUpdateModal } from "@/components/commission/BulkUpdateModal";
import { CopyCommissionModal } from "@/components/commission/CopyCommissionModal";
import { useCommissionManagement } from "@/hooks/useCommissionManagement";
import { MOCK_RETAILERS } from "@/lib/commission/mockData";

const { Text, Title } = Typography;

const retailerOptions = MOCK_RETAILERS.map((r) => ({
  value: r.id,
  label: `${r.name} (${r.code})`,
}));

function CommissionRetailerGate({
  onView,
}: {
  onView: (retailerId: string) => void;
}) {
  const { message } = App.useApp();
  const [retailerId, setRetailerId] = useState<string | undefined>();

  const handleView = () => {
    if (!retailerId) {
      message.warning("Please select a retailer");
      return;
    }
    onView(retailerId);
  };

  return (
    <Card
      style={{ borderRadius: 16, maxWidth: 640 }}
      styles={{ body: { padding: "28px 24px" } }}
    >
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Space align="start">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #4318FF 0%, #868CFF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShopOutlined style={{ color: "#fff", fontSize: 20 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              Select Retailer
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Choose a retailer and click View to manage commission slabs
            </Text>
          </div>
        </Space>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Retailer
          </Text>
          <Select
            showSearch
            allowClear
            placeholder="Select retailer"
            optionFilterProp="label"
            options={retailerOptions}
            value={retailerId}
            onChange={setRetailerId}
            style={{ width: "100%" }}
            size="large"
          />
        </div>

        <Button
          type="primary"
          size="large"
          icon={<EyeOutlined />}
          onClick={handleView}
          style={{ minWidth: 120 }}
        >
          View
        </Button>
      </Space>
    </Card>
  );
}

function CommissionPageContent() {
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(
    null
  );
  const cm = useCommissionManagement(selectedRetailerId);

  const selectedRetailer = MOCK_RETAILERS.find(
    (r) => r.id === selectedRetailerId
  );
  const showCommissionUI = selectedRetailerId !== null;

  const handleViewRetailer = (retailerId: string) => {
    setSelectedRetailerId(retailerId);
  };

  const handleBackToSelect = () => {
    setSelectedRetailerId(null);
    cm.setSelectedRowKeys([]);
  };

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title="Commission Management"
        subtitle={
          showCommissionUI && selectedRetailer
            ? `Commission configuration for ${selectedRetailer.name}`
            : "Select a retailer to configure commission slabs"
        }
      />

      {!showCommissionUI ? (
        <CommissionRetailerGate onView={handleViewRetailer} />
      ) : (
        <Flex vertical gap={16}>
          <Card
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: "12px 20px" } }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToSelect}
                >
                  Change Retailer
                </Button>
                <Tag color="purple" style={{ margin: 0, padding: "4px 10px" }}>
                  {selectedRetailer?.name} ({selectedRetailer?.code})
                </Tag>
              </Space>
            </Flex>
          </Card>

          <Card
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Space size={24} wrap>
                <Statistic
                  title="Total Slabs"
                  value={cm.totalSlabs}
                  valueStyle={{ fontSize: 20, color: "#4318FF" }}
                />
                <Statistic
                  title="Active"
                  value={cm.activeSlabs}
                  valueStyle={{ fontSize: 20, color: "#05CD99" }}
                />
                <Statistic
                  title="Slabs"
                  value={cm.filteredRows.length}
                  valueStyle={{ fontSize: 20 }}
                />
              </Space>

              <Space wrap>
                <Tooltip title="Add new service commission">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={cm.handleAddCommission}
                  >
                    Add Commission
                  </Button>
                </Tooltip>
                <Button icon={<ImportOutlined />} onClick={cm.handleImport}>
                  Import
                </Button>
                <Button icon={<ExportOutlined />} onClick={cm.handleExport}>
                  Export
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => cm.setCopyOpen(true)}
                >
                  Copy Commission
                </Button>
                <Button
                  icon={<UserSwitchOutlined />}
                  onClick={() => cm.setCopyOpen(true)}
                >
                  Clone From Retailer
                </Button>
                <Button
                  icon={<EditOutlined />}
                  disabled={!cm.selectedRowKeys.length}
                  onClick={() => cm.setBulkOpen(true)}
                >
                  Bulk Update
                  {cm.selectedRowKeys.length > 0 && (
                    <Tag color="blue" style={{ marginLeft: 6 }}>
                      {cm.selectedRowKeys.length}
                    </Tag>
                  )}
                </Button>
                <Button
                  icon={<AppstoreAddOutlined />}
                  onClick={cm.handleAddRange}
                >
                  Add Range
                </Button>
              </Space>
            </Flex>
          </Card>

          <Card
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: "12px 16px 16px" } }}
          >
            <Space style={{ marginBottom: 12 }}>
              <Title level={5} style={{ margin: 0 }}>
                Commission Slabs
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Inline edit supported · ranges validated for overlap
              </Text>
            </Space>

            <CommissionRangeTable
              rows={cm.filteredRows}
              selectedRowKeys={cm.selectedRowKeys}
              onSelectionChange={cm.setSelectedRowKeys}
              onRowChange={cm.updateRow}
              onEdit={cm.setDrawerRow}
              onDuplicate={cm.handleDuplicate}
              onDelete={cm.handleDelete}
              onHistory={cm.setHistoryRow}
              loading={cm.loading}
            />
          </Card>
        </Flex>
      )}

      {showCommissionUI && (
        <>
          <CommissionDrawer
            open={!!cm.drawerRow}
            row={cm.drawerRow}
            scope="retailer"
            onClose={() => cm.setDrawerRow(null)}
            onSave={cm.handleSaveDrawer}
          />

          <CommissionHistoryModal
            open={!!cm.historyRow}
            commissionId={cm.historyRow?.id ?? null}
            serviceName={cm.historyRow?.serviceName}
            onClose={() => cm.setHistoryRow(null)}
          />

          <BulkUpdateModal
            open={cm.bulkOpen}
            selectedCount={cm.selectedRowKeys.length}
            onClose={() => cm.setBulkOpen(false)}
            onSubmit={cm.handleBulkUpdate}
          />

          <CopyCommissionModal
            open={cm.copyOpen}
            onClose={() => cm.setCopyOpen(false)}
            onSubmit={cm.handleCopy}
          />
        </>
      )}
    </div>
  );
}

export function CommissionPage() {
  return (
    <CommissionAntdProvider>
      <CommissionPageContent />
    </CommissionAntdProvider>
  );
}

export default CommissionPage;
