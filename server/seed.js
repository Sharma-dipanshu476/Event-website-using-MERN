import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Event from "./models/Event.js";
import bcrypt from "bcryptjs";
dotenv.config();

await connectDB();
const email = "dipanshu1822@gmail.com";
let organizer = await User.findOne({ email });
if (!organizer) {
  organizer = await User.create({
    name: "Eventrix Demo Organizer", email,
    passwordHash: await bcrypt.hash("Eventrix123", 12), role: "organizer"
  });
}
const samples = [
  {title:"Indie Music Night",description:"An evening of live indie music, great energy and new artists. Bring your friends and discover your next favourite band.",category:"Music",date:"2027-02-20",time:"18:30",venue:"The Courtyard",city:"Chandigarh",price:499,totalTickets:250,imageUrl:"https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=80"},
  {title:"Future Makers Conference",description:"Meet curious minds, hear practical talks and explore ideas shaping the future of technology and business.",category:"Conference",date:"2027-03-10",time:"10:00",venue:"Convention Centre",city:"New Delhi",price:999,totalTickets:180,imageUrl:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80"},
  {title:"Street Food Social",description:"A friendly food festival featuring local favourites, new flavours and a relaxed outdoor atmosphere.",category:"Food",date:"2027-03-22",time:"16:00",venue:"City Central Park",city:"Yamunanagar",price:199,totalTickets:400,imageUrl:"https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1000&q=80"},
  {title:"Weekend Mountain Escape",description:"A guided outdoor day for nature lovers. Meet fellow explorers and enjoy fresh air, scenic views and a beginner-friendly route.",category:"Adventure",date:"2027-04-05",time:"06:00",venue:"Bus Pickup Point",city:"Chandigarh",price:1499,totalTickets:35,imageUrl:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80"}
];
for (const sample of samples) {
  if (!await Event.findOne({title:sample.title, organizer:organizer._id})) {
    await Event.create({...sample, date:new Date(sample.date), availableTickets:sample.totalTickets, organizer:organizer._id});
  }
}
console.log("Seed complete. Demo organizer: organizer@eventrix.demo / Eventrix123");
process.exit(0);
