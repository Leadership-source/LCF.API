import express from "express";

import {
  createQuoteInvitation,
  deleteQuoteInvitation,
  getQuoteInvitation,
  getQuoteInvitations,
  resendQuoteInvitation,
  submitQuoteInvitation,
} from "../controller/quoteInvitationController.js";

import {
  authMiddleware,
  requireSuperAdmin,
} from "../middleWare/authMiddleWare.js";
import { validate } from "../middleWare/validateRequest.js";
import {
  quoteInvitationSchema,
  quoteInvitationSubmissionSchema,
} from "../validators/quoteValidator.js";

const router = express.Router();

// SUPERADMIN generates invitation
router.post(
  "/",
  authMiddleware,
  requireSuperAdmin,
  validate(quoteInvitationSchema),
  createQuoteInvitation,
);

// SUPERADMIN gets all invitations
router.get("/", authMiddleware, requireSuperAdmin, getQuoteInvitations);

//get all invitation
router.post(
  "/:id/resend",
  authMiddleware,
  requireSuperAdmin,
  resendQuoteInvitation,
);

// Public validates invitation
router.get("/:token", getQuoteInvitation);

// Public submits quote
router.post(
  "/:token/submit",
  validate(quoteInvitationSubmissionSchema),
  submitQuoteInvitation,
);

//delete
router.delete("/:id", authMiddleware, requireSuperAdmin, deleteQuoteInvitation);
export default router;
