import nodemailer from "nodemailer";

let transporter;

// Transporter pehli mail bhejte waqt banta hai, taaki .env pehle load ho chuka ho
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  }
  return transporter;
}

export default async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS is missing in server/.env");
  }
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Eventrix <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}