import cors from "cors";
import "dotenv/config";
import express from "express";
import leaderRoute from "./routes/leaderRoute.js";
import authRoute from "./routes/authRoute.js";
import teamRoute from "./routes/teamRoutes.js";
import eventRoute from "./routes/eventRoute.js";
import contactRoutes from "./routes/contactRoute.js";
import notificationRoute from "./routes/notificationRoutes.js";
import adminRoute from "./routes/adminRoute.js";
import cookieParser from "cookie-parser";
import testimonialRoutes from "./routes/testimonialRoute.js";
import newsRoutes from "./routes/newsRoute.js";

import { connectDB, disconnectDB } from "./config/db.js";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/testimonials", testimonialRoutes);

app.use("/", leaderRoute);
app.use("/auth", authRoute);
app.use("/teams", teamRoute);
app.use("/events", eventRoute);
app.use("/notifications", notificationRoute);
app.use("/contact", contactRoutes);
app.use("/admin", adminRoute);
app.use("/news", newsRoutes);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

//http://localhost:3000

//Handle unhandled promise rejections (e.g database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

//handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);

  await disconnectDB();
  process.exit(1);
});

//graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gradually");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

// process.env.CORS_ORIGIN || "http://localhost:5173"
