import { z } from "zod";

export const registerForEventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),

  email: z.string().email("Please provide a valid email address"),

  phone: z.string().max(20).optional(),
});
