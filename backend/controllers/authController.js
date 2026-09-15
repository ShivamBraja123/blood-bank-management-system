import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Donor from "../models/donorModel.js";
import Admin from "../models/adminModel.js";
import Facility from "../models/facilityModel.js";

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || "default_secret",
    { expiresIn: "7d" }
  );
};

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      password,
      phone,
      bloodGroup,
      role
    } = req.body;

    const userName = name || fullName;
    const userRole = role || "donor";

    if (!userName || !email || !password || !phone) {
      return res.status(400).json({
        message: "All required fields (name, email, password, phone) must be provided"
      });
    }

    if (userRole === "donor" && !bloodGroup) {
      return res.status(400).json({
        message: "Blood group is required for donors"
      });
    }

    const existingUser = (await User.findOne({ email: email.toLowerCase() })) ||
                         (await Donor.findOne({ email: email.toLowerCase() })) ||
                         (await Facility.findOne({ email: email.toLowerCase() })) ||
                         (await Admin.findOne({ email: email.toLowerCase() }));

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email"
      });
    }

    let user;
    if (userRole === "hospital" || userRole === "blood-lab") {
      user = await Facility.create({
        name: userName,
        email: email.toLowerCase(),
        password: password.trim(), // facilitySchema pre('save') hook hashes password
        phone: phone,
        emergencyContact: req.body.emergencyContact || phone,
        address: req.body.address || { street: "N/A", city: "N/A", state: "N/A", pincode: "400001" },
        registrationNumber: req.body.registrationNumber || `REG-${Date.now()}`,
        facilityType: userRole,
        role: userRole,
        facilityCategory: req.body.facilityCategory || "Private",
        documents: req.body.documents || { registrationProof: { url: "http://example.com/doc.pdf" } },
        status: "pending"
      });
    } else {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      user = await User.create({
        name: userName,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        bloodGroup: bloodGroup || undefined,
        role: userRole
      });
    }

    const token = generateToken(user._id, user.role);

    const redirect =
      user.role === "donor"
        ? "/donor"
        : user.role === "hospital"
        ? "/hospital"
        : user.role === "blood-lab"
        ? "/lab"
        : "/admin";

    return res.status(201).json({
      success: true,
      message: user.role === "donor"
        ? "Registration successful"
        : "Facility registered successfully! Please wait for admin approval.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        status: user.status
      },
      token,
      redirect
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      user = await Donor.findOne({ email: email.toLowerCase() }).select("+password");
    }
    if (!user) {
      user = await Facility.findOne({ email: email.toLowerCase() }).select("+password");
    }
    if (!user) {
      user = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password.trim(),
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (user instanceof Facility || user.role === "hospital" || user.role === "blood-lab") {
      if (user.status === "pending") {
        return res.status(403).json({
          message: "Your account is awaiting admin approval. Please wait before logging in."
        });
      }
      if (user.status === "rejected") {
        return res.status(403).json({
          message: "Your registration has been rejected by admin. Contact support for details."
        });
      }
    }

    const token = generateToken(user._id, user.role);

    const redirect =
      user.role === "donor"
        ? "/donor"
        : user.role === "hospital"
        ? "/hospital"
        : user.role === "blood-lab"
        ? "/lab"
        : "/admin";

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name || user.fullName || user.facilityName,
        fullName: user.fullName || user.name || user.facilityName,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        status: user.status
      },
      token,
      redirect
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        message: "User profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name || user.fullName || user.facilityName || "User",
        fullName: user.fullName || user.name || user.facilityName || "User",
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        status: user.status || "approved"
      }
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({
      message: "Error fetching profile",
      error: error.message
    });
  }
};

// Aliases for compatibility
export const register = registerUser;
export const login = loginUser;