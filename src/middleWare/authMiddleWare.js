import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Otherwise check cookie
  else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  // No token
  if (!token) {
    return res.status(401).json({
      error: "Not authorized, no token provided",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "User no longer exists",
      });
    }

    // Attach user to request
    req.user = user;

    // Continue
    next();
  } catch (err) {
    console.error(err);

    return res.status(401).json({
      error: "Not authorized, token failed",
    });
  }
};

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "SUPERADMIN") {
    return res.status(403).json({ error: "Forbidden: superadmin access required" });
  }
  next();
};
