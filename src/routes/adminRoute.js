import express from "express";
import { getAdminDashboard, getAdminStats } from "../controller/adminController.js";
import { authMiddleware } from "../middleWare/authMiddleWare.js";

const router = express.Router();

// Serves the HTML admin dashboard page
router.get("/", getAdminDashboard);

// JSON stats endpoint used by the dashboard — requires auth
router.get("/stats", authMiddleware, getAdminStats);

export default router;
