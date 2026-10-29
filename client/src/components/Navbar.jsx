import { CalendarDays, Compass, Ticket, PlusCircle, LogOut, UserRound, Menu, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import  React ,{ useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  function signOut() { logout(); setOpen(false); navigate("/"); }
  const close = () => setOpen(false);
  return <header className="navbar">
    <div className="nav-inner container">
      <Link className="brand" to="/" onClick={close}><span className="brand-mark"><CalendarDays size={22}/></span><span>Eventrix<small>Plan. Book. Experience.</small></span></Link>
      <button className="mobile-menu icon-button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
      <nav className={open ? "nav-links open" : "nav-links"}>
        <NavLink to="/" onClick={close}>Home</NavLink>
        <NavLink to="/events" onClick={close}><Compass size={16}/> Explore Events</NavLink>
        {user && <NavLink to="/my-bookings" onClick={close}><Ticket size={16}/> My Bookings</NavLink>}
        {user?.role === "organizer" && <NavLink to="/organizer/create" onClick={close}><PlusCircle size={16}/> Organise Event</NavLink>}
        {user ? <div className="nav-user"><span className="avatar">{user.name?.[0]?.toUpperCase()}</span><span className="nav-user-name">{user.name.split(" ")[0]}</span><button className="btn btn-outline btn-small" onClick={signOut}><LogOut size={15}/> Logout</button></div>
          : <div className="nav-auth"><Link className="btn btn-ghost btn-small" to="/login" onClick={close}>Log in</Link><Link className="btn btn-primary btn-small" to="/register" onClick={close}>Sign up</Link></div>}
      </nav>
    </div>
  </header>;
}
