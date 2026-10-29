import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const OTP_TTL = 10 * 60 * 1000;   // 10 minute
const RESEND_WAIT = 60 * 1000;    // 60 second
const MAX_ATTEMPTS = 5;

function makeToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}
function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}
const hashOtp = (otp) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET).update(String(otp)).digest("hex");

async function sendOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000));
  await User.updateOne(
    { _id: user._id },
    { otpHash: hashOtp(otp), otpExpires: new Date(Date.now() + OTP_TTL), otpAttempts: 0 }
  );
  const verifying = user.emailVerified === false;
  await sendEmail({
    to: user.email,
    subject: verifying ? "Verify your Eventrix email" : "Your Eventrix login code",
    html: `<h2>Hi ${user.name},</h2>
           <p>${verifying ? "Use this code to verify your email and activate your Eventrix account:" : "Use this code to finish logging in to Eventrix:"}</p>
           <p style="font-size:32px;letter-spacing:8px;font-weight:bold">${otp}</p>
           <p>This code expires in 10 minutes. ${verifying ? "If you did not sign up, you can ignore this email." : "If this was not you, please change your password."}</p>`
  });
}
const purposeOf = (user) => (user.emailVerified === false ? "verify" : "login");

export async function register(req, res) {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (!/^[A-Za-z][A-Za-z .'-]{1,79}$/.test(name.trim())) return res.status(400).json({ message: "Enter a valid name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return res.status(400).json({ message: "Password must contain at least one letter and one number." });
    if (!["user", "organizer"].includes(role)) return res.status(400).json({ message: "Invalid account role." });
    const cleanEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 12);
    let user = await User.findOne({ email: cleanEmail });
    if (user && user.emailVerified !== false) return res.status(409).json({ message: "An account with this email already exists." });
    if (user) {
      // pehle signup kiya tha par verify nahi kiya: details update karke naya code bhejo
      user.name = name.trim(); user.passwordHash = passwordHash; user.role = role;
      await user.save();
    } else {
      user = await User.create({ name: name.trim(), email: cleanEmail, passwordHash, role, emailVerified: false });
    }
    try {
      await sendOtp(user);
    } catch (err) {
      console.error("Verification email failed:", err.message);
      return res.status(500).json({ message: "Account created, but we could not send the verification code. Try logging in to get a new code." });
    }
    res.status(201).json({
      twoFactorRequired: true, purpose: "verify", email: user.email,
      message: "We sent a 6-digit code to your email. Enter it to verify your account."
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email is already registered." });
    res.status(500).json({ message: "Could not create your account." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Incorrect email or password." });

    // 2FA band ho (jaise demo organizer) aur email verified ho to seedha login
    if (user.twoFactorEnabled === false && user.emailVerified !== false) {
      return res.json({ token: makeToken(user), user: safeUser(user) });
    }

    try {
      await sendOtp(user);
    } catch (err) {
      console.error("Login OTP email failed:", err.message);
      return res.status(500).json({ message: "Could not send the verification code. Please try again." });
    }
    res.json({
      twoFactorRequired: true,
      purpose: purposeOf(user),
      email: user.email,
      message: "Enter the 6-digit code sent to your email."
    });
  } catch {
    res.status(500).json({ message: "Could not log in right now." });
  }
}

export async function verifyOtp(req, res) {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    const otp = String(req.body.otp || "").trim();
    if (!email || !/^\d{6}$/.test(otp)) return res.status(400).json({ message: "Enter the 6-digit code." });

    // pehle attempt gino (atomic), phir check karo
    const user = await User.findOneAndUpdate({ email }, { $inc: { otpAttempts: 1 } }, { new: true })
      .select("+otpHash +otpExpires +otpAttempts");
    if (!user || !user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired code. Please log in again." });
    }
    if (user.otpAttempts > MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many wrong attempts. Please log in again." });
    }
    const ok = crypto.timingSafeEqual(Buffer.from(hashOtp(otp)), Buffer.from(user.otpHash));
    if (!ok) return res.status(400).json({ message: "Incorrect code. Please try again." });

    await User.updateOne({ _id: user._id }, { $set: { emailVerified: true }, $unset: { otpHash: "", otpExpires: "", otpAttempts: "" } });
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch {
    res.status(500).json({ message: "Could not verify the code." });
  }
}

export async function resendOtp(req, res) {
  const generic = { message: "If a code is pending for this account, a new one has been sent." };
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email is required." });
    const user = await User.findOne({ email }).select("+otpExpires");
    // sirf tab jab login ke baad code pending ho, taaki koi doosre ke inbox me mail na bharta rahe
    if (!user || !user.otpExpires || user.otpExpires < new Date()) return res.json(generic);
    const lastSent = user.otpExpires.getTime() - OTP_TTL;
    if (Date.now() - lastSent < RESEND_WAIT) return res.json(generic);
    await sendOtp(user);
    res.json(generic);
  } catch (err) {
    console.error("Resend OTP failed:", err.message);
    res.status(500).json({ message: "Could not send the code right now." });
  }
}

export async function me(req, res) {
  res.json({ user: safeUser(req.user) });
}