
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // pending = seats hold hain, payment baaki | expired = payment nahi hua, seats wapas
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "expired"],
      default: "confirmed",
    },

    paymentStatus: {
      type: String,
      enum: ["none", "pending", "paid", "failed"],
      default: "none",
    },
    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String },
    reservedUntil: { type: Date },
    // payment ho gaya par seats nahi bachi -> organizer/admin ko refund karna hoga
    refundRequired: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
