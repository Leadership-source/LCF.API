import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { generateToken } from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = generateToken(user.id, res);
    return res.status(201).json({
      message: "User created successfully",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
};

const login = async (req, res) => {
  try {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = generateToken(user.id, res);

  return res.status(200).json({
    message: "Logged in successfully",
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
};

const logout = async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to get current user",
    });
  }
};
export { register, login, logout, getCurrentUser };

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // req.user comes from authMiddleware
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      error: "Failed to change password",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    // Don't reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        status: "success",
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenExp = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpiry: resetTokenExp,
      },
    });

    const resetLink = `${
      process.env.FRONTEND_URL
    }/admin/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetLink,
    });

    return res.status(200).json({
      status: "success",
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        status: "error",
        message: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset link",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong. Please try again.",
    });
  }
};
