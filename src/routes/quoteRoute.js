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
  requireAdmin,
} from "../middleWare/authMiddleWare.js";
import {
  createQuoteSchema,
  updateQuoteSchema,
} from "../validators/quoteValidator.js";

const router = express.Router();

// Public
router.get("/published", getPublishedQuotes);

// Admin
router.get("/", authMiddleware, requireAdmin, getQuotes);

router.get("/:id", authMiddleware, requireAdmin, getQuote);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validate(createQuoteSchema),
  createQuote,
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  validate(updateQuoteSchema),
  updateQuote,
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireAdmin,
  updateQuoteStatus,
);

router.delete("/:id", authMiddleware, requireAdmin, deleteQuote);

export default router;
