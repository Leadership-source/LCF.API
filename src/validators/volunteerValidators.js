import { z } from "zod";

const areasOfInterest = [
  "MENTORING",
  "EVENTS",
  "COMMUNITY_OUTREACH",
  "COMMUNICATIONS",
  "FUNDRAISING",
  "ADMIN_SUPPORT",
];

const detailsSchema = z.record(z.string(), z.string().trim().max(1000));

export const createVolunteerApplicationSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(20).optional(),
    areaOfInterest: z.enum(areasOfInterest),
    availability: z.string().trim().min(2).max(100),
    details: detailsSchema.default({}),
    message: z.string().trim().max(2000).optional(),
  })
  .superRefine((application, context) => {
    const requiredFields = {
      MENTORING: ["experience", "ageGroup"],
      EVENTS: ["eventExperience"],
      COMMUNITY_OUTREACH: ["community"],
      COMMUNICATIONS: ["platforms"],
      FUNDRAISING: ["fundraisingExperience"],
      ADMIN_SUPPORT: ["skills"],
    }[application.areaOfInterest];

    for (const field of requiredFields) {
      if (!application.details[field]?.trim()) {
        context.addIssue({
          code: "custom",
          path: ["details", field],
          message: `${field} is required for this area of interest`,
        });
      }
    }
  });