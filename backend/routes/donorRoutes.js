import express from "express";
import { bookDonorCamp, getDonorCampBookings, getDonorCamps, getDonorHistory, getDonorProfile, getDonorStats, updateDonorProfile } from "../controllers/donorController.js";
import { protectDonor } from "../middlewares/donorMiddleware.js";


const router = express.Router();

router.get("/profile", protectDonor, getDonorProfile)

router.put("/profile", protectDonor, updateDonorProfile);

router.get("/camps", protectDonor, getDonorCamps);

router.post("/camps/:campId/book", protectDonor, bookDonorCamp);

router.get("/camp-bookings", protectDonor, getDonorCampBookings);

router.get("/history", protectDonor, getDonorHistory);

router.get("/stats", protectDonor, getDonorStats);



export default router;
