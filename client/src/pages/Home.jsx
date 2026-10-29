import React from "react";
import { ArrowRight, CalendarDays, Search, Sparkles, Ticket, Users, Music2, BriefcaseBusiness, Utensils, Dumbbell, Palette, Mountain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import EventCard from "../components/EventCard";
import api from "../services/api";
import { useEffect } from "react";

const categories = [
  { name:"Music", icon:Music2, tint:"lavender" }, { name:"Conference", icon:BriefcaseBusiness, tint:"blue" },
  { name:"Food", icon:Utensils, tint:"peach" }, { name:"Sports", icon:Dumbbell, tint:"mint" },
  { name:"Workshop", icon:Palette, tint:"pink" }, { name:"Adventure", icon:Mountain, tint:"yellow" }
];
export default function Home() {
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => { api.get("/events").then(({data}) => setEvents(data.events.slice(0, 4))).catch(() => setError("Could not load events. Check that the backend is running.")); }, []);
  function submitSearch(e) { e.preventDefault(); navigate(`/events${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ""}`); }
  return <>
    <section className="hero"><div className="hero-image"></div><div className="hero-content container">
      <span className="eyebrow hero-eyebrow"><Sparkles size={15}/> YOUR NEXT GREAT MEMORY STARTS HERE</span>
      <h1>Make every moment<br/><span>an event to remember.</span></h1>
      <p>Find your people. Discover your passion. Book experiences that stay with you long after the lights go down.</p>
      <form className="hero-search" onSubmit={submitSearch}><Search size={20}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search concerts, workshops, food fests…"/><button className="btn btn-primary" type="submit">Find events <ArrowRight size={17}/></button></form>
      <div className="hero-social-proof"><div className="avatar-stack"><span>R</span><span>A</span><span>M</span><span>+</span></div><span><strong>Discover something new</strong><small>Events for every kind of curious</small></span></div>
    </div><div className="hero-bottom container"><span><CalendarDays size={16}/> Events worth leaving home for</span><span><Ticket size={16}/> Simple, secure booking</span><span><Users size={16}/> Find your community</span></div></section>
    <section className="section container"><div className="section-heading"><div><span className="eyebrow">FIND YOUR VIBE</span><h2>Explore by category</h2><p>Whatever you love, there's a gathering for it.</p></div><Link className="text-link" to="/events">All events <ArrowRight size={17}/></Link></div>
      <div className="category-grid">{categories.map(({name,icon:Icon,tint})=><Link key={name} to={`/events?category=${name}`} className="category-card"><span className={`category-icon ${tint}`}><Icon size={23}/></span><span>{name}</span><ArrowRight className="category-arrow" size={16}/></Link>)}</div>
    </section>
    <section className="section section-soft"><div className="container"><div className="section-heading"><div><span className="eyebrow">HANDPICKED FOR YOU</span><h2>Events to get excited about</h2><p>Find your next favourite memory.</p></div><Link className="text-link" to="/events">Explore all events <ArrowRight size={17}/></Link></div>
      {error && <p className="notice notice-error">{error}</p>}
      {events.length ? <div className="event-grid">{events.map(event=><EventCard key={event._id} event={event}/>)}</div> : !error ? <div className="empty-state"><CalendarDays size={32}/><h3>Your next adventure is being planned</h3><p>New events will appear here soon. Check back shortly.</p><Link to="/events" className="btn btn-outline">Explore events</Link></div> : null}
    </div></section>
    <section className="organizer-cta container"><div className="cta-art"><span className="cta-orbit orbit-one"></span><span className="cta-orbit orbit-two"></span><CalendarDays size={70}/><Sparkles className="cta-sparkle"/></div><div className="cta-copy"><span className="eyebrow">HAVE SOMETHING TO CELEBRATE?</span><h2>Your event deserves<br/>a great audience.</h2><p>Create an event, reach people who care, and manage everything in one simple place.</p><Link to="/register" className="btn btn-primary">Become an organiser <ArrowRight size={17}/></Link></div></section>
  </>;
}
