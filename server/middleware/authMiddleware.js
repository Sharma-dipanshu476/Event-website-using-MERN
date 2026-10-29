import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please log in to continue." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Account no longer exists." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session is invalid or expired. Please log in again." });
  }
}

export function organizerOnly(req, res, next) {
  if (req.user?.role !== "organizer") return res.status(403).json({ message: "Organizer access required." });
  next();
}
