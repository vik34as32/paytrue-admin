"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  serviceMasterFormSchema,
  ServiceMasterFormValues,
} from "@/validations/serviceMaster";
import type { ServiceMaster } from "@/types/serviceMaster";

const NONE_PARENT = "";

interface ServiceDialogProps {
  open: boolean;
  mode: "create" | "edit";
  serviceId?: string | null;
  initialData?: ServiceMaster | null;
  parentOptions: ServiceMaster[];
  isLoadingDetail?: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ServiceMasterFormValues) => Promise<void>;
}

export function ServiceDialog({
  open,
  mode,
  initialData,
  parentOptions,
  isLoadingDetail,
  isSubmitting,
  onClose,
  onSubmit,
}: ServiceDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceMasterFormValues>({
    resolver: zodResolver(serviceMasterFormSchema),
    defaultValues: {
      parentId: NONE_PARENT,
      name: "",
      code: "",
      description: "",
      displayOrder: 0,
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initialData) {
      reset({
        parentId: initialData.parentId || NONE_PARENT,
        name: initialData.name,
        code: initialData.code,
        description: initialData.description || "",
        displayOrder: initialData.displayOrder ?? 0,
        status: initialData.status,
      });
      return;
    }

    if (mode === "create") {
      reset({
        parentId: NONE_PARENT,
        name: "",
        code: "",
        description: "",
        displayOrder: 0,
        status: "ACTIVE",
      });
    }
  }, [open, mode, initialData, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === "create" ? "Add Service" : "Edit Service"}
      </DialogTitle>
      <DialogContent dividers>
        {isLoadingDetail ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Parent Service</InputLabel>
                  <Select
                    label="Parent Service"
                    value={field.value || NONE_PARENT}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <MenuItem value={NONE_PARENT}>None (Main Service)</MenuItem>
                    {parentOptions
                      .filter((p) => p.id !== initialData?.id)
                      .map((service) => (
                        <MenuItem key={service.id} value={service.id}>
                          {service.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <TextField
                fullWidth
                label="Service Name"
                required
                error={!!errors.name}
                helperText={errors.name?.message}
                {...register("name")}
              />
              <TextField
                fullWidth
                label="Service Code"
                required
                error={!!errors.code}
                helperText={errors.code?.message}
                {...register("code")}
              />
            </Box>
            <TextField
              fullWidth
              label="Description"
              multiline
              minRows={3}
              error={!!errors.description}
              helperText={errors.description?.message}
              {...register("description")}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                error={!!errors.displayOrder}
                helperText={errors.displayOrder?.message}
                {...register("displayOrder", { valueAsNumber: true })}
              />
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={field.value} onChange={field.onChange}>
                      <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                      <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleFormSubmit}
          disabled={isSubmitting || isLoadingDetail}
          startIcon={
            isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
