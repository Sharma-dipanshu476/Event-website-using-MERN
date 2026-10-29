import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, MailCheck, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const RESEND_SECONDS = 60;

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email, purpose, from } = state || {};
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!email) return <Navigate to="/login" replace />;
  const verifying = purpose === "verify";

  async function submit(e) {
    e.preventDefault(); setError(""); setInfo("");
    if (!/^\d{6}$/.test(otp)) { setError("Enter the 6-digit code."); return; }
    setBusy(true);
    try {
      const user = await verifyOtp(email, otp);
      navigate(from || (user.role === "organizer" ? "/organizer/dashboard" : "/events"), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not verify the code. Check your connection.");
    } finally { setBusy(false); }
  }

  async function resend() {
    setError(""); setInfo("");
    try {
      const data = await resendOtp(email);
      setInfo(data.message); setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend the code.");
    }
  }

  return <main className="auth-page"><div className="auth-shell"><aside className="auth-art"><Link className="auth-brand" to="/"><span className="brand-mark"><CalendarDays/></span>Eventrix</Link><div className="auth-art-copy"><span className="eyebrow"><Sparkles size={14}/> ALMOST THERE</span><h1>One quick<br/><em>check.</em></h1><p>We sent a one-time code to your email so we know it is really you.</p></div><div className="auth-art-bottom"><span>✦ Discover</span><span>✦ Connect</span><span>✦ Celebrate</span></div></aside>
    <section className="auth-form-side"><div className="auth-form-wrap"><span className="eyebrow">{verifying ? "VERIFY YOUR EMAIL" : "TWO-STEP LOGIN"}</span><h2>Enter your code</h2>
      <p className="muted">We emailed a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
      {error && <p className="notice notice-error">{error}</p>}{info && <p className="notice notice-success">{info}</p>}
      <form className="form-stack" onSubmit={submit}>
        <label className="form-label">6-digit code<div className="input-wrap"><MailCheck size={18}/><input className="otp-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••"/></div></label>
        <button className="btn btn-primary btn-full btn-tall" disabled={busy || otp.length !== 6}>{busy ? "Verifying…" : verifying ? "Verify & continue" : "Log in"} <ArrowRight size={17}/></button>
      </form>
      <p className="auth-switch">Did not get it? <button type="button" className="inline-link resend-btn" disabled={cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button></p>
      <p className="auth-switch"><Link to="/login">Back to log in</Link></p>
    </div></section></div></main>;
}
