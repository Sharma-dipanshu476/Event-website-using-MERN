import { createContext, useContext, useEffect, useState } from "react";
import React from "react";
import api from "../services/api";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("eventrix_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem("eventrix_token"))
      .finally(() => setLoading(false));
  }, []);

  // Server OTP maange to data wapas do (user abhi login nahi), warna token save karke login karo
  function finishAuth(data) {
    if (data.twoFactorRequired) return data;
    localStorage.setItem("eventrix_token", data.token);
    setUser(data.user);
    return { user: data.user };
  }
  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    return finishAuth(data);
  }
  async function register(details) {
    const { data } = await api.post("/auth/register", details);
    return finishAuth(data);
  }
  async function verifyOtp(email, otp) {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    return finishAuth(data).user;
  }
  async function resendOtp(email) {
    const { data } = await api.post("/auth/resend-otp", { email });
    return data;
  }
  function logout() {
    localStorage.removeItem("eventrix_token");
    setUser(null);
  }
  return <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
