import { prisma } from "../config/db.js";

import { sendQuoteRejectionEmail } from "../utils/emailService.js";

// ======================================================
// CREATE QUOTE
// Admin-created quote
// ======================================================

export const createQuote = async (req, res) => {
  try {
    const { name, role, quote, status } = req.body;

    const leaderQuote = await prisma.leaderQuote.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        email: null,
        quote: quote.trim(),
        status: status || "DRAFT",
        source: "ADMIN",
        createdBy: req.user.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        reviewedBy: status === "PUBLISHED" ? req.user.id : null,
      },
    });

    return res.status(201).json({
      status: "success",
      message: "Quote created successfully.",
      data: leaderQuote,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to create quote.",
    });
  }
};

// ======================================================
// GET ALL QUOTES
// ======================================================

export const getQuotes = async (req, res) => {
  try {
    const quotes = await prisma.leaderQuote.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: quotes.length,
      data: quotes,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch quotes.",
    });
  }
};

// ======================================================
// GET ONE QUOTE
// ======================================================

export const getQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const quote = await prisma.leaderQuote.findUnique({
      where: { id },
    });

    if (!quote) {
      return res.status(404).json({
        status: "error",
        message: "Quote not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: quote,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch quote.",
    });
  }
};

// ======================================================
// UPDATE QUOTE
// Used for editing name, role and quote content
// ======================================================

export const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, quote } = req.body;

    const existingQuote = await prisma.leaderQuote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return res.status(404).json({
        status: "error",
        message: "Quote not found.",
      });
    }

    const updatedQuote = await prisma.leaderQuote.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(role !== undefined && { role: role.trim() }),
        ...(quote !== undefined && { quote: quote.trim() }),
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Quote updated successfully.",
      data: updatedQuote,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to update quote.",
    });
  }
};

// ======================================================
// DELETE QUOTE
// ======================================================

export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;

    const existingQuote = await prisma.leaderQuote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return res.status(404).json({
        status: "error",
        message: "Quote not found.",
      });
    }

    await prisma.leaderQuote.delete({
      where: { id },
    });

    return res.status(200).json({
      status: "success",
      message: "Quote deleted successfully.",
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to delete quote.",
    });
  }
};

// ======================================================
// UPDATE QUOTE STATUS
// Publish / Unpublish / Reject / Unreject
// ======================================================

export const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED"];

    // ----------------------------------------------
    // Validate status
    // ----------------------------------------------

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid quote status.",
      });
    }

    // ----------------------------------------------
    // Get existing quote
    // ----------------------------------------------

    const existingQuote = await prisma.leaderQuote.findUnique({
      where: { id },
    });

    if (!existingQuote) {
      return res.status(404).json({
        status: "error",
        message: "Quote not found.",
      });
    }

    // ----------------------------------------------
    // Only invitation quotes can be rejected
    // ----------------------------------------------

    if (status === "REJECTED" && existingQuote.source !== "INVITATION") {
      return res.status(400).json({
        status: "error",
        message: "Only invitation quotes can be rejected.",
      });
    }

    // ----------------------------------------------
    // Don't allow rejected → published directly
    // ----------------------------------------------

    if (existingQuote.status === "REJECTED" && status === "PUBLISHED") {
      return res.status(400).json({
        status: "error",
        message:
          "A rejected quote must be unrejected before it can be published.",
      });
    }

    // ----------------------------------------------
    // Update status
    // ----------------------------------------------

    const updatedQuote = await prisma.leaderQuote.update({
      where: { id },
      data: {
        status,
        reviewedBy:
          status === "PUBLISHED" || status === "REJECTED" ? req.user.id : null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    // ----------------------------------------------
    // Send rejection email
    // ONLY when changing INTO REJECTED
    // ----------------------------------------------

    const isBeingRejected =
      status === "REJECTED" && existingQuote.status !== "REJECTED";

    if (isBeingRejected) {
      if (existingQuote.source === "INVITATION" && existingQuote.email) {
        try {
          await sendQuoteRejectionEmail({
            email: existingQuote.email,
            name: existingQuote.name,
          });
        } catch {
          // Email failure does not prevent quote status update
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message:
        status === "REJECTED"
          ? "Quote rejected successfully."
          : status === "PENDING"
            ? "Quote moved back to pending."
            : status === "PUBLISHED"
              ? "Quote published successfully."
              : "Quote status updated successfully.",
      data: updatedQuote,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to update quote status.",
    });
  }
};

// ======================================================
// GET PUBLISHED QUOTES
// ======================================================

export const getPublishedQuotes = async (req, res) => {
  try {
    const quotes = await prisma.leaderQuote.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: quotes.length,
      data: quotes,
    });
  } catch {
    return res.status(500).json({
      status: "error",
      message: "Failed to fetch published quotes.",
    });
  }
};
