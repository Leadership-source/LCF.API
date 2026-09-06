import { z } from "zod";

const roleTypes = ["ADVISOR", "PATRON", "BRAND_AMBASSADOR", "HONORARY_SUPPORTER", "MENTEE"];

export const createExternalRoleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  roleType: z.enum(roleTypes),
  bio: z.string().trim().max(2000).optional(),
});

export const updateExternalRoleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  roleType: z.enum(roleTypes).optional(),
  bio: z.string().trim().max(2000).optional(),
  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export const updateExternalRoleStatusSchema = z.object({
  status: z.enum(["PUBLISHED", "UNPUBLISHED"]),
});

export const reorderExternalRolesSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string().uuid(),
      displayOrder: z.number().int().min(0),
    }),
  ),
});
