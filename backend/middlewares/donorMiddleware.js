import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Donor from "../models/donorModel.js";

export const protectDonor = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "default_secret";
      const decoded = jwt.verify(token, secret);

      let donor = (await User.findById(decoded.id).select("-password")) ||
                  (await Donor.findById(decoded.id).select("-password"));

      if (!donor) return res.status(401).json({ message: "Unauthorized" });

      req.donor = donor;
      req.user = donor;
      next();
    } catch (error) {
      console.error("Donor auth error:", error);
      res.status(401).json({ message: "Token invalid or expired" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};
