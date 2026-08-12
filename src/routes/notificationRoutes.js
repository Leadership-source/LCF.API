import express from "express";
import { authMiddleware } from "../middleWare/authMiddleWare.js";
import { getNotifications } from "../controller/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

export default router;
