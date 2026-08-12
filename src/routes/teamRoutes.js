import express from "express";
import multer from "multer";
import {
  createTeam,
  getTeams,
  updateTeam,
  deleteTeam,
  updateTeamStatus,
  getPublishedTeams,
} from "../controller/teamController.js";

import { authMiddleware } from "../middleWare/authMiddleWare.js";

import { validate } from "../middleWare/validateRequest.js";
import {
  createTeamSchema,
  updateTeamSchema,
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
  upload.single("image"),
  validate(createTeamSchema),
  createTeam,
);

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  validate(updateTeamSchema),
  updateTeam,
);

router.delete("/:id", authMiddleware, deleteTeam);

router.patch("/:id/status", authMiddleware, updateTeamStatus);
export default router;
