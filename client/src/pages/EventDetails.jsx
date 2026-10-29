import React,{ useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock3, MapPin, Users, Ticket, ShieldCheck, Minus, Plus, ArrowLeft } from "lucide-react";
import api from "../services/api";
import { eventImage, money } from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api.get(`/events/${id}`).then(({data})=>setEvent(data.event)).catch(e=>setError(e.response?.data?.message || "Event not found.")).finally(()=>setLoading(false)); }, [id]);
  function confirmed(booking) {
    setMessage(`Booking confirmed! Reference: ${booking.bookingReference}`);
    setEvent(prev => ({ ...prev, availableTickets: prev.availableTickets - quantity }));
  }
  async function book() {
    if (!user) return navigate("/login", { state: { from: `/events/${id}` } });
    setBusy(true); setMessage(""); setError("");
    try {
      const { data } = await api.post("/bookings", { eventId: id, quantity });
      if (!data.order) { confirmed(data.booking); setBusy(false); return; } // free event
      const ready = await loadRazorpay();
      if (!ready) {
        await api.post(`/bookings/${data.booking._id}/abandon`).catch(() => {});
        setError("Could not load the payment window. Check your connection and try again.");
        setBusy(false); return;
      }
      let paid = false;
      const rzp = new window.Razorpay({
        key: data.keyId, order_id: data.order.id, amount: data.order.amount, currency: data.order.currency,
        name: "Eventrix", description: `${quantity} x ${event.title}`,
        prefill: { name: user.name, email: user.email }, theme: { color: "#6c4cf1" },
        handler: async (resp) => {
          paid = true;
          try {
            const verified = await api.post("/bookings/verify-payment", resp);
            confirmed(verified.data.booking);
          } catch (e) { setError(e.response?.data?.message || "Payment received but we could not confirm it. Please check My Bookings."); }
          finally { setBusy(false); }
        },
        modal: { ondismiss: () => {
          if (paid) return;
          api.post(`/bookings/${data.booking._id}/abandon`).catch(() => {});
          setError("Payment cancelled. No money was taken."); setBusy(false);
        } },
      });
      rzp.on("payment.failed", (r) => setError(r.error?.description || "Payment failed. You can try again."));
      rzp.open();
    } catch (e) { setError(e.response?.data?.message || "Booking failed."); setBusy(false); }
  }
  if (loading) return <div className="page-state">Loading event…</div>;
  if (!event) return <main className="container page-section"><div className="empty-state"><h2>Event not found</h2><p>{error}</p><button className="btn btn-primary" onClick={()=>navigate("/events")}>Back to events</button></div></main>;
  const date = new Date(event.date);
  return <main className="container page-section">
    <button className="back-link" onClick={()=>navigate(-1)}><ArrowLeft size={16}/> Back to events</button>
    <div className="detail-hero"><img src={eventImage(event)} alt={event.title}/><div className="detail-hero-overlay"><span className="category-pill">{event.category}</span><h1>{event.title}</h1><div className="detail-hero-meta"><span><CalendarDays size={16}/>{date.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"long",year:"numeric"})}</span><span><MapPin size={16}/>{event.city}</span></div></div></div>
    <div className="detail-layout"><section className="detail-main"><span className="eyebrow">ABOUT THIS EVENT</span><h2>Get ready for something special.</h2><p className="detail-description">{event.description}</p>
      <div className="detail-info-grid"><div className="info-tile"><CalendarDays/><div><small>DATE</small><strong>{date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</strong></div></div><div className="info-tile"><Clock3/><div><small>TIME</small><strong>{event.time}</strong></div></div><div className="info-tile"><MapPin/><div><small>VENUE</small><strong>{event.venue}, {event.city}</strong></div></div><div className="info-tile"><Users/><div><small>ORGANISED BY</small><strong>{event.organizer?.name || "Eventrix organiser"}</strong></div></div></div>
      <div className="notice notice-info"><ShieldCheck size={18}/> Payments are processed securely by Razorpay (UPI, cards, netbanking, wallets). Seats are held for 15 minutes while you pay.</div>
    </section><aside className="booking-card"><span className="eyebrow">SAVE YOUR SPOT</span><h2>{money(event.price)} <small>/ ticket</small></h2><p className="seats-available">{event.availableTickets} tickets available</p><div className="quantity-row"><span><Ticket size={17}/> Tickets</span><div className="quantity-control"><button disabled={quantity<=1} onClick={()=>setQuantity(q=>q-1)} aria-label="Remove one ticket"><Minus size={15}/></button><strong>{quantity}</strong><button disabled={quantity>=10 || quantity>=event.availableTickets} onClick={()=>setQuantity(q=>q+1)} aria-label="Add one ticket"><Plus size={15}/></button></div></div><div className="total-row"><span>Total</span><strong>{money(event.price*quantity)}</strong></div>
      {message && <p className="notice notice-success">{message} <button className="inline-link" onClick={()=>navigate("/my-bookings")}>View bookings</button></p>}{error && <p className="notice notice-error">{error}</p>}
      <button className="btn btn-primary btn-full" disabled={busy || event.availableTickets<1 || Boolean(message)} onClick={book}>{busy ? (event.price>0 ? "Processing payment…" : "Booking…") : event.availableTickets<1 ? "Sold out" : message ? "Booked successfully" : user ? (event.price>0 ? `Pay ${money(event.price*quantity)}` : "Confirm booking") : "Log in to book"}</button><p className="fine-print"><ShieldCheck size={14}/> {event.price>0 ? "Secure payment by Razorpay." : "This event is free. No payment needed."}</p>
    </aside></div>
  </main>;
}
