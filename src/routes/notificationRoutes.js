import express from "express";

import { authMiddleware } from "../middleWare/authMiddleWare.js";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controller/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

router.patch("/:id/read", authMiddleware, markNotificationAsRead);

router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);

router.delete("/clear-all", authMiddleware, deleteAllNotifications);

router.delete("/:id", authMiddleware, deleteNotification);

export default router;
