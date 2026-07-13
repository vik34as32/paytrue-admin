import { z } from "zod";

export const serviceMasterFormSchema = z.object({
  parentId: z.string().optional(),
  name: z.string().min(1, "Service name is required").max(120, "Too long"),
  code: z
    .string()
    .min(1, "Service code is required")
    .max(50, "Too long")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphen or underscore only"),
  description: z.string().max(500, "Description is too long").optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type ServiceMasterFormValues = z.infer<typeof serviceMasterFormSchema>;
