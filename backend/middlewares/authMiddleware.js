import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Donor from "../models/donorModel.js";
import Admin from "../models/adminModel.js";
import Facility from "../models/facilityModel.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "default_secret";
      const decoded = jwt.verify(token, secret);

      let user =
        (await User.findById(decoded.id).select("-password")) ||
        (await Donor.findById(decoded.id).select("-password")) ||
        (await Admin.findById(decoded.id).select("-password")) ||
        (await Facility.findById(decoded.id).select("-password"));

      if (!user)
        return res.status(401).json({ message: "User not found or unauthorized" });

      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({ message: "Token invalid or expired" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};
