import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Ticket, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { eventImage, money } from "../components/EventCard";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api.get("/bookings/my").then(({ data }) => setBookings(data.bookings)).catch(e => setError(e.response?.data?.message || "Could not load bookings.")).finally(() => setLoading(false)); }, []);
  return <main className="container page-section"><div className="page-heading left-heading"><span className="eyebrow">YOUR PLANS, ALL IN ONE PLACE</span><h1>My bookings</h1><p>Your upcoming experiences and ticket details.</p></div>
    {error && <p className="notice notice-error">{error}</p>}{loading ? <div className="page-state">Loading bookings…</div> : bookings.length ? <div className="booking-list">{bookings.map(b => <article className="booking-list-card" key={b._id}><img src={eventImage(b.event || {})} alt={b.event?.title || "Event"} /><div className="booking-list-main"><span className={`status-pill ${b.status === "confirmed" ? "status-confirmed" : "status-cancelled"}`}>{b.status}</span><h3>{b.event?.title || "Event removed"}</h3><p><CalendarDays size={15} />{b.event?.date ? new Date(b.event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}</p><p><MapPin size={15} />{b.event?.venue}, {b.event?.city}</p><small>Reference: {b.bookingReference}</small>{b.refundRequired && <p className="notice notice-warn">Tickets sold out before your payment was confirmed. A refund will be issued to your original payment method.</p>}</div><div className="booking-list-side"><strong>{money(b.totalAmount)}</strong><span><Ticket size={14} />{b.quantity} ticket(s)</span>{b.event ? <Link to={`/events/${b.event._id}`} className="text-link">Event details <ArrowUpRight size={15} /></Link> : null}</div></article>)}</div> : <div className="empty-state"><Ticket size={35} /><h3>No bookings yet</h3><p>Once you book an event, your ticket details will show up here.</p><Link to="/events" className="btn btn-primary">Explore events</Link></div>}
  </main>;
}
