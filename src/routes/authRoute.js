import express from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controller/authController.js";
import { authMiddleware } from "../middleWare/authMiddleWare.js";

import { validate } from "../middleWare/validateRequest.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

router.get("/me", authMiddleware, getCurrentUser);

router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  changePassword,
);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);
export default router;
