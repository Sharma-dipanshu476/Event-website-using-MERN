import React,{ useEffect, useState } from "react";
import { CalendarDays, Ticket, IndianRupee, PlusCircle, ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { eventImage, money } from "../components/EventCard";

export default function Dashboard() {
  const [events,setEvents] = useState([]); const [bookings,setBookings] = useState([]); const [error,setError] = useState("");
  useEffect(() => { Promise.all([api.get("/events"),api.get("/bookings/my")]).then(([e,b])=>{setEvents(e.data.events);setBookings(b.data.bookings);}).catch(()=>setError("Some dashboard data could not load.")); }, []);
  const totalBookings = bookings.length;
  const revenue = bookings.filter(b=>b.status==="confirmed").reduce((sum,b)=>sum+b.totalAmount,0);
  return <main className="container page-section"><div className="dashboard-heading"><div><span className="eyebrow">YOUR EVENT SPACE</span><h1>Organizer dashboard</h1><p>Everything you need to bring your next idea to life.</p></div><Link className="btn btn-primary" to="/organizer/create"><PlusCircle size={17}/> Create event</Link></div>
    {error&&<p className="notice notice-error">{error}</p>}
    <div className="stats-grid"><div className="stat-card"><span className="stat-icon lavender"><CalendarDays/></span><span className="stat-label">Events listed</span><strong>{events.length}</strong><small>Events currently visible</small></div><div className="stat-card"><span className="stat-icon blue"><Ticket/></span><span className="stat-label">My bookings</span><strong>{totalBookings}</strong><small>Bookings on this account</small></div><div className="stat-card"><span className="stat-icon mint"><IndianRupee/></span><span className="stat-label">Booking value</span><strong>{money(revenue)}</strong><small>Value of your confirmed bookings</small></div></div>
    <div className="dashboard-section-heading"><div><h2>Discover events</h2><p>Events available on Eventrix.</p></div><Link to="/events" className="text-link">Browse all <ArrowUpRight size={16}/></Link></div>
    {events.length?<div className="event-grid">{events.slice(0,6).map(event=><article className="mini-event panel" key={event._id}><img src={eventImage(event)} alt={event.title}/><div><strong>{event.title}</strong><small><MapPin size={13}/>{event.city}</small><span>{money(event.price)}</span></div><Link to={`/events/${event._id}`} className="btn btn-outline btn-small">View</Link></article>)}</div>:<div className="empty-state"><CalendarDays/><h3>No events listed yet</h3><p>Publish your first event to get started.</p><Link to="/organizer/create" className="btn btn-primary">Create event</Link></div>}
    <p className="dashboard-note">Note: this starter dashboard shows platform-wide events and the signed-in account's bookings. A production organiser dashboard should use dedicated APIs that return only events owned by that organiser and their attendee records.</p>
  </main>;
}
