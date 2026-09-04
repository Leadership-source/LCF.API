import express from "express";
import multer from "multer";
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  updateTeamStatus,
  getPublishedTeams,
  reorderTeams,
} from "../controller/teamController.js";

import { authMiddleware, requireAdmin } from "../middleWare/authMiddleWare.js";

import { validate } from "../middleWare/validateRequest.js";
import {
  createTeamSchema,
  updateTeamSchema,
  reorderTeamsSchema,
} from "../validators/teamValidators.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.get("/", getTeams);

router.get("/public", getPublishedTeams);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(createTeamSchema),
  createTeam,
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(updateTeamSchema),
  updateTeam,
);

router.patch(
  "/reorder",
  authMiddleware,
  requireAdmin,
  validate(reorderTeamsSchema),
  reorderTeams,
);

router.delete("/:id", authMiddleware, requireAdmin, deleteTeam);

router.patch("/:id/status", authMiddleware, requireAdmin, updateTeamStatus);
export default router;
