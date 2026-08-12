import { z } from "zod";

export const createEventSchema = z.object({
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(100),

  title: z.string().min(3, "Title must be at least 3 characters").max(200),

  location: z.string().min(2, "Location is required").max(200),

  date: z.string().min(1, "Date is required"),

  time: z.string().min(1, "Time is required"),

  description: z.string().min(10, "Description must be at least 10 characters"),

  speaker: z.string().min(2, "Speaker name is required"),

  venue: z.string().min(2, "Venue is required"),

  attendees: z.string().min(1, "Attendees is required"),

  agenda: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string()).min(1),
  ),

  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),
});
export const updateEventSchema = z.object({
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(100)
    .optional(),

  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200)
    .optional(),

  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(200)
    .optional(),

  date: z.string().optional(),

  time: z.string().optional(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),

  speaker: z
    .string()
    .min(2, "Speaker name must be at least 2 characters")
    .optional(),

  venue: z.string().min(2, "Venue must be at least 2 characters").optional(),

  attendees: z.string().min(1, "Attendees is required").optional(),

  agenda: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string()).optional(),
  ),

  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).optional(),
});
