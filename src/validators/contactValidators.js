import { z } from "zod";

export const createContactMessageSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must contain at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),

  email: z.string().email("Please provide a valid email address"),

  phone: z.string().max(20).optional(),

  subject: z
    .string()
    .min(3, "Subject must contain at least 3 characters")
    .max(200, "Subject cannot exceed 200 characters"),

  message: z
    .string()
    .min(10, "Message must contain at least 10 characters")
    .max(5000, "Message cannot exceed 5000 characters"),
});
