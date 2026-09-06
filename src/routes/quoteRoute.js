import express from "express";
import multer from "multer";

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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Public
router.get("/published", getPublishedQuotes);

// Admin
router.get("/", authMiddleware, requireAdmin, getQuotes);

router.get("/:id", authMiddleware, requireAdmin, getQuote);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(createQuoteSchema),
  createQuote,
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
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
