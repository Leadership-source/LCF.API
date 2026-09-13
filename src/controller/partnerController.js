import { prisma } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../service/notificationService.js";

const isValidUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

// ---------------------------------------------
// Create Partner
// ---------------------------------------------
export const createPartner = async (req, res) => {
  try {
    const { name, websiteUrl } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Partner name is required.",
      });
    }

    if (websiteUrl?.trim() && !isValidUrl(websiteUrl.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Website URL must be a valid http(s) URL.",
      });
    }

    let logo = null;

    // Upload logo only if provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "leadership/partners",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(req.file.buffer);
      });

      logo = result.secure_url;
    }

    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        logo,
        websiteUrl: websiteUrl?.trim() || null,
        status: "UNPUBLISHED",
        createdBy: req.user.id,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Partner "${partner.name}" has been created.`,
      type: "PARTNER_CREATED",
    });

    return res.status(201).json({
      status: "success",
      message: "Partner added successfully.",
      data: partner,
    });
  } catch (error) {
    console.error("CREATE PARTNER ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to create partner.",
    });
  }
};

// ---------------------------------------------
// Get All Partners - Admin
// ---------------------------------------------
export const getPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error("GET PARTNERS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch partners.",
    });
  }
};

// ---------------------------------------------
// Get Published Partners - Public
// ---------------------------------------------
export const getPublishedPartners = async (req, res) => {
  try {
    const partners = await prisma.partner.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: partners.length,
      data: partners,
    });
  } catch (error) {
    console.error("GET PUBLISHED PARTNERS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch published partners.",
    });
  }
};

// ---------------------------------------------
// Get Single Partner
// ---------------------------------------------
export const getPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return res.status(404).json({
        status: "error",
        message: "Partner not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: partner,
    });
  } catch (error) {
    console.error("GET PARTNER ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch partner.",
    });
  }
};

// ---------------------------------------------
// Update Partner
// ---------------------------------------------
export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, websiteUrl } = req.body;

    const existingPartner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existingPartner) {
      return res.status(404).json({
        status: "error",
        message: "Partner not found.",
      });
    }

    const data = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          status: "error",
          message: "Partner name cannot be empty.",
        });
      }

      data.name = name.trim();
    }

    if (websiteUrl !== undefined) {
      const trimmedUrl = websiteUrl?.trim() || "";

      if (trimmedUrl && !isValidUrl(trimmedUrl)) {
        return res.status(400).json({
          status: "error",
          message: "Website URL must be a valid http(s) URL.",
        });
      }

      data.websiteUrl = trimmedUrl || null;
    }

    // Replace logo only when a new logo is uploaded
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "leadership/partners",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(req.file.buffer);
      });

      data.logo = result.secure_url;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data,
    });

    await createNotification({
      userId: req.user.id,
      message: `Partner "${partner.name}" has been updated.`,
      type: "PARTNER_UPDATED",
    });

    return res.status(200).json({
      status: "success",
      message: "Partner updated successfully.",
      data: partner,
    });
  } catch (error) {
    console.error("UPDATE PARTNER ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update partner.",
    });
  }
};

// ---------------------------------------------
// Update Partner Status
// ---------------------------------------------
export const updatePartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PUBLISHED", "UNPUBLISHED"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid partner status.",
      });
    }

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return res.status(404).json({
        status: "error",
        message: "Partner not found.",
      });
    }

    const updatedPartner = await prisma.partner.update({
      where: { id },
      data: {
        status,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Partner "${updatedPartner.name}" has been ${
        status === "PUBLISHED" ? "published" : "unpublished"
      }.`,
      type:
        status === "PUBLISHED" ? "PARTNER_PUBLISHED" : "PARTNER_UNPUBLISHED",
    });

    return res.status(200).json({
      status: "success",
      message: `Partner ${
        status === "PUBLISHED" ? "published" : "unpublished"
      } successfully.`,
      data: updatedPartner,
    });
  } catch (error) {
    console.error("UPDATE PARTNER STATUS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update partner status.",
    });
  }
};

// ---------------------------------------------
// Delete Partner
// ---------------------------------------------
export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id },
    });

    if (!partner) {
      return res.status(404).json({
        status: "error",
        message: "Partner not found.",
      });
    }

    await prisma.partner.delete({
      where: { id },
    });

    await createNotification({
      userId: req.user.id,
      message: `Partner "${partner.name}" has been deleted.`,
      type: "PARTNER_DELETED",
    });

    return res.status(200).json({
      status: "success",
      message: "Partner deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE PARTNER ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete partner.",
    });
  }
};
