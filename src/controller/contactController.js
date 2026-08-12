import { prisma } from "../config/db.js";
import { sendContactEmail } from "../utils/emailService.js";

export const createContactMessage = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    await sendContactEmail({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      message:
        "Your message has been sent successfully. We will get back to you soon.",
      data: contactMessage,
    });
  } catch (error) {
    console.error("CREATE CONTACT MESSAGE ERROR:", error);

    return res.status(500).json({
      message: "Unable to send your message. Please try again later.",
    });
  }
};

