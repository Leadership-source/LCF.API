import express from "express";
import multer from "multer";

import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  getEvent,
  registerForEvent,
  getEventAttendees,
  getPublicEvents,
  updateEventStatus,
} from "../controller/eventController.js";

import { validate } from "../middleWare/validateRequest.js";

import {
  createEventSchema,
  updateEventSchema,
} from "../validators/eventValidators.js";

import { registerForEventSchema } from "../validators/registerForEventValidators.js";
import {
  authMiddleware,
  requireAdmin,
  requireSuperAdmin,
} from "../middleWare/authMiddleWare.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
router.get("/", authMiddleware, getEvents);

// Public events
router.get("/public", getPublicEvents);

router.get("/:id", getEvent);

// Get all events for admin

router.post(
  "/:id/register",
  validate(registerForEventSchema),
  registerForEvent,
);

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(createEventSchema),
  createEvent,
);

router.put(
  "/:id",
  authMiddleware,
  requireAdmin,
  upload.single("image"),
  validate(updateEventSchema),
  updateEvent,
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireAdmin,
  updateEventStatus,
);

router.get(
  "/:id/attendees",
  authMiddleware,
  requireSuperAdmin,
  getEventAttendees,
);

router.delete("/:id", authMiddleware, requireAdmin, deleteEvent);

export default router;
