import Chip from "@mui/material/Chip";
import type { ServiceStatus } from "@/types/serviceMaster";

interface StatusChipProps {
  status: ServiceStatus;
  size?: "small" | "medium";
}

export function StatusChip({ status, size = "small" }: StatusChipProps) {
  const isActive = status === "ACTIVE";

  return (
    <Chip
      label={status}
      size={size}
      color={isActive ? "success" : "default"}
      variant={isActive ? "filled" : "outlined"}
      sx={{
        fontWeight: 700,
        letterSpacing: 0.4,
        ...(!isActive
          ? {
              color: "text.secondary",
              borderColor: "divider",
            }
          : {}),
      }}
    />
  );
}
