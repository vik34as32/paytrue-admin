"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Flex,
  Space,
  Button,
  Tag,
  Typography,
  Statistic,
  Select,
  App,
  Alert,
  Modal,
  Divider,
} from "antd";
import {
  PlusOutlined,
  ExportOutlined,
  EditOutlined,
  AppstoreAddOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ShopOutlined,
  SaveOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { PageHeader } from "@/components/common/PageHeader";
import { CommissionAntdProvider } from "@/components/commission/CommissionAntdProvider";
import { CommissionRangeTable } from "@/components/commission/CommissionRangeTable";
import { CommissionDrawer } from "@/components/commission/CommissionDrawer";
import { CommissionHistoryModal } from "@/components/commission/CommissionHistoryModal";
import { BulkUpdateModal } from "@/components/commission/BulkUpdateModal";
import { CopyCommissionModal } from "@/components/commission/CopyCommissionModal";
import { useCommissionManagement } from "@/hooks/useCommissionManagement";
import { useCommissionServices } from "@/hooks/useCommissionServices";
import { useCommissionRetailers } from "@/hooks/useCommissionRetailers";
import {
  getPublicNetworkUserLabel,
  getPublicNetworkUserNameIdLabel,
} from "@/services/publicNetworkUsersApi";
import type { FintechService } from "@/types/commission";

const { Text, Title } = Typography;

function CommissionRetailerGate({
  retailers,
  loading,
  error,
  onRetry,
  onView,
}: {
  retailers: { value: string; label: string }[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
      style={{
        borderRadius: 18,
        maxWidth: 720,
        border: "1px solid var(--border)",
        boxShadow: "0 8px 30px rgba(67, 24, 255, 0.06)",
      }}
      styles={{ body: { padding: "32px 28px" } }}
    >
      <Space direction="vertical" size={22} style={{ width: "100%" }}>
        <Space align="start" size={14}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #4318FF 0%, #868CFF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ShopOutlined style={{ color: "#fff", fontSize: 22 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Commission Setup
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Select any retailer to configure RT / DD / MD commission slabs by
              service. All retailers from the network are listed below.
            </Text>
          </div>
        </Space>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <Card size="small" styles={{ body: { padding: "12px 14px" } }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              RETAILERS LOADED
            </Text>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {loading ? "…" : retailers.length}
            </div>
          </Card>
          <Card size="small" styles={{ body: { padding: "12px 14px" } }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              COMMISSION ROLES
            </Text>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>
              RT · DD · MD
            </div>
          </Card>
          <Card size="small" styles={{ body: { padding: "12px 14px" } }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              SLABS
            </Text>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>
              Add & remove freely
            </div>
          </Card>
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Retailer
          </Text>
          <Select
            showSearch
            allowClear
            loading={loading}
            placeholder={
              loading
                ? "Loading all retailers..."
                : retailers.length
                  ? "Search and select retailer"
                  : "No retailers found"
            }
            optionFilterProp="label"
            options={retailers}
            value={retailerId}
            onChange={setRetailerId}
            style={{ width: "100%" }}
            size="large"
            listHeight={320}
            notFoundContent={loading ? "Loading..." : "No retailers found"}
          />
          {!loading && !error ? (
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {retailers.length} retailer{retailers.length === 1 ? "" : "s"}{" "}
              available
            </Text>
          ) : null}
          {error ? (
            <Space direction="vertical" size={8} style={{ marginTop: 12 }}>
              <Alert type="error" showIcon message={error} />
              {onRetry ? (
                <Button size="small" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
            </Space>
          ) : null}
        </div>

        <Button
          type="primary"
          size="large"
          icon={<EyeOutlined />}
          onClick={handleView}
          style={{ minWidth: 140, height: 44 }}
        >
          View Commissions
        </Button>
      </Space>
    </Card>
  );
}

function AddServiceModal({
  open,
  services,
  loading,
  onClose,
  onAdd,
}: {
  open: boolean;
  services: FintechService[];
  loading?: boolean;
  onClose: () => void;
  onAdd: (service: FintechService) => void;
}) {
  const [serviceId, setServiceId] = useState<string | undefined>();

  useEffect(() => {
    if (open) setServiceId(undefined);
  }, [open]);

  return (
    <Modal
      title="Add Service Commission"
      open={open}
      onCancel={onClose}
      onOk={() => {
        const service = services.find((item) => item.id === serviceId);
        if (!service) return;
        onAdd(service);
        onClose();
      }}
      okText="Add Service"
      okButtonProps={{ disabled: !serviceId }}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
        Choose a service to create the first slab. You can add more slabs for
        the same service afterwards.
      </Text>
      <Select
        showSearch
        loading={loading}
        placeholder="Select service"
        optionFilterProp="label"
        style={{ width: "100%" }}
        size="large"
        value={serviceId}
        onChange={setServiceId}
        options={services.map((service) => ({
          value: service.id,
          label: service.name,
        }))}
      />
    </Modal>
  );
}

function CommissionPageContent() {
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(
    null
  );
  const [addServiceOpen, setAddServiceOpen] = useState(false);

  const {
    retailers,
    loading: retailersLoading,
    error: retailersError,
    reload: reloadRetailers,
  } = useCommissionRetailers();

  const { services, loading: servicesLoading, error: servicesError } =
    useCommissionServices();

  const selectedRetailer = useMemo(
    () => retailers.find((retailer) => retailer.id === selectedRetailerId),
    [retailers, selectedRetailerId]
  );

  const retailerOption = useMemo(
    () =>
      selectedRetailer
        ? {
            id: selectedRetailer.id,
            name: getPublicNetworkUserLabel(selectedRetailer),
            code: selectedRetailer.userCode ?? selectedRetailer.mobile,
          }
        : undefined,
    [selectedRetailer]
  );

  const cm = useCommissionManagement(
    selectedRetailerId,
    retailerOption,
    services
  );

  const showCommissionUI = selectedRetailerId !== null;

  const retailerOptions = useMemo(
    () =>
      retailers.map((retailer) => ({
        value: retailer.id,
        label: getPublicNetworkUserNameIdLabel(retailer),
      })),
    [retailers]
  );

  const handleViewRetailer = (retailerId: string) => {
    setSelectedRetailerId(retailerId);
  };

  const handleBackToSelect = () => {
    setSelectedRetailerId(null);
    cm.setSelectedRowKeys([]);
  };

  const handleRemoveSelected = async () => {
    const selected = cm.filteredRows.filter((row) =>
      cm.selectedRowKeys.includes(row.id)
    );
    for (const row of selected) {
      await cm.handleDelete(row);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        breadcrumb="Admin"
        title="Commission Management"
        subtitle={
          showCommissionUI && selectedRetailer
            ? `RT / DD / MD slabs for ${getPublicNetworkUserLabel(selectedRetailer)}`
            : "Configure retailer commission slabs with RT, DD and MD shares"
        }
      />

      {!showCommissionUI ? (
        <CommissionRetailerGate
          retailers={retailerOptions}
          loading={retailersLoading}
          error={retailersError}
          onRetry={() => void reloadRetailers()}
          onView={handleViewRetailer}
        />
      ) : (
        <Flex vertical gap={16}>
          <Card
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: "14px 20px" } }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
              <Space wrap>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBackToSelect}>
                  All Retailers
                </Button>
                <Tag color="purple" style={{ margin: 0, padding: "5px 12px" }}>
                  {getPublicNetworkUserLabel(selectedRetailer!)}
                </Tag>
                {selectedRetailer?.id ? (
                  <Tag style={{ margin: 0 }}>{selectedRetailer.id}</Tag>
                ) : null}
                {cm.hasUnsavedChanges ? (
                  <Tag color="orange">Unsaved changes</Tag>
                ) : (
                  <Tag color="green">Saved</Tag>
                )}
              </Space>
              <Space wrap>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void cm.reload()}
                  loading={cm.loading}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => void cm.handleSaveAll()}
                  loading={cm.saving}
                >
                  Save Changes
                </Button>
              </Space>
            </Flex>
          </Card>

          {servicesError ? (
            <Alert
              type="warning"
              showIcon
              message="Could not load services from Service Master"
              description={servicesError}
            />
          ) : null}

          <Card
            style={{ borderRadius: 16 }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
              <Space size={28} wrap>
                <Statistic
                  title="Total Slabs"
                  value={cm.totalSlabs}
                  valueStyle={{ fontSize: 22, color: "#4318FF" }}
                />
                <Statistic
                  title="Active"
                  value={cm.activeSlabs}
                  valueStyle={{ fontSize: 22, color: "#05CD99" }}
                />
                <Statistic
                  title="Services Available"
                  value={services.length}
                  valueStyle={{ fontSize: 22 }}
                />
              </Space>

              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddServiceOpen(true)}
                >
                  Add Service
                </Button>
                <Button
                  icon={<AppstoreAddOutlined />}
                  onClick={() => cm.handleAddRange()}
                >
                  Add Slab
                </Button>
                <Button
                  icon={<EditOutlined />}
                  disabled={!cm.selectedRowKeys.length}
                  onClick={() => cm.setBulkOpen(true)}
                >
                  Bulk Update
                  {cm.selectedRowKeys.length > 0 ? (
                    <Tag color="blue" style={{ marginLeft: 6 }}>
                      {cm.selectedRowKeys.length}
                    </Tag>
                  ) : null}
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!cm.selectedRowKeys.length}
                  onClick={() => void handleRemoveSelected()}
                >
                  Remove Selected
                </Button>
                <Button icon={<ExportOutlined />} onClick={cm.handleExport}>
                  Export
                </Button>
              </Space>
            </Flex>

            <Divider style={{ margin: "16px 0 12px" }} />

            <Space style={{ marginBottom: 12 }} wrap size={8}>
              <Title level={5} style={{ margin: 0 }}>
                Commission Slabs
              </Title>
              <Tag>RT</Tag>
              <Tag>DD</Tag>
              <Tag>MD</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Add unlimited slabs per service · remove anytime · save to
                persist
              </Text>
            </Space>

            <CommissionRangeTable
              rows={cm.filteredRows}
              services={services}
              servicesLoading={servicesLoading}
              selectedRowKeys={cm.selectedRowKeys}
              onSelectionChange={cm.setSelectedRowKeys}
              onRowChange={cm.updateRow}
              onAddSlab={(row) => cm.handleAddRange(row)}
              onDuplicate={cm.handleDuplicate}
              onDelete={cm.handleDelete}
              loading={cm.loading}
            />
          </Card>
        </Flex>
      )}

      <AddServiceModal
        open={addServiceOpen}
        services={services}
        loading={servicesLoading}
        onClose={() => setAddServiceOpen(false)}
        onAdd={(service) => cm.handleAddCommission(service)}
      />

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
