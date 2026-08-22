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
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

// Mark one notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: "Notification marked as read",
      data: updatedNotification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION AS READ ERROR:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to mark all notifications as read",
    });
  }
};

// Delete one notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete notification",
    });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    return res.status(200).json({
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("DELETE ALL NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to clear notifications",
    });
  }
};
