import { z } from "zod";

export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  role: z
    .string()
    .min(2, "Role must be at least 2 characters")
    .max(150, "Role cannot exceed 150 characters"),

  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),

  displayOrder: z.coerce
    .number()
    .int("Display order must be a whole number")
    .min(0, "Display order cannot be negative")
    .optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),

  role: z.string().min(2).max(150).optional(),

  image: z.string().url().optional(),

  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),

  displayOrder: z.coerce.number().int().min(0).optional(),
});
