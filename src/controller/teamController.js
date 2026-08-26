import { prisma } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../service/notificationService.js";

// Create Team Member
export const createTeam = async (req, res) => {
  try {
    const { name, role, bio } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        status: "error",
        message: "Name and role are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Team member image is required",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "leadership/team",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(req.file.buffer);
    });

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        bio: bio ? bio.trim() : null,
        image: result.secure_url,
        status: "UNPUBLISHED",
        creator: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Team member "${team.name}" has been added.`,
      type: "TEAM_CREATED",
    });

    return res.status(201).json({
      status: "success",
      data: team,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to create team member.",
    });
  }
};
// Get All Team Members
// Get All Team Members - ADMIN
export const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
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
        name: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: teams.length,
      data: teams,
    });
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, bio, status, displayOrder } = req.body;

    // Check if the team member exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({
        status: "error",
        message: "Team member not found.",
      });
    }

    // Check if the logged-in user created this team member
    if (team.createdBy !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update this team member.",
      });
    }

    let imageUrl = team.image;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "leadership/team", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        name: name ?? team.name,
        role: role ?? team.role,
        bio: bio !== undefined ? (bio ? bio.trim() : null) : team.bio,
        image: imageUrl,
        status: status ?? team.status,
        displayOrder: displayOrder ?? team.displayOrder,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Team member "${team.name}" has been ${
        status === "PUBLISHED" ? "published" : "unpublished"
      }.`,
      type: status === "PUBLISHED" ? "TEAM_PUBLISHED" : "TEAM_UNPUBLISHED",
    });

    return res.status(200).json({
      status: "success",
      message: "Team member updated successfully.",
      data: updatedTeam,
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update team member.",
    });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the team member exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({
        status: "error",
        message: "Team member not found.",
      });
    }

    if (team.createdBy !== req.user.id && req.user.role !== "SUPERADMIN") {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete this team member.",
      });
    }

    await prisma.team.delete({
      where: { id },
    });

    await createNotification({
      userId: req.user.id,
      message: `Team member "${team.name}" was deleted.`,
      type: "TEAM_DELETED",
    });

    return res.status(200).json({
      status: "success",
      message: "Team member deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE TEAM ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete team member.",
    });
  }
};

export const updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PUBLISHED", "UNPUBLISHED"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid team status",
      });
    }

    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({
        status: "error",
        message: "Team member not found",
      });
    }

    if (team.createdBy !== req.user.id && req.user.role !== "SUPERADMIN") {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update this team member",
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: {
        status,
      },
    });

    return res.status(200).json({
      status: "success",
      message: `Team member ${
        status === "PUBLISHED" ? "published" : "unpublished"
      } successfully`,
      data: updatedTeam,
    });
  } catch (error) {
    console.error("UPDATE TEAM STATUS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update team status.",
    });
  }
};

export const reorderTeams = async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "orders must be a non-empty array",
      });
    }

    await prisma.$transaction(
      orders.map(({ id, displayOrder }) =>
        prisma.team.update({ where: { id }, data: { displayOrder } }),
      ),
    );

    return res.status(200).json({ message: "Display order updated" });
  } catch (error) {
    console.error("REORDER TEAMS ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to reorder team members.",
    });
  }
};

export const getPublishedTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: teams.length,
      data: teams,
    });
  } catch (error) {
    console.error("GET PUBLISHED TEAMS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch published team members.",
    });
  }
};
