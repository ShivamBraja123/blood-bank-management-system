import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Donor from "../models/donorModel.js";
import Admin from "../models/adminModel.js";
import Facility from "../models/facilityModel.js";

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing."
      });
    }

    const secret = process.env.JWT_SECRET || "default_secret";
    const decoded = jwt.verify(token, secret);

    let user = await User.findById(decoded.id).select("-password");
    if (!user) {
      user = (await Donor.findById(decoded.id).select("-password")) ||
             (await Admin.findById(decoded.id).select("-password")) ||
             (await Facility.findById(decoded.id).select("-password"));
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or token is invalid."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token is not valid."
    });
  }
};

// Role authorization middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions."
      });
    }
    next();
  };
};

export const protect = authenticate;