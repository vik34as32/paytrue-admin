"use client";

import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StatusChip } from "@/components/service-master/StatusChip";
import { formatDate } from "@/lib/utils";
import type { ServiceMaster } from "@/types/serviceMaster";

interface ServiceViewDialogProps {
  open: boolean;
  service: ServiceMaster | null;
  isLoading?: boolean;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export function ServiceViewDialog({
  open,
  service,
  isLoading,
  onClose,
}: ServiceViewDialogProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 420 } } } }}
    >
      <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Service Details
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>

        {isLoading ? (
          <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : service ? (
          <Stack spacing={2.5} sx={{ flex: 1 }}>
            <DetailRow label="Service Name" value={service.name} />
            <DetailRow label="Service Code" value={service.code} />
            <DetailRow
              label="Parent Service"
              value={service.parentName || (service.type === "MAIN" ? "None" : "—")}
            />
            <DetailRow label="Description" value={service.description} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Status
              </Typography>
              <Box sx={{ mt: 1 }}>
                <StatusChip status={service.status} size="medium" />
              </Box>
            </Box>
            <Divider />
            <DetailRow
              label="Created Date"
              value={service.createdAt ? formatDate(service.createdAt) : undefined}
            />
            <DetailRow
              label="Updated Date"
              value={service.updatedAt ? formatDate(service.updatedAt) : undefined}
            />
          </Stack>
        ) : (
          <Typography color="text.secondary">No service selected.</Typography>
        )}
      </Box>
    </Drawer>
  );
}
