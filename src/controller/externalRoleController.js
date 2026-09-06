import { prisma } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../service/notificationService.js";

export const createExternalRole = async (req, res) => {
  try {
    const { name, roleType, bio } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "External role image is required",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "leadership/external-roles",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(req.file.buffer);
    });

    const externalRole = await prisma.externalRole.create({
      data: {
        name: name.trim(),
        roleType,
        bio: bio ? bio.trim() : null,
        image: result.secure_url,
        status: "UNPUBLISHED",
        createdBy: req.user.id,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `External role "${externalRole.name}" has been added.`,
      type: "EXTERNAL_ROLE_CREATED",
    });

    return res.status(201).json({
      status: "success",
      data: externalRole,
    });
  } catch (error) {
    console.error("CREATE EXTERNAL ROLE ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create external role.",
    });
  }
};

export const getExternalRoles = async (req, res) => {
  try {
    const roles = await prisma.externalRole.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("GET EXTERNAL ROLES ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch external roles",
    });
  }
};

export const getPublishedExternalRoles = async (req, res) => {
  try {
    const roles = await prisma.externalRole.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        displayOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        roleType: true,
        bio: true,
        image: true,
        displayOrder: true,
      },
    });

    return res.status(200).json({
      status: "success",
      results: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("GET PUBLISHED EXTERNAL ROLES ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch external roles",
    });
  }
};

export const updateExternalRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, roleType, bio, status, displayOrder } = req.body;

    const externalRole = await prisma.externalRole.findUnique({
      where: { id },
    });

    if (!externalRole) {
      return res.status(404).json({
        status: "error",
        message: "External role not found",
      });
    }

    let imageUrl = externalRole.image;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "leadership/external-roles", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const updatedRole = await prisma.externalRole.update({
      where: { id },
      data: {
        name: name ? name.trim() : externalRole.name,
        roleType: roleType ?? externalRole.roleType,
        bio: bio !== undefined ? (bio ? bio.trim() : null) : externalRole.bio,
        image: imageUrl,
        status: status ?? externalRole.status,
        displayOrder: displayOrder ?? externalRole.displayOrder,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "External role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("UPDATE EXTERNAL ROLE ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update external role",
    });
  }
};

export const deleteExternalRole = async (req, res) => {
  try {
    const { id } = req.params;

    const externalRole = await prisma.externalRole.findUnique({
      where: { id },
    });

    if (!externalRole) {
      return res.status(404).json({
        status: "error",
        message: "External role not found",
      });
    }

    await prisma.externalRole.delete({
      where: { id },
    });

    await createNotification({
      userId: req.user.id,
      message: `External role "${externalRole.name}" was deleted`,
      type: "EXTERNAL_ROLE_DELETED",
    });

    return res.status(200).json({
      status: "success",
      message: "External role deleted successfully",
    });
  } catch (error) {
    console.error("DELETE EXTERNAL ROLE ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to delete external role",
    });
  }
};

export const updateExternalRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PUBLISHED", "UNPUBLISHED"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid external role status",
      });
    }

    const externalRole = await prisma.externalRole.findUnique({
      where: { id },
    });

    if (!externalRole) {
      return res.status(404).json({
        status: "error",
        message: "External role not found",
      });
    }

    const updatedRole = await prisma.externalRole.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      status: "success",
      message: `External role ${status === "PUBLISHED" ? "published" : "unpublished"} successfully`,
      data: updatedRole,
    });
  } catch (error) {
    console.error("UPDATE EXTERNAL ROLE STATUS ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to update external role status",
    });
  }
};

export const reorderExternalRoles = async (req, res) => {
  try {
    const { orders } = req.body;

    await Promise.all(
      orders.map(({ id, displayOrder }) =>
        prisma.externalRole.update({ where: { id }, data: { displayOrder } }),
      ),
    );

    return res.status(200).json({
      status: "success",
      message: "External roles reordered successfully",
    });
  } catch (error) {
    console.error("REORDER EXTERNAL ROLES ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to reorder external roles",
    });
  }
};
