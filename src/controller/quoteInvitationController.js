import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import { prisma } from "../config/db.js";
import { sendQuoteInvitationEmail } from "../utils/emailService.js";

/**
 * CREATE QUOTE INVITATION
 *
 * SUPERADMIN only
 *
 * Creates a secure invitation link that expires after 12 hours.
 */
export const createQuoteInvitation = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Leader email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if this email already has an active invitation
    const existingInvitation = await prisma.quoteInvitation.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        cancelledAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return res.status(400).json({
        status: "error",
        message: "This leader already has an active invitation.",
      });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Invitation expires after 12 hours
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    // Create invitation
    const invitation = await prisma.quoteInvitation.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
        createdBy: req.user.id,
      },
    });

    /**
     * IMPORTANT:
     *
     * Because the frontend uses HashRouter,
     * the URL must contain /#/
     *
     * Example:
     * http://localhost:5173/#/quote-invitation/TOKEN
     */
    const invitationLink = `${process.env.FRONTEND_URL}/#/quote-invitation/${token}`;

    // Send invitation email
    await sendQuoteInvitationEmail({
      email: normalizedEmail,
      invitationLink,
      expiresAt,
    });

    return res.status(201).json({
      status: "success",
      message: "Quote invitation sent successfully.",
      data: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to send quote invitation.",
    });
  }
};

/**
 * GET / VALIDATE QUOTE INVITATION
 *
 * Public
 *
 * Used by the frontend when a leader opens the invitation link.
 */
export const getQuoteInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    const invitation = await prisma.quoteInvitation.findUnique({
      where: {
        token,
      },
    });

    // Invitation doesn't exist
    if (!invitation) {
      return res.status(404).json({
        status: "error",
        message: "Invalid invitation link.",
      });
    }

    // Invitation was cancelled
    if (invitation.cancelledAt) {
      return res.status(400).json({
        status: "error",
        message: "This invitation is no longer valid.",
      });
    }

    // Invitation has already been used
    if (invitation.usedAt) {
      return res.status(400).json({
        status: "error",
        message: "This invitation has already been used.",
      });
    }

    // Invitation has expired
    if (new Date() > invitation.expiresAt) {
      return res.status(410).json({
        status: "error",
        message: "This invitation link has expired.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to validate invitation.",
    });
  }
};

/**
 * SUBMIT QUOTE THROUGH INVITATION
 *
 * Public
 *
 * Creates a PENDING quote and marks the invitation as used.
 */
export const submitQuoteInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { name, role, quote } = req.body;
    let imageUrl = null;

    // Upload image if provided
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "leadership/quotes",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
    }

    // Find invitation
    const invitation = await prisma.quoteInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return res.status(404).json({
        status: "error",
        message: "Invitation not found.",
      });
    }

    // Check if already used
    if (invitation.usedAt) {
      return res.status(400).json({
        status: "error",
        message: "This invitation has already been used.",
      });
    }

    // Check if cancelled
    if (invitation.cancelledAt) {
      return res.status(400).json({
        status: "error",
        message: "This invitation has been cancelled.",
      });
    }

    // Check expiry
    if (new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({
        status: "error",
        message: "This invitation has expired.",
      });
    }

    // Create the quote and mark invitation as used
    const createdQuote = await prisma.$transaction(async (tx) => {
      // Mark invitation as used
      const updatedInvitation = await tx.quoteInvitation.updateMany({
        where: {
          id: invitation.id,
          usedAt: null,
          cancelledAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      if (updatedInvitation.count !== 1) {
        throw new Error("This invitation has already been used or cancelled.");
      }

      // Create quote
      const leaderQuote = await tx.leaderQuote.create({
        data: {
          name: name.trim(),
          role: role.trim(),

          // ⭐ THIS IS THE IMPORTANT PART
          email: invitation.email,

          quote: quote.trim(),
          image: imageUrl,

          status: "PENDING",
          source: "INVITATION",

          createdBy: null,
        },
      });

      return leaderQuote;
    });

    return res.status(201).json({
      status: "success",
      message: "Quote submitted successfully.",
      data: createdQuote,
    });
  } catch (error) {
    console.error("SUBMIT QUOTE INVITATION ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to submit quote.",
    });
  }
};

/**
 * GET ALL QUOTE INVITATIONS
 *
 * SUPERADMIN only
 *
 * Used by the admin invitation table.
 */
export const getQuoteInvitations = async (req, res) => {
  try {
    const invitations = await prisma.quoteInvitation.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const now = new Date();

    const data = invitations.map((invitation) => {
      let invitationStatus = "PENDING";

      if (invitation.cancelledAt) {
        invitationStatus = "CANCELLED";
      } else if (invitation.usedAt) {
        invitationStatus = "USED";
      } else if (now > invitation.expiresAt) {
        invitationStatus = "EXPIRED";
      }

      return {
        id: invitation.id,
        email: invitation.email,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        usedAt: invitation.usedAt,
        cancelledAt: invitation.cancelledAt,
        status: invitationStatus,
      };
    });

    return res.status(200).json({
      status: "success",
      results: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch quote invitations.",
    });
  }
};

/**
 * RESEND QUOTE INVITATION
 *
 * SUPERADMIN only
 *
 * Cancels the old invitation and creates
 * a completely new 12-hour invitation.
 */
export const resendQuoteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find existing invitation
    const existingInvitation = await prisma.quoteInvitation.findUnique({
      where: {
        id,
      },
    });

    if (!existingInvitation) {
      return res.status(404).json({
        status: "error",
        message: "Invitation not found.",
      });
    }

    // Don't allow resend if already used
    if (existingInvitation.usedAt) {
      return res.status(400).json({
        status: "error",
        message: "This invitation has already been used.",
      });
    }

    // Don't allow resend if already cancelled
    if (existingInvitation.cancelledAt) {
      return res.status(400).json({
        status: "400",
        message: "This invitation has already been cancelled.",
      });
    }

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");

    // New 12-hour expiry
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    /**
     * Create the new invitation first.
     */
    const newInvitation = await prisma.quoteInvitation.create({
      data: {
        email: existingInvitation.email,
        token,
        expiresAt,
        createdBy: req.user.id,
      },
    });

    // Correct HashRouter URL
    const invitationLink = `${process.env.FRONTEND_URL}/#/quote-invitation/${token}`;

    // Send the new invitation email
    await sendQuoteInvitationEmail({
      email: existingInvitation.email,
      invitationLink,
      expiresAt,
    });

    /**
     * Only cancel the old invitation after
     * the new invitation has been created and
     * the email has been sent successfully.
     */
    await prisma.quoteInvitation.update({
      where: {
        id: existingInvitation.id,
      },
      data: {
        cancelledAt: new Date(),
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Quote invitation resent successfully.",
      data: {
        id: newInvitation.id,
        email: newInvitation.email,
        expiresAt: newInvitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("RESEND QUOTE INVITATION ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to resend quote invitation.",
    });
  }
};

//delete
export const deleteQuoteInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.quoteInvitation.findUnique({
      where: {
        id,
      },
    });

    if (!invitation) {
      return res.status(404).json({
        status: "error",
        message: "Invitation not found.",
      });
    }

    await prisma.quoteInvitation.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Quote invitation deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Failed to delete quote invitation.",
    });
  }
};
