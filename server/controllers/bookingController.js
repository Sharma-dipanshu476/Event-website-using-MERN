import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Event from "../models/Event.js";

const HOLD_MS = 15 * 60 * 1000; // payment ke liye seats 15 minute hold rehti hain

/* ---------- helpers ---------- */

function hmacHex(secret, data) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}
function safeEqualHex(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Razorpay Orders API (REST) - amount hamesha server pe event.price se banta hai, client se nahi
async function createRazorpayOrder({ amountPaise, receipt, notes }) {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error("Payment gateway is not configured."), { status: 503 });
  }
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Razorpay order error:", data?.error || response.status);
    throw Object.assign(new Error(data?.error?.description || "Could not start the payment."), { status: 502 });
  }
  return data;
}

// Pending booking ko release karo aur seats wapas do. Status-guarded hai, isliye dobara chalane pe double-restore nahi hota.
async function releaseBooking(filter) {
  const booking = await Booking.findOneAndUpdate(
    { ...filter, status: "pending" },
    { status: "expired", paymentStatus: "failed" },
    { new: true }
  );
  if (booking) await Event.updateOne({ _id: booking.event }, { $inc: { availableTickets: booking.quantity } });
  return booking;
}

export async function releaseExpiredBookings() {
  const stale = await Booking.find({ status: "pending", reservedUntil: { $lt: new Date() } }).select("_id").limit(200);
  for (const b of stale) await releaseBooking({ _id: b._id });
}

// Payment confirm hone par booking confirm karo. Client verify aur webhook dono yahi use karte hain (idempotent).
async function confirmPaidBooking(orderId, paymentId) {
  let booking = await Booking.findOneAndUpdate(
    { razorpayOrderId: orderId, status: "pending" },
    { status: "confirmed", paymentStatus: "paid", razorpayPaymentId: paymentId, $unset: { reservedUntil: "" } },
    { new: true }
  );
  if (booking) return { booking, ok: true };

  booking = await Booking.findOne({ razorpayOrderId: orderId });
  if (!booking) return { booking: null, ok: false };
  if (booking.status === "confirmed") return { booking, ok: true };

  // Hold expire ho chuka tha par paisa aa gaya: seats dobara lene ki koshish
  if (booking.status === "expired") {
    const seats = await Event.findOneAndUpdate(
      { _id: booking.event, availableTickets: { $gte: booking.quantity } },
      { $inc: { availableTickets: -booking.quantity } }
    );
    if (seats) {
      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id, status: "expired" },
        { status: "confirmed", paymentStatus: "paid", razorpayPaymentId: paymentId },
        { new: true }
      );
      if (updated) return { booking: updated, ok: true };
      await Event.updateOne({ _id: booking.event }, { $inc: { availableTickets: booking.quantity } });
      const current = await Booking.findById(booking._id);
      return { booking: current, ok: current?.status === "confirmed" };
    }
    // seats nahi bachi: paisa kat gaya hai, refund flag karo
    const flagged = await Booking.findOneAndUpdate(
      { _id: booking._id, status: "expired" },
      { status: "cancelled", paymentStatus: "paid", razorpayPaymentId: paymentId, refundRequired: true },
      { new: true }
    );
    return { booking: flagged || (await Booking.findById(booking._id)), ok: false, refund: true };
  }
  return { booking, ok: booking.status === "confirmed", refund: booking.refundRequired };
}

/* ---------- handlers ---------- */

export async function createBooking(req, res) {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ message: "Choose between 1 and 10 tickets." });
  if (!mongoose.isValidObjectId(req.body.eventId)) return res.status(400).json({ message: "Invalid event." });
  const session = await mongoose.startSession();
  let booking;
  let isFree = false;
  try {
    await session.withTransaction(async () => {
      const event = await Event.findOneAndUpdate(
        { _id: req.body.eventId, availableTickets: { $gte: quantity }, date: { $gte: new Date() } },
        { $inc: { availableTickets: -quantity } },
        { new: true, session }
      );
      if (!event) throw Object.assign(new Error("Event is unavailable or there are not enough tickets."), { status: 400 });
      isFree = Number(event.price) === 0;
      [booking] = await Booking.create([{
        user: req.user._id, event: event._id, quantity,
        totalAmount: event.price * quantity,
        bookingReference: `EVT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
        status: isFree ? "confirmed" : "pending",
        paymentStatus: isFree ? "none" : "pending",
        reservedUntil: isFree ? undefined : new Date(Date.now() + HOLD_MS),
      }], { session });
    });
  } catch (error) {
    await session.endSession();
    return res.status(error.status || 500).json({ message: error.message || "Booking failed. Please try again." });
  }
  await session.endSession();

  try {
    if (isFree) {
      const populated = await Booking.findById(booking._id).populate("event", "title date city venue");
      return res.status(201).json({ booking: populated });
    }
    const amountPaise = Math.round(booking.totalAmount * 100);
    const order = await createRazorpayOrder({
      amountPaise,
      receipt: booking.bookingReference,
      notes: { bookingId: String(booking._id), userId: String(req.user._id) },
    });
    await Booking.updateOne({ _id: booking._id }, { razorpayOrderId: order.id });
    res.status(201).json({
      booking: { _id: booking._id, bookingReference: booking.bookingReference, totalAmount: booking.totalAmount },
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    await releaseBooking({ _id: booking._id }); // order nahi bana to seats wapas
    res.status(error.status || 500).json({ message: error.message || "Could not start the payment." });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (![orderId, paymentId, signature].every((v) => typeof v === "string" && v)) {
      return res.status(400).json({ message: "Invalid payment details." });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: "Payment gateway is not configured." });
    const expected = hmacHex(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    if (!safeEqualHex(expected, signature)) return res.status(400).json({ message: "Payment verification failed." });

    const owned = await Booking.exists({ razorpayOrderId: orderId, user: req.user._id });
    if (!owned) return res.status(404).json({ message: "Booking not found." });

    const result = await confirmPaidBooking(orderId, paymentId);
    if (!result.ok) {
      return res.status(409).json({
        message: result.refund
          ? "Your payment was received but the tickets sold out meanwhile. A refund will be issued to your original payment method."
          : "Could not confirm this booking.",
      });
    }
    const populated = await Booking.findById(result.booking._id).populate("event", "title date city venue");
    res.json({ booking: populated });
  } catch (error) {
    console.error("verifyPayment failed:", error.message);
    res.status(500).json({ message: "Could not verify the payment." });
  }
}

// User ne Razorpay popup band kar diya -> seats turant wapas
export async function abandonBooking(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid booking." });
  await releaseBooking({ _id: req.params.id, user: req.user._id });
  res.json({ released: true });
}

// Razorpay webhook: browser band ho jaye tab bhi payment confirm ho jaye
export async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ message: "Webhook secret not configured." });
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const signature = req.headers["x-razorpay-signature"];
  if (!safeEqualHex(hmacHex(secret, raw), signature)) return res.status(400).json({ message: "Invalid signature." });
  try {
    const event = JSON.parse(raw.toString("utf8"));
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) await confirmPaidBooking(payment.order_id, payment.id);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.status(500).json({ message: "Webhook handling failed." });
  }
}

export async function myBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id, status: { $in: ["confirmed", "cancelled"] } })
    .populate("event", "title date time city venue imageUrl price")
    .sort({ createdAt: -1 });
  res.json({ bookings });
}
