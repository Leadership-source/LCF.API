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

    // Check ownership
    if (event.createdBy !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete this event.",
      });
    }
    await prisma.event.delete({
      where: { id },
    });

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
    if (event.createdBy !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update this event.",
      });
    }

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
    const { name, email } = req.body;

    // Validate registration details
    if (!name || !email) {
      return res.status(400).json({
        status: "error",
        message: "Name and email are required",
      });
    }

    // Find the event
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    // Send email to the organization
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

        <p>
          Someone has registered for this event through the
          Leadership Conference Forum website.
        </p>
      `,
    });

    return res.status(200).json({
      status: "success",
      message: `You have registered for ${event.title}`,
    });
  } catch (error) {
    console.error("EVENT REGISTRATION ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to process registration.",
    });
  }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PUBLISHED", "UNPUBLISHED"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid event status",
      });
    }

    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    if (event.createdBy !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update this event",
      });
    }

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
