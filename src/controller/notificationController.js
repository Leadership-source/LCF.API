import { prisma } from "../config/db.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      data: notifications,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch notifications",
    });
  }
};
