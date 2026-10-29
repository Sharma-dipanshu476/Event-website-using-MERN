import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { razorpayWebhook, releaseExpiredBookings } from "./controllers/bookingController.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
// Razorpay webhook ko raw body chahiye (signature check ke liye), isliye express.json se PEHLE
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Eventrix API" }));
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  // jin bookings ka payment 15 min me nahi hua, unki seats wapas release karo
  setInterval(() => releaseExpiredBookings().catch((e) => console.error("Release failed:", e.message)), 60 * 1000);
  app.listen(PORT, () => console.log(`Eventrix API running on port ${PORT}`));
});
