import { z } from "zod";

export const createQuoteSchema = z.object({
  name: z
    .string()
    .min(2, "Leader name must be at least 2 characters")
    .max(100, "Leader name cannot exceed 100 characters"),

  role: z
    .string()
    .min(2, "Role is required")
    .max(150, "Role cannot exceed 150 characters"),

  quote: z
    .string()
    .min(10, "Quote must be at least 10 characters")
    .max(2000, "Quote cannot exceed 2000 characters"),

  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export const updateQuoteSchema = z.object({
  name: z.string().min(2).max(100).optional(),

  role: z.string().min(2).max(150).optional(),

  quote: z.string().min(10).max(2000).optional(),
});

export const quoteInvitationSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address").max(254),
});

export const quoteInvitationSubmissionSchema = createQuoteSchema.pick({
  name: true,
  role: true,
  quote: true,
});
