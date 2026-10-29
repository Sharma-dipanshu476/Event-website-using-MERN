import React from "react";
import { CalendarDays, MapPin, ArrowUpRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
const fallbackImages = {
  Music: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
  Conference: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
  Food: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
  Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80",
  Workshop: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  Adventure: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80"
};
export function eventImage(event) { return event.imageUrl || fallbackImages[event.category] || fallbackImages.Music; }
export function money(value) { return Number(value) === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value); }
export default function EventCard({ event }) {
  const date = new Date(event.date);
  return <article className="event-card">
    <Link className="event-image-wrap" to={`/events/${event._id}`}>
      <img className="event-image" src={eventImage(event)} alt={event.title} loading="lazy" />
      <span className="category-pill">{event.category}</span><span className="image-arrow"><ArrowUpRight size={18}/></span>
    </Link>
    <div className="event-card-body">
      <div className="event-date"><CalendarDays size={15}/>{date.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}{event.time ? ` · ${event.time}` : ""}</div>
      <Link to={`/events/${event._id}`} className="event-title"><h3>{event.title}</h3></Link>
      <p className="event-location"><MapPin size={15}/>{event.venue}, {event.city}</p>
      <div className="event-card-bottom"><strong>{money(event.price)}</strong><span className="seats-note">{event.availableTickets} tickets left</span></div>
    </div>
  </article>;
}
