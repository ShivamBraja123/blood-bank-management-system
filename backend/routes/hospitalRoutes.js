import express from "express";
import {
  protectFacility,
  authorizeFacilityType,
} from "../middlewares/facilityMiddleware.js";
import {
  hospitalRequestBlood,
  getHospitalRequests,
  getHospitalDashboard,
  getHospitalStock,
  getHospitalHistory,
  getAllDonors,
  logContactAttempt
} from "../controllers/hospitalController.js";

const router = express.Router();
const hospitalOnly = [protectFacility, authorizeFacilityType("hospital")];

// Blood request routes for hospitals
router.post("/blood/request", hospitalOnly, hospitalRequestBlood);
router.get("/blood/requests", hospitalOnly, getHospitalRequests);

// Dashboard routes
router.get("/dashboard", hospitalOnly, getHospitalDashboard);
router.get("/blood/stock", hospitalOnly, getHospitalStock);
router.get("/history", hospitalOnly, getHospitalHistory);

// Add to bloodLabRoutes.js
router.get("/donors", hospitalOnly, getAllDonors);
router.post("/donors/:id/contact", hospitalOnly, logContactAttempt);

export default router;