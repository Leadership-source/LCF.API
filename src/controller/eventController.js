import { prisma } from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../service/notificationService.js";

// Create Event
export const createEvent = async (req, res) => {
  try {
    const {
      category,
      title,
      location,
      date,
      time,
      description,
      speaker,
      venue,
      attendees,
      agenda,
    } = req.body;

    if (
      !category ||
      !title ||
      !location ||
      !date ||
      !time ||
      !description ||
      !speaker ||
      !venue ||
      attendees === undefined ||
      !agenda
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Event image is required.",
      });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "leadership/events",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(req.file.buffer);
    });

    const event = await prisma.event.create({
      data: {
        category,
        title,
        image: result.secure_url,
        location,
        date: new Date(date),
        time,
        description,
        speaker,
        venue,
        attendees: Number(attendees),
        agenda: Array.isArray(agenda) ? agenda : JSON.parse(agenda),

        // New event is unpublished by default
        status: "UNPUBLISHED",

        createdBy: req.user.id,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Event "${event.title}" has been created.`,
      type: "EVENT_CREATED",
    });

    return res.status(201).json({
      status: "success",
      message: "Event created successfully.",
      data: event,
    });
  } catch (error) {
    console.error("CREATE EVENT ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to create event.",
    });
  }
};

// Get All Events
export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: events.length,
      data: events,
    });
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch events.",
    });
  }
};

// Delete Event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found.",
      });
    }

    // Delete event
    await prisma.event.delete({
      where: { id },
    });

    // Notify the admin who deleted the event
    await createNotification({
      userId: req.user.id,
      message: `Event "${event.title}" was deleted.`,
      type: "EVENT_DELETED",
    });

    return res.status(200).json({
      status: "success",
      message: "Event deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to delete event.",
    });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      category,
      title,
      location,
      date,
      time,
      description,
      speaker,
      venue,
      attendees,
      agenda,
    } = req.body;

    // Find event
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found.",
      });
    }

    // Check ownership
    // --------------------------------
    // Image
    // --------------------------------

    let imageUrl = event.image;

    // Only upload if a new image was selected
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "leadership/events",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(req.file.buffer);
      });

      imageUrl = result.secure_url;
    }

    // --------------------------------
    // Agenda
    // --------------------------------

    let parsedAgenda = event.agenda;

    if (agenda !== undefined) {
      parsedAgenda = Array.isArray(agenda) ? agenda : JSON.parse(agenda);
    }

    // --------------------------------
    // Update event
    // --------------------------------

    const updatedEvent = await prisma.event.update({
      where: { id },

      data: {
        category: category ?? event.category,

        title: title ?? event.title,

        image: imageUrl,

        location: location ?? event.location,

        date: date ? new Date(date) : event.date,

        time: time ?? event.time,

        description: description ?? event.description,

        speaker: speaker ?? event.speaker,

        venue: venue ?? event.venue,

        attendees:
          attendees !== undefined ? Number(attendees) : event.attendees,

        agenda: parsedAgenda,
      },
    });

    await createNotification({
      userId: req.user.id,
      message: `Event "${updatedEvent.title}" has been updated.`,
      type: "EVENT_UPDATED",
    });

    return res.status(200).json({
      status: "success",
      message: "Event updated successfully.",
      data: updatedEvent,
    });
  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      return res.status(404).json({
        status: "fail",
        message: "Event not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: event,
    });
  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch event",
    });
  }
};

export const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({
        status: "error",
        message: "Event is not open for registration",
      });
    }

    // Prevent duplicate registration by the same email
    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_email: { eventId: id, email } },
    });

    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "This email address has already registered for this event",
      });
    }

    await prisma.eventRegistration.create({
      data: { eventId: id, name, email, phone: phone ?? null },
    });

    // Notify org of new registration
    await sendEmail({
      to: process.env.EVENT_REGISTRATION_EMAIL,
      subject: `New Event Registration - ${event.title}`,
      html: `
        <h2>New Event Registration</h2>
        <p><strong>Event:</strong> ${event.title}</p>
        <p><strong>Category:</strong> ${event.category}</p>
        <hr />
        <p><strong>Participant Name:</strong> ${name}</p>
        <p><strong>Participant Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
        <p>Someone has registered for this event through the Leadership Conference Forum website.</p>
      `,
    });

    // Confirmation email to the registrant
    const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await sendEmail({
      to: email,
      subject: `Registration Confirmed – ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1a1a2e;">
          <h2 style="color: #4a6cf7;">You're registered!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering for <strong>${event.title}</strong>. We look forward to seeing you there.</p>

          <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #eee; font-weight:600; width:120px;">Event</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${event.title}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #eee; font-weight:600;">Date</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${eventDate}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #eee; font-weight:600;">Time</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${event.time}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #eee; font-weight:600;">Venue</td><td style="padding:8px 0; border-bottom:1px solid #eee;">${event.venue}</td></tr>
            <tr><td style="padding:8px 0; font-weight:600;">Location</td><td style="padding:8px 0;">${event.location}</td></tr>
          </table>

          <p>If you have any questions, please reply to this email or contact us directly.</p>
          <p>Regards,<br/>Leadership Conference Forum</p>
        </div>
      `,
    });

    return res.status(200).json({
      status: "success",
      message: `You have successfully registered for ${event.title}`,
    });
  } catch (error) {
    console.error("EVENT REGISTRATION ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to process registration." });
  }
};

export const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, date: true, location: true },
    });

    if (!event) {
      return res
        .status(404)
        .json({ status: "error", message: "Event not found" });
    }

    const attendees = await prisma.eventRegistration.findMany({
      where: { eventId: id },
      orderBy: { registeredAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        registeredAt: true,
      },
    });

    return res.status(200).json({
      status: "success",
      event,
      total: attendees.length,
      attendees,
    });
  } catch (error) {
    console.error("GET ATTENDEES ERROR:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to fetch attendees." });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["PUBLISHED", "UNPUBLISHED"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid event status",
      });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status,
      },
    });

    return res.status(200).json({
      status: "success",
      message: `Event ${
        status === "PUBLISHED" ? "published" : "unpublished"
      } successfully`,
      data: updatedEvent,
    });
  } catch (error) {
    console.error("UPDATE EVENT STATUS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update event status.",
    });
  }
};

export const getPublicEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: events.length,
      data: events,
    });
  } catch (error) {
    console.error("GET PUBLIC EVENTS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch public events",
    });
  }
};
