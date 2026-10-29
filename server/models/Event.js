import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, maxlength: 3000 },
  category: { type: String, required: true, enum: ["Music", "Conference", "Food", "Sports", "Workshop", "Wedding", "Adventure", "Other"] },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  totalTickets: { type: Number, required: true, min: 1 },
  availableTickets: { type: Number, required: true, min: 0 },
  imageUrl: { type: String, default: "" },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Event", eventSchema);
