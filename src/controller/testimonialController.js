import { prisma } from "../config/db.js";
export const createTestimonial = async (req, res) => {
  try {
    const { name, role, message } = req.body;

    if (!name || !role || !message) {
      return res.status(400).json({
        status: "error",
        message: "Name, role and message are required",
      });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        message: message.trim(),

        // If the user is authenticated, save their ID.
        // Otherwise it remains null.
        userId: req.user?.id || null,
      },
    });

    // Find all admins and superadmins
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "SUPERADMIN"],
        },
      },
      select: {
        id: true,
      },
    });

    // Notify admins that a new testimonial has arrived
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          message: `New testimonial submitted by ${name.trim()}`,
          type: "TESTIMONIAL",
          userId: admin.id,
        })),
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Thank you for your review. It has been submitted for approval.",
      testimonial,
    });
  } catch (error) {
    console.error("CREATE TESTIMONIAL ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to submit testimonial",
    });
  }
};

export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        status: "APPROVED",
      },
      orderBy: {
        approvedAt: "desc",
      },
      select: {
        id: true,
        name: true,
        role: true,
        message: true,
        approvedAt: true,
      },
    });

    return res.status(200).json({
      status: "success",
      testimonials,
    });
  } catch (error) {
    console.error("GET APPROVED TESTIMONIALS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch testimonials",
    });
  }
};

export const getAdminTestimonials = async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      testimonials,
    });
  } catch (error) {
    console.error("GET ADMIN TESTIMONIALS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch testimonials",
    });
  }
};

export const approveTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: {
        id,
      },
    });

    if (!testimonial) {
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found",
      });
    }

    if (testimonial.status === "APPROVED") {
      return res.status(400).json({
        status: "error",
        message: "Testimonial is already approved",
      });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: {
        id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: req.user.id,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Testimonial approved successfully",
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error("APPROVE TESTIMONIAL ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to approve testimonial",
    });
  }
};

export const rejectTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: {
        id,
      },
    });

    if (!testimonial) {
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found",
      });
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: {
        id,
      },
      data: {
        status: "REJECTED",
        approvedAt: null,
        approvedBy: null,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Testimonial rejected",
      testimonial: updatedTestimonial,
    });
  } catch (error) {
    console.error("REJECT TESTIMONIAL ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to reject testimonial",
    });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, message } = req.body;

    const testimonial = await prisma.testimonial.findUnique({ where: { id } });

    if (!testimonial) {
      return res.status(404).json({ status: "error", message: "Testimonial not found" });
    }

    const updated = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(role !== undefined && { role: role.trim() }),
        ...(message !== undefined && { message: message.trim() }),
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Testimonial updated successfully",
      testimonial: updated,
    });
  } catch (error) {
    console.error("UPDATE TESTIMONIAL ERROR:", error);
    return res.status(500).json({ status: "error", message: "Failed to update testimonial" });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: {
        id,
      },
    });

    if (!testimonial) {
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found",
      });
    }

    await prisma.testimonial.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Testimonial deleted successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("DELETE TESTIMONIAL ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete testimonial",
    });
  }
};
