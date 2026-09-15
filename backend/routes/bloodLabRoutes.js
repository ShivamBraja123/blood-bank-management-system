import express from "express";
import {
  createBloodCamp,
  deleteBloodCamp,
  getBloodLabCamps,
  getBloodLabDashboard,
  getBloodLabHistory,
  updateBloodCamp,        // ADD THIS
  updateCampStatus,       // ADD THIS
  addBloodStock,
  removeBloodStock,
  getBloodStock,
  updateBloodRequestStatus,
  getLabBloodRequests,
  getAllLabs,
} from "../controllers/bloodLabController.js";
import {
  protectFacility,
  authorizeFacilityType,
} from "../middlewares/facilityMiddleware.js";
import { getRecentDonations, markDonation, searchDonor } from "../controllers/donorController.js";

const router = express.Router();
const bloodLabOnly = [protectFacility, authorizeFacilityType("blood-lab")];

// Dashboard routes
router.get("/dashboard", bloodLabOnly, getBloodLabDashboard);
router.get("/history", bloodLabOnly, getBloodLabHistory);

// Camp management
router.post("/camps", bloodLabOnly, createBloodCamp);
router.get("/camps", bloodLabOnly, getBloodLabCamps);
router.put("/camps/:id", bloodLabOnly, updateBloodCamp);
router.patch("/camps/:id/status", bloodLabOnly, updateCampStatus);
router.delete("/camps/:id", bloodLabOnly, deleteBloodCamp);

// Blood stock routes
router.post("/blood/add", bloodLabOnly, addBloodStock);
router.post("/blood/remove", bloodLabOnly, removeBloodStock);
router.get("/blood/stock", bloodLabOnly, getBloodStock);


// Blood request routes for labs
router.get("/blood/requests", bloodLabOnly, getLabBloodRequests);
router.put("/blood/requests/:id", bloodLabOnly, updateBloodRequestStatus);

// Get labs for hospitals
router.get("/labs", bloodLabOnly, getAllLabs);

// Add these routes to your bloodLabRoutes.js
router.get("/donors/search", bloodLabOnly, searchDonor);
router.post("/donors/donate/:id", bloodLabOnly, markDonation);
router.get("/donations/recent", bloodLabOnly, getRecentDonations);

export default router;