import Event from "../models/Event.js";
import Booking from "../models/Booking.js";

const fields = ["title", "description", "category", "date", "time", "venue", "city", "price", "totalTickets", "imageUrl"];

function validateEvent(body) {
  for (const key of ["title", "description", "category", "date", "time", "venue", "city"]) {
    if (!String(body[key] ?? "").trim()) return `${key} is required.`;
  }
  if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) return "Price must be zero or more.";
  if (!Number.isInteger(Number(body.totalTickets)) || Number(body.totalTickets) < 1) return "Total tickets must be at least 1.";
  if (new Date(body.date) < new Date(new Date().toDateString())) return "Event date cannot be in the past.";
  return null;
}

export async function listEvents(req, res) {
  try {
    const { search = "", category = "", city = "" } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { venue: { $regex: search, $options: "i" } }
    ];
    if (category) filter.category = category;
    if (city) filter.city = { $regex: city, $options: "i" };
    const events = await Event.find(filter).populate("organizer", "name").sort({ date: 1 }).limit(100);
    res.json({ events });
  } catch { res.status(500).json({ message: "Could not load events." }); }
}

export async function getEvent(req, res) {
  const event = await Event.findById(req.params.id).populate("organizer", "name");
  if (!event) return res.status(404).json({ message: "Event not found." });
  res.json({ event });
}

export async function createEvent(req, res) {
  const error = validateEvent(req.body);
  if (error) return res.status(400).json({ message: error });
  const data = Object.fromEntries(fields.filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
  const event = await Event.create({ ...data, availableTickets: Number(data.totalTickets), totalTickets: Number(data.totalTickets), price: Number(data.price), organizer: req.user._id });
  res.status(201).json({ event });
}

export async function updateEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (String(event.organizer) !== String(req.user._id)) return res.status(403).json({ message: "You can only edit your own events." });
  if (Number(event.totalTickets) - Number(event.availableTickets) > Number(req.body.totalTickets ?? event.totalTickets)) {
    return res.status(400).json({ message: "Total tickets cannot be lower than tickets already booked." });
  }
  const error = validateEvent({ ...event.toObject(), ...req.body });
  if (error) return res.status(400).json({ message: error });
  fields.forEach(k => { if (req.body[k] !== undefined) event[k] = req.body[k]; });
  if (req.body.totalTickets !== undefined) {
    const booked = event.totalTickets - event.availableTickets;
    event.totalTickets = Number(req.body.totalTickets);
    event.availableTickets = event.totalTickets - booked;
  }
  await event.save();
  res.json({ event });
}

export async function deleteEvent(req, res) {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found." });
  if (String(event.organizer) !== String(req.user._id)) return res.status(403).json({ message: "You can only delete your own events." });
  const bookings = await Booking.countDocuments({ event: event._id, status: { $in: ["confirmed", "pending"] } });
  if (bookings) return res.status(400).json({ message: "This event has bookings. Keep it listed or implement a cancellation workflow first." });
  await event.deleteOne();
  res.json({ message: "Event deleted." });
}
