import express from "express";
import multer from "multer";
import {
  createExternalRole,
  getExternalRoles,
  updateExternalRole,
  deleteExternalRole,
  updateExternalRoleStatus,
  getPublishedExternalRoles,
  reorderExternalRoles,
} from "../controller/externalRoleController.js";

import { authMiddleware, requireAdmin } from "../middleWare/authMiddleWare.js";

import { validate } from "../middleWare/validateRequest.js";
import {
  createExternalRoleSchema,
  updateExternalRoleSchema,
  updateExternalRoleStatusSchema,
  reorderExternalRolesSchema,
} from "../validators/externalRoleValidators.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Admin routes
router.get("/", authMiddleware, requireAdmin, getExternalRoles);

// Public routes
router.get("/public", getPublishedExternalRoles);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(createExternalRoleSchema),
  createExternalRole,
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(updateExternalRoleSchema),
  updateExternalRole,
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireAdmin,
  validate(updateExternalRoleStatusSchema),
  updateExternalRoleStatus,
);

router.patch(
  "/reorder",
  authMiddleware,
  requireAdmin,
  validate(reorderExternalRolesSchema),
  reorderExternalRoles,
);

router.delete("/:id", authMiddleware, requireAdmin, deleteExternalRole);

export default router;
