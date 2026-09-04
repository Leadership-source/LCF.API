import express from "express";
import {
  createVolunteerApplication,
  getVolunteerApplications,
  getVolunteerOptions,
} from "../controller/volunteerController.js";
import { authMiddleware, requireAdmin } from "../middleWare/authMiddleWare.js";
import { validate } from "../middleWare/validateRequest.js";
import { createVolunteerApplicationSchema } from "../validators/volunteerValidators.js";

const router = express.Router();

router.get("/options", getVolunteerOptions);
router.post("/", validate(createVolunteerApplicationSchema), createVolunteerApplication);
router.get("/admin", authMiddleware, requireAdmin, getVolunteerApplications);

export default router;