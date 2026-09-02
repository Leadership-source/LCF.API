import express from "express";

import {
  createQuote,
  getQuotes,
  getQuote,
  updateQuote,
  deleteQuote,
  updateQuoteStatus,
  getPublishedQuotes,
} from "../controller/quoteController.js";

import { validate } from "../middleWare/validateRequest.js";

import {
  authMiddleware,
  requireSuperAdmin,
} from "../middleWare/authMiddleWare.js";
import {
  createQuoteSchema,
  updateQuoteSchema,
} from "../validators/quoteValidator.js";

const router = express.Router();

// Public
router.get("/published", getPublishedQuotes);

// Admin
router.get("/", authMiddleware, getQuotes);

router.get("/:id", authMiddleware, getQuote);

router.post("/", authMiddleware, validate(createQuoteSchema), createQuote);

router.put("/:id", authMiddleware, validate(updateQuoteSchema), updateQuote);

router.patch(
  "/:id/status",
  authMiddleware,
  requireSuperAdmin,
  updateQuoteStatus,
);

router.delete("/:id", authMiddleware, requireSuperAdmin, deleteQuote);

export default router;
