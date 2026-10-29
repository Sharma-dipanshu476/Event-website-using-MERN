import { Router } from "express";
import { createBooking, myBookings, verifyPayment, abandonBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);
router.post("/", createBooking);
router.get("/my", myBookings);
router.post("/verify-payment", verifyPayment);
router.post("/:id/abandon", abandonBooking);
export default router;
