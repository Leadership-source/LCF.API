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

import { authMiddleware } from "../middleWare/authMiddleWare.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Public list — published articles only
router.get("/public", getPublicNewsArticles);

// Single article
router.get("/:id", getNewsArticleById);

// Admin list — all articles
router.get("/", authMiddleware, getNewsArticles);

// Create
router.post("/", authMiddleware, upload.single("image"), createNewsArticle);

// Update article details
router.patch("/:id", authMiddleware, upload.single("image"), updateNewsArticle);

// Publish / Unpublish
router.patch("/:id/status", authMiddleware, updateNewsStatus);

// Delete
router.delete("/:id", authMiddleware, deleteNewsArticle);

export default router;
