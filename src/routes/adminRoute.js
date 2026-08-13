import express from "express";
import {
  getAdminDashboard,
  getAdminStats,
  createUser,
  getUsers,
  deleteUser,
  updateUserRole,
} from "../controller/adminController.js";
import { authMiddleware, requireSuperAdmin } from "../middleWare/authMiddleWare.js";
import { validate } from "../middleWare/validateRequest.js";
import { createUserSchema } from "../validators/authValidators.js";

const router = express.Router();

// Serves the HTML admin dashboard page
router.get("/", getAdminDashboard);

// JSON stats endpoint used by the dashboard — requires auth
router.get("/stats", authMiddleware, getAdminStats);

// User management — superadmin only
router.post("/users", authMiddleware, requireSuperAdmin, validate(createUserSchema), createUser);
router.get("/users", authMiddleware, requireSuperAdmin, getUsers);
router.delete("/users/:id", authMiddleware, requireSuperAdmin, deleteUser);
router.patch("/users/:id/role", authMiddleware, requireSuperAdmin, updateUserRole);

export default router;
