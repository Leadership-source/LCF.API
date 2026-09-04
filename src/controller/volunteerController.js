import { prisma } from "../config/db.js";

const volunteerOptions = [
  {
    value: "MENTORING",
    label: "Mentoring and coaching",
    fields: [
      { name: "experience", label: "Relevant experience", type: "textarea", required: true },
      { name: "ageGroup", label: "Preferred age group", type: "text", required: true },
    ],
  },
  {
    value: "EVENTS",
    label: "Events and logistics",
    fields: [{ name: "eventExperience", label: "Event experience", type: "textarea", required: true }],
  },
  {
    value: "COMMUNITY_OUTREACH",
    label: "Community outreach",
    fields: [{ name: "community", label: "Community or cause you care about", type: "text", required: true }],
  },
  {
    value: "COMMUNICATIONS",
    label: "Communications and media",
    fields: [{ name: "platforms", label: "Platforms or communication skills", type: "text", required: true }],
  },
  {
    value: "FUNDRAISING",
    label: "Fundraising",
    fields: [{ name: "fundraisingExperience", label: "Fundraising experience", type: "textarea", required: true }],
  },
  {
    value: "ADMIN_SUPPORT",
    label: "Administration and support",
    fields: [{ name: "skills", label: "Skills you can contribute", type: "text", required: true }],
  },
];

export const getVolunteerOptions = (_req, res) => {
  return res.status(200).json({ status: "success", options: volunteerOptions });
};

export const createVolunteerApplication = async (req, res) => {
  try {
    const { fullName, email, phone, areaOfInterest, availability, details, message } = req.body;

    const application = await prisma.volunteerApplication.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        areaOfInterest,
        availability,
        details,
        message: message || null,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Thank you for volunteering. We will be in touch soon.",
      data: { id: application.id, status: application.status },
    });
  } catch (error) {
    console.error("CREATE VOLUNTEER APPLICATION ERROR:", error);
    return res.status(500).json({ status: "error", message: "Failed to submit volunteer application" });
  }
};

export const getVolunteerApplications = async (req, res) => {
  try {
    const applications = await prisma.volunteerApplication.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ status: "success", applications });
  } catch (error) {
    console.error("GET VOLUNTEER APPLICATIONS ERROR:", error);
    return res.status(500).json({ status: "error", message: "Failed to fetch volunteer applications" });
  }
};