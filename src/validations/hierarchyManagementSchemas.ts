import { z } from "zod";

const uuidRequired = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .uuid(`${label} must be a valid UUID`);

const uuidOptional = z.union([
  z.literal(""),
  z.string().uuid("Must be a valid UUID"),
]);

/** UI form — maps to PATCH body { distributorId, currentDistributorId?, reason? } */
export const reassignRetailerSchema = z
  .object({
    retailerId: uuidRequired("Retailer"),
    currentDistributorId: uuidOptional.optional(),
    newDistributorId: uuidRequired("New distributor"),
    reason: z
      .string()
      .trim()
      .max(500, "Reason must be 500 characters or less")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      !data.currentDistributorId ||
      data.newDistributorId !== data.currentDistributorId,
    {
      message: "Retailer is already assigned to this distributor.",
      path: ["newDistributorId"],
    }
  );

/** UI form — maps to PATCH body { masterDistributorId, currentMasterDistributorId?, reason? } */
export const reassignDistributorSchema = z
  .object({
    distributorId: uuidRequired("Distributor"),
    currentMasterDistributorId: uuidOptional.optional(),
    newMasterDistributorId: uuidRequired("New master distributor"),
    reason: z
      .string()
      .trim()
      .max(500, "Reason must be 500 characters or less")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      !data.currentMasterDistributorId ||
      data.newMasterDistributorId !== data.currentMasterDistributorId,
    {
      message: "Distributor is already assigned to this master distributor.",
      path: ["newMasterDistributorId"],
    }
  );

export type ReassignRetailerFormValues = z.infer<typeof reassignRetailerSchema>;
export type ReassignDistributorFormValues = z.infer<
  typeof reassignDistributorSchema
>;
