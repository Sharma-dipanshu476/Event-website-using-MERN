import React from "react";
import { CalendarDays, Heart } from "lucide-react";
import { Link } from "react-router-dom";
export default function Footer() {
  return <footer className="footer"><div className="container footer-inner">
    <Link className="brand footer-brand" to="/"><span className="brand-mark"><CalendarDays size={20}/></span><span>Eventrix<small>Plan. Book. Experience.</small></span></Link>
    <p>Discover moments worth remembering.</p><span className="footer-credit">Made with <Heart size={14}/> for event lovers · © {new Date().getFullYear()} Eventrix</span>
  </div></footer>;
}

