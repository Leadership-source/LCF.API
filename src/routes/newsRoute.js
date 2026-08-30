import express from "express";
import multer from "multer";

import {
  getNewsArticles,
  getPublicNewsArticles,
  getNewsArticleById,
  createNewsArticle,
  updateNewsArticle,
  updateNewsStatus,
  deleteNewsArticle,
} from "../controller/newsController.js";

import { authMiddleware, requireAdmin } from "../middleWare/authMiddleWare.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Public list — published articles only
router.get("/public", getPublicNewsArticles);

// Single article
router.get("/:id", getNewsArticleById);

// Admin list — all articles
router.get("/", authMiddleware, requireAdmin, getNewsArticles);

// Create
router.post("/", authMiddleware, requireAdmin, upload.single("image"), createNewsArticle);

// Update article details
router.patch("/:id", authMiddleware, requireAdmin, upload.single("image"), updateNewsArticle);

// Publish / Unpublish
router.patch("/:id/status", authMiddleware, requireAdmin, updateNewsStatus);

// Delete
router.delete("/:id", authMiddleware, requireAdmin, deleteNewsArticle);

export default router;
