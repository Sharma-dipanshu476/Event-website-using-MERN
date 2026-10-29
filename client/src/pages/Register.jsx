import React,{ useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Eye, EyeOff, UserRound, Mail, LockKeyhole, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [form,setForm] = useState({name:"",email:"",password:"",confirmPassword:"",role:"user"});
  const [show,setShow] = useState(false); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  function change(e) { setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e) { e.preventDefault(); setError(""); if(form.password!==form.confirmPassword){setError("Passwords do not match.");return;} setBusy(true); try { const res=await register({name:form.name,email:form.email,password:form.password,role:form.role}); navigate("/verify-otp",{state:{email:res.email,purpose:res.purpose}}); } catch(err) { setError(err.response?.data?.message || "Could not create account."); } finally { setBusy(false); } }
  return <main className="auth-page"><div className="auth-shell"><aside className="auth-art register-art"><Link className="auth-brand" to="/"><span className="brand-mark"><CalendarDays/></span>Eventrix</Link><div className="auth-art-copy"><span className="eyebrow"><Sparkles size={14}/> MAKE ROOM FOR MORE</span><h1>Life's better<br/>when we <em>gather.</em></h1><p>Discover new interests, meet your people and create the moments you'll talk about for years.</p></div><div className="auth-art-bottom"><span>✦ Discover</span><span>✦ Connect</span><span>✦ Celebrate</span></div></aside>
    <section className="auth-form-side"><div className="auth-form-wrap"><span className="eyebrow">JOIN THE COMMUNITY</span><h2>Create your account</h2><p className="muted">It takes a minute. The memories last much longer.</p>
      {error && <p className="notice notice-error">{error}</p>}
      <form className="form-stack" onSubmit={submit}><label className="form-label">Full name<div className="input-wrap"><UserRound size={18}/><input name="name" autoComplete="name" required minLength="2" maxLength="80" value={form.name} onChange={change} placeholder="Your full name"/></div></label>
        <label className="form-label">Email address<div className="input-wrap"><Mail size={18}/><input type="email" name="email" autoComplete="email" required value={form.email} onChange={change} placeholder="you@example.com"/></div></label>
        <label className="form-label">Password<div className="input-wrap"><LockKeyhole size={18}/><input type={show?"text":"password"} name="password" autoComplete="new-password" required minLength="8" value={form.password} onChange={change} placeholder="At least 8 characters"/><button type="button" className="input-action" aria-label="Toggle password visibility" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><small className="field-hint">Use at least 8 characters, including a letter and a number.</small></label>
        <label className="form-label">I want to<div className="role-options"><label className={form.role==="user"?"role-option selected":"role-option"}><input type="radio" name="role" value="user" checked={form.role==="user"} onChange={change}/><span><strong>Attend events</strong><small>Discover and book tickets</small></span></label><label className={form.role==="organizer"?"role-option selected":"role-option"}><input type="radio" name="role" value="organizer" checked={form.role==="organizer"} onChange={change}/><span><strong>Organise events</strong><small>Create and manage events</small></span></label></div></label>
        <label className="form-label">Confirm password<div className="input-wrap"><LockKeyhole size={18}/><input type={show?"text":"password"} name="confirmPassword" autoComplete="new-password" required value={form.confirmPassword} onChange={change} placeholder="Enter password again"/></div></label>
        <button className="btn btn-primary btn-full btn-tall" disabled={busy}>{busy?"Creating account…":"Create account"} <ArrowRight size={17}/></button>
      </form><p className="auth-switch">Already have an account? <Link to="/login">Log in <ArrowRight size={15}/></Link></p><p className="auth-legal">Student project note: organizer role selection is for demo purposes. Real services should verify organizer accounts.</p>
    </div></section></div></main>;
}
