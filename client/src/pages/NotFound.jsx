import React from "react";
import { Compass, Home } from "lucide-react";
import { Link } from "react-router-dom";
export default function NotFound() { return <main className="not-found container"><div className="not-found-art"><Compass size={76}/><span>404</span></div><span className="eyebrow">A LITTLE OFF THE MAP</span><h1>This page missed the invite.</h1><p>The page you're looking for doesn't exist or may have moved.</p><Link className="btn btn-primary" to="/"><Home size={17}/> Back to home</Link></main>; }
