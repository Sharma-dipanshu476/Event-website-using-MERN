import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "organizer"], default: "user" },
    // default true => purane (pehle se bane) users verified maane jaate hain; naye signup me register() isse false set karta hai
    emailVerified: { type: Boolean, default: true },
    twoFactorEnabled: { type: Boolean, default: true },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
