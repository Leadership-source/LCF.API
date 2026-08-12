import { prisma } from "../config/db.js";

export const createNotification = async ({ userId, message, type }) => {
  return await prisma.notification.create({
    data: {
      userId,
      message,
      type,
    },
  });
};
