import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import CreateEvent from "./pages/CreateEvent";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

export default function App() {
  return <><Navbar/><Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/events" element={<Events/>}/>
    <Route path="/events/:id" element={<EventDetails/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route path="/verify-otp" element={<VerifyOtp/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route path="/my-bookings" element={<MyBookings/>}/>
    </Route>
    <Route element={<ProtectedRoute role="organizer"/>}>
      <Route path="/organizer/create" element={<CreateEvent/>}/>
      <Route path="/organizer/dashboard" element={<Dashboard/>}/>
    </Route>
    <Route path="*" element={<NotFound/>}/>
  </Routes><Footer/></>;
}
