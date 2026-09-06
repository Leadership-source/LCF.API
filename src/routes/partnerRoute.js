import express from "express";
import {
  createPartner,
  deletePartner,
  getPartner,
  getPartners,
  getPublishedPartners,
  updatePartner,
  updatePartnerStatus,
} from "../controller/partnerController.js";
import {
  authMiddleware,
  requireSuperAdmin,
} from "../middleWare/authMiddleWare.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

const router = express.Router();

// Public
router.get("/published", getPublishedPartners);

// Admin
router.get("/", authMiddleware, getPartners);

router.get("/:id", authMiddleware, getPartner);

router.post("/", authMiddleware, upload.single("logo"), createPartner);

router.put("/:id", authMiddleware, upload.single("logo"), updatePartner);

router.patch(
  "/:id/status",
  authMiddleware,
  requireSuperAdmin,
  updatePartnerStatus,
);

router.delete("/:id", authMiddleware, requireSuperAdmin, deletePartner);

export default router;
