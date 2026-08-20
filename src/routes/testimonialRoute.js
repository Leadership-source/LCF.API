import express from "express";
import {
  approveTestimonial,
  createTestimonial,
  deleteTestimonial,
  getAdminTestimonials,
  getApprovedTestimonials,
  rejectTestimonial,
} from "../controller/testimonialController.js";
import { authMiddleware, requireAdmin } from "../middleWare/authMiddleWare.js";

const router = express.Router();
router.post("/", createTestimonial);

router.get("/approved", getApprovedTestimonials);

router.get("/admin", authMiddleware, requireAdmin, getAdminTestimonials);

router.patch(
  "/admin/:id/approve",
  authMiddleware,
  requireAdmin,
  approveTestimonial,
);

router.delete("/admin/:id", authMiddleware, requireAdmin, deleteTestimonial);

router.patch(
  "/admin/:id/reject",
  authMiddleware,
  requireAdmin,
  rejectTestimonial,
);

export default router;
