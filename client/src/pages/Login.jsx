import React,{ useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Eye, EyeOff, Mail, LockKeyhole, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [form, setForm] = useState({email:"",password:""}); const [show, setShow] = useState(false); const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  function change(e) { setForm({...form,[e.target.name]:e.target.value}); }
  async function submit(e) { e.preventDefault(); setError(""); setBusy(true); try { const res=await login(form); if(res.twoFactorRequired){ navigate("/verify-otp",{state:{email:res.email,purpose:res.purpose,from:location.state?.from}}); return; } navigate(location.state?.from || (res.user.role==="organizer" ? "/organizer/dashboard" : "/events"), {replace:true}); } catch(err) { setError(err.response?.data?.message || "Could not log in. Check your connection."); } finally { setBusy(false); } }
  return <main className="auth-page"><div className="auth-shell"><aside className="auth-art"><Link className="auth-brand" to="/"><span className="brand-mark"><CalendarDays/></span>Eventrix</Link><div className="auth-art-copy"><span className="eyebrow"><Sparkles size={14}/> YOUR NEXT CHAPTER</span><h1>Good times<br/>start <em>here.</em></h1><p>Come back to the moments, people and experiences that make life feel a little bigger.</p></div><div className="auth-art-bottom"><span>✦ Discover</span><span>✦ Connect</span><span>✦ Celebrate</span></div></aside>
    <section className="auth-form-side"><div className="auth-form-wrap"><span className="eyebrow">WELCOME BACK</span><h2>Log in to Eventrix</h2><p className="muted">Your next great experience is just around the corner.</p>
      {error && <p className="notice notice-error">{error}</p>}
      <form className="form-stack" onSubmit={submit}><label className="form-label">Email address<div className="input-wrap"><Mail size={18}/><input type="email" name="email" autoComplete="email" required value={form.email} onChange={change} placeholder="you@example.com"/></div></label>
        <label className="form-label">Password<div className="input-wrap"><LockKeyhole size={18}/><input type={show?"text":"password"} name="password" autoComplete="current-password" required value={form.password} onChange={change} placeholder="Enter your password"/><button type="button" className="input-action" aria-label="Toggle password visibility" onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
        <div className="form-options"><label className="check-label"><input type="checkbox"/> Remember me on this device</label><span className="muted small-text">Forgot password? Add later</span></div>
        <button className="btn btn-primary btn-full btn-tall" disabled={busy}>{busy?"Logging in…":"Log in"} <ArrowRight size={17}/></button>
      </form><div className="auth-divider"><span>NEW TO EVENTORA?</span></div><p className="auth-switch">Create an account to start discovering <Link to="/register">Sign up <ArrowRight size={15}/></Link></p><p className="auth-legal">By continuing, you agree to use Eventrix respectfully. We will email you a one-time code to confirm it is you.</p>
    </div></section></div></main>;
}
