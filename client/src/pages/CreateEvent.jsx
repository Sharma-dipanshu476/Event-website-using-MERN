import React,{ useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, ImagePlus, MapPin, Ticket } from "lucide-react";
import api from "../services/api";

const initial = {title:"",description:"",category:"Music",date:"",time:"",venue:"",city:"",price:0,totalTickets:100,imageUrl:""};
export default function CreateEvent() {
  const [form,setForm] = useState(initial); const [error,setError] = useState(""); const [busy,setBusy] = useState(false); const navigate=useNavigate();
  function change(e) { setForm({...form,[e.target.name]:e.target.type==="number"?Number(e.target.value):e.target.value}); }
  async function submit(e) { e.preventDefault(); setError(""); setBusy(true); try { const {data}=await api.post("/events",form); navigate(`/events/${data.event._id}`); } catch(err) { setError(err.response?.data?.message || "Could not create event."); } finally { setBusy(false); } }
  return <main className="container page-section narrow-page"><button className="back-link" onClick={()=>navigate(-1)}><ArrowLeft size={16}/> Back</button><div className="page-heading left-heading"><span className="eyebrow">BRING PEOPLE TOGETHER</span><h1>Create an event</h1><p>Share the details and give people something to look forward to.</p></div>
    <form className="panel form-stack event-form" onSubmit={submit}>{error&&<p className="notice notice-error">{error}</p>}
      <div className="form-section-title"><CalendarDays/><div><h3>Event details</h3><p>Start with the basics.</p></div></div>
      <label className="form-label">Event title *<input className="plain-input" name="title" required maxLength="120" value={form.title} onChange={change} placeholder="e.g. Indie Music Night"/></label>
      <label className="form-label">Description *<textarea className="plain-input textarea" name="description" required maxLength="3000" value={form.description} onChange={change} placeholder="What makes this event special?" rows="5"/></label>
      <div className="form-two-col"><label className="form-label">Category *<select className="plain-input" name="category" value={form.category} onChange={change}>{["Music","Conference","Food","Sports","Workshop","Wedding","Adventure","Other"].map(c=><option key={c}>{c}</option>)}</select></label><label className="form-label">Event image URL (optional)<div className="input-wrap"><ImagePlus size={18}/><input name="imageUrl" type="url" value={form.imageUrl} onChange={change} placeholder="https://…"/></div></label></div>
      <div className="form-section-title"><MapPin/><div><h3>When & where</h3><p>Help guests find you.</p></div></div>
      <div className="form-two-col"><label className="form-label">Date *<input className="plain-input" type="date" name="date" min={new Date().toISOString().slice(0,10)} required value={form.date} onChange={change}/></label><label className="form-label">Start time *<input className="plain-input" type="time" name="time" required value={form.time} onChange={change}/></label></div>
      <div className="form-two-col"><label className="form-label">Venue *<input className="plain-input" name="venue" required value={form.venue} onChange={change} placeholder="Venue or hall name"/></label><label className="form-label">City *<input className="plain-input" name="city" required value={form.city} onChange={change} placeholder="e.g. Chandigarh"/></label></div>
      <div className="form-section-title"><Ticket/><div><h3>Tickets</h3><p>Set a price and capacity.</p></div></div>
      <div className="form-two-col"><label className="form-label">Ticket price (₹) *<input className="plain-input" type="number" name="price" min="0" required value={form.price} onChange={change}/></label><label className="form-label">Total tickets *<input className="plain-input" type="number" name="totalTickets" min="1" max="100000" required value={form.totalTickets} onChange={change}/></label></div>
      <div className="form-actions"><button type="button" className="btn btn-outline" onClick={()=>navigate(-1)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy?"Publishing…":"Publish event"}</button></div>
    </form>
  </main>;
}
