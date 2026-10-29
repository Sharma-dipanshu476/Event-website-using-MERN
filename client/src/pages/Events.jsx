import React,{ useEffect, useState } from "react";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import EventCard from "../components/EventCard";

const categories = ["", "Music", "Conference", "Food", "Sports", "Workshop", "Wedding", "Adventure", "Other"];
export default function Events() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [city, setCity] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setSearch(params.get("search") || ""); setCategory(params.get("category") || ""); }, [params]);
  useEffect(() => {
    setLoading(true); setError("");
    api.get("/events", { params: { search: params.get("search") || "", category: params.get("category") || "", city } })
      .then(({data}) => setEvents(data.events)).catch(() => setError("Could not load events. Make sure the backend and database are running."))
      .finally(() => setLoading(false));
  }, [params, city]);
  function apply(e) { e.preventDefault(); setParams({ ...(search.trim() ? {search:search.trim()} : {}), ...(category ? {category} : {}) }); }
  function clear() { setSearch(""); setCategory(""); setCity(""); setParams({}); }
  return <main className="container page-section">
    <div className="page-heading"><span className="eyebrow">THE GOOD STUFF HAPPENS HERE</span><h1>Explore events</h1><p>Find something you love, meet your people, make a memory.</p></div>
    <form className="filter-bar" onSubmit={apply}><label className="search-field"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events or venues"/></label>
      <label className="select-field"><SlidersHorizontal size={17}/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.filter(Boolean).map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="search-field city-field"><MapPin size={18}/><input value={city} onChange={e=>setCity(e.target.value)} placeholder="City"/></label>
      <button className="btn btn-primary" type="submit">Search</button><button className="btn btn-ghost" type="button" onClick={clear}><X size={16}/> Clear</button>
    </form>
    <div className="results-line"><strong>{loading ? "Finding events…" : `${events.length} ${events.length === 1 ? "event" : "events"} found`}</strong><span>Plan something wonderful.</span></div>
    {error && <p className="notice notice-error">{error}</p>}
    {loading ? <div className="loading-grid">{[1,2,3,4].map(n=><div className="skeleton" key={n}/>)}</div> : events.length ? <div className="event-grid">{events.map(event=><EventCard key={event._id} event={event}/>)}</div> : <div className="empty-state"><Search size={32}/><h3>No events found</h3><p>Try another keyword, city or category.</p><button className="btn btn-outline" onClick={clear}>Clear filters</button></div>}
  </main>;
}
