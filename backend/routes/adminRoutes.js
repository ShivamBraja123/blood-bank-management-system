import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getAllFacilities,
  approveFacility,
  rejectFacility,
  getDashboardStats,
  getAllDonors,
  getAllCamps,
  updateCampStatus,
  getAllCampBookings,
} from "../controllers/adminController.js";

const router = express.Router();

const adminOnly = [authenticate, authorize("admin", "superadmin")];

router.get("/facilities", adminOnly, getAllFacilities);
router.put("/facility/approve/:id", adminOnly, approveFacility);
router.put("/facility/reject/:id", adminOnly, rejectFacility);
router.get("/dashboard", adminOnly, getDashboardStats);
router.get("/donors", adminOnly, getAllDonors);
router.get("/camps", adminOnly, getAllCamps);
router.put("/camps/:id/status", adminOnly, updateCampStatus);
router.get("/camp-bookings", adminOnly, getAllCampBookings);


export default router;
