import Donor from "../models/donorModel.js";
import User from "../models/UserModel.js";
// Assuming you have a Facility model for population, and BloodCamp model for camps
import Facility from "../models/facilityModel.js"; // Placeholder import
import BloodCamp from "../models/bloodCampModel.js"; // Placeholder import
import mongoose from "mongoose"; // Needed for ObjectId in aggregation
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// /* 👤 Get Donor Profile */
export const getDonorProfile = async (req, res) => {
  try {
    const donorId = req.donor?.id || req.donor?._id;

    let donor = await Donor.findById(donorId)
      .populate({
        path: "donationHistory.facility",
        select: "facilityName address.city address.state",
      })
      .select("-password -__v");

    if (!donor) {
      donor = await User.findById(donorId).select("-password -__v");
    }

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const isEligible = donor.isEligible !== undefined ? donor.isEligible : true;
    const history = donor.donationHistory || [];
    const totalDonations = history.length;
    const lastDonation = donor.lastDonationDate || null;

    let nextEligibleDate = null;
    if (lastDonation) {
      const next = new Date(lastDonation);
      next.setDate(next.getDate() + 90);
      nextEligibleDate = next;
    }

    const donorProfile = {
      _id: donor._id,
      fullName: donor.fullName || donor.name || "Donor",
      email: donor.email,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      age: donor.age || 25,
      gender: donor.gender || "Other",
      weight: donor.weight || 60,
      address: donor.address || { street: "N/A", city: "N/A", state: "N/A", pincode: "400001" },
      totalDonations,
      lastDonationDate: lastDonation,
      nextEligibleDate,
      eligibleToDonate: isEligible && (donor.eligibleToDonate !== false),
      donationHistory: history.map((don) => ({
        id: don._id,
        donationDate: don.donationDate,
        facility: don.facility?.facilityName || "N/A",
        city: don.facility?.address?.city,
        state: don.facility?.address?.state,
        bloodGroup: don.bloodGroup,
        quantity: don.quantity,
        remarks: don.remarks,
        verified: don.verified,
      })),
      createdAt: donor.createdAt,
      updatedAt: donor.updatedAt,
    };

    res.status(200).json({ donor: donorProfile });
  } catch (error) {
    console.error("❌ Error fetching donor profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching donor profile", error: error.message });
  }
};

/* 📝 Update Donor Profile */
export const updateDonorProfile = async (req, res) => {
  try {
    // ⚠️ Security Check: Ensure donorId is authenticated and authorized
    const donorId = req.donor._id; // from protectDonor middleware
    const { fullName, phone, address, age, gender, weight, password } = req.body;

    // Find by ID and exclude the password for initial retrieval
    const donor = await Donor.findById(donorId).select('+password'); 
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // ✅ Update fields only if provided
    donor.fullName = fullName !== undefined ? fullName : donor.fullName;
    donor.phone = phone !== undefined ? phone : donor.phone;
    
    // Only update address subfields if the main address object is provided
    if (address) {
        donor.address.street = address.street || donor.address.street;
        donor.address.city = address.city || donor.address.city;
        donor.address.state = address.state || donor.address.state;
        donor.address.pincode = address.pincode || address.pincode;
    }
    
    donor.age = age !== undefined ? age : donor.age;
    donor.gender = gender !== undefined ? gender : donor.gender;
    donor.weight = weight !== undefined ? weight : donor.weight;

    if (password) {
      // 🔑 Hash new password using the same salt rounds as the schema (12)
      const salt = await bcrypt.genSalt(12); 
      donor.password = await bcrypt.hash(password, salt);
    }

    const updatedDonor = await donor.save();

    res.status(200).json({
      message: "Profile updated successfully",
      // Only send back non-sensitive/non-history fields
      donor: {
        fullName: updatedDonor.fullName,
        email: updatedDonor.email,
        phone: updatedDonor.phone,
        address: updatedDonor.address,
        age: updatedDonor.age,
        gender: updatedDonor.gender,
        weight: updatedDonor.weight,
      },
    });
  } catch (error) {
    console.error("❌ Error updating donor profile:", error);
    // Handle validation errors from the schema
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


/* 🏥 Get Public Blood Camps for Donors */
export const getDonorCamps = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = {};
    
    // Filter by status if provided (e.g., 'active', 'completed', 'cancelled')
    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Use Promise.all to fetch camps and total count concurrently (efficient)
    const [camps, total] = await Promise.all([
      // Sort by date ascending (upcoming first)
      BloodCamp.find(filter)
        .sort({ date: 1 }) 
        .skip(skip)
        .limit(parseInt(limit)),
      
      BloodCamp.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        camps,
        pagination: {
          total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get Donor Camps Error:", error);
    // Better to return 401 if it's an Auth issue
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    res.status(500).json({ success: false, message: "Failed to fetch blood camps" });
  }
};


/**
 * @desc Get key statistics for the authenticated donor (efficiently using Aggregation)
 * @route GET /api/donor/stats
 * @access Private (Donor)
 */
export const getDonorStats = async (req, res) => {
  try {
    // FIX: Safely retrieve donorId using req.donor.id, which worked in getDonorProfile
    const donorId = req.donor?.id || req.donor?._id; 

    if (!donorId) {
        // If the middleware failed to attach the ID, return unauthorized
        return res.status(401).json({ success: false, message: "Unauthorized: Donor ID missing from request." });
    }
    
    let donorDoc = await Donor.findById(donorId);
    if (!donorDoc) {
      donorDoc = await User.findById(donorId);
    }

    if (!donorDoc) {
      return res.status(404).json({ success: false, message: "Donor profile not found." });
    }

    const history = donorDoc.donationHistory || [];
    const totalDonations = history.length;
    const lastDonationDate = donorDoc.lastDonationDate || null;
    
    let nextEligibleDonationDate = null;
    let eligibilityStatus = 'Eligible'; // Default

    // 1. Check eligibility based on the 90-day cooldown period
    if (lastDonationDate) {
      const lastDate = new Date(lastDonationDate);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 90); 
      nextEligibleDonationDate = nextDate;

      if (nextEligibleDonationDate > new Date()) {
        const remainingDays = Math.ceil((nextEligibleDonationDate - new Date()) / (1000 * 60 * 60 * 24));
        eligibilityStatus = `Ineligible (Cooldown: ${remainingDays} days remaining)`;
      }
    }
    
    const age = donorDoc.age || 25;
    const weight = donorDoc.weight || 60;

    // 2. Check general medical eligibility rules (overrides cooldown status)
    if (age < 18 || age > 65) {
      eligibilityStatus = 'Ineligible (Age constraint)';
    } else if (weight < 45) {
      eligibilityStatus = 'Ineligible (Weight constraint)';
    }

    res.json({
      success: true,
      dashboard: {
        totalDonations,
        lastDonationDate,
        nextEligibleDonationDate,
        eligibilityStatus: eligibilityStatus,
      },
    });

  } catch (error) {
    console.error("Get Donor Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch donor statistics." });
  }
};

/**
 * @desc Get paginated donation history from the embedded array (efficiently using Aggregation)
 * @route GET /api/donor/history
 * @access Private (Donor)
 */
export const getDonorHistory = async (req, res) => {
  try {
    // FIX: Safely retrieve donorId using req.donor.id, which worked in getDonorProfile
    const donorId = req.donor?.id || req.donor?._id; 

    if (!donorId) {
        // If the middleware failed to attach the ID, return unauthorized
        return res.status(401).json({ success: false, message: "Unauthorized: Donor ID missing from request." });
    }
    
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const aggregationPipeline = [
      // 1. Match the specific donor document
      { $match: { _id: new mongoose.Types.ObjectId(donorId) } },

      // 2. Count the total history items before unwinding
      {
        $addFields: {
          totalHistoryLength: { $size: "$donationHistory" }
        }
      },
      
      // 3. Deconstruct the array field to generate a document for each item (Crucial for array pagination)
      { $unwind: "$donationHistory" },

      // 4. Sort the history items (most recent first)
      { $sort: { "donationHistory.donationDate": -1 } },

      // 5. Apply pagination (skip and limit)
      { $skip: skip },
      { $limit: parseInt(limit) },

      // 6. Optionally, lookup facility details if they were not populated in getDonorProfile
      { 
        $lookup: {
          from: 'facilities', // The name of the collection that stores Facility documents
          localField: 'donationHistory.facility',
          foreignField: '_id',
          as: 'facilityDetails'
        }
      },

      // 7. Reshape the output
      {
        $project: {
          _id: 0, // Exclude the Donor's _id
          donation: "$donationHistory",
          total: "$totalHistoryLength",
          facility: { $arrayElemAt: ["$facilityDetails", 0] } // Extract the single facility object
        }
      }
    ];

    const result = await Donor.aggregate(aggregationPipeline);

    // Extract total count and history array from the aggregation result
    // Total should be retrieved safely if the result array is not empty
    const total = result.length > 0 ? result[0].total : 0; 
    
    const history = result.map(item => ({ 
      id: item.donation._id,
      donationDate: item.donation.donationDate,
      bloodGroup: item.donation.bloodGroup,
      quantity: item.donation.quantity,
      remarks: item.donation.remarks,
      verified: item.donation.verified,
      // Include facility details
      facility: item.facility?.facilityName || "N/A",
      city: item.facility?.address?.city,
      state: item.facility?.address?.state,
    }));
    
    res.json({
      success: true,
      history,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });

  } catch (error) {
    console.error("Get Donor History Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch donation history." });
  }
};

// Add these to your bloodLabController.js

/**
 * @desc Search donors
 * @route GET /api/blood-lab/donors/search
 * @access Private (Blood Lab)
 */
export const searchDonor = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term) {
      return res.status(400).json({ success: false, message: "Search term required" });
    }

    const [donors, users] = await Promise.all([
      Donor.find({
        $or: [
          { fullName: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
          { phone: { $regex: term, $options: "i" } }
        ]
      })
        .select('fullName email phone bloodGroup lastDonationDate donationHistory')
        .limit(20)
        .sort({ lastDonationDate: -1 }),
      User.find({
        role: "donor",
        $or: [
          { name: { $regex: term, $options: "i" } },
          { email: { $regex: term, $options: "i" } },
          { phone: { $regex: term, $options: "i" } }
        ]
      })
        .select('name email phone bloodGroup lastDonationDate donationHistory')
        .limit(20)
        .sort({ lastDonationDate: -1 }),
    ]);

    const results = [
      ...donors,
      ...users.map((user) => ({
        ...user.toObject(),
        fullName: user.name,
      })),
    ].slice(0, 20);

    res.status(200).json({ success: true, donors: results });
  } catch (err) {
    console.error("Search donor error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Mark donation
 * @route POST /api/blood-lab/donors/donate/:id
 * @access Private (Blood Lab)
 */
export const markDonation = async (req, res) => {
  try {
    const donorId = req.params.id;
    const labId = req.user._id;
    const { quantity = 1, remarks = "", bloodGroup } = req.body;

    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    // Check if donor can donate (3 months gap)
    if (donor.lastDonationDate) {
      const lastDonation = new Date(donor.lastDonationDate);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (lastDonation > threeMonthsAgo) {
        return res.status(400).json({ 
          success: false, 
          message: "Donor cannot donate yet. Minimum 3 months required between donations." 
        });
      }
    }

    // Update last donation date
    donor.lastDonationDate = new Date();
    
    // Update blood group if provided
    if (bloodGroup) {
      donor.bloodGroup = bloodGroup;
    }

    // Add to donation history
    donor.donationHistory.push({
      donationDate: new Date(),
      facility: labId,
      bloodGroup: bloodGroup || donor.bloodGroup,
      quantity,
      remarks,
      verified: true
    });

    await donor.save();

    // Add to facility history
    await Facility.findByIdAndUpdate(labId, {
      $push: {
        history: {
          eventType: "Donation",
          description: `Recorded donation from ${donor.fullName} - ${quantity} unit(s) of ${bloodGroup || donor.bloodGroup}`,
          date: new Date(),
          referenceId: donor._id,
        },
      },
    });

    // Add to blood stock
    const bloodType = bloodGroup || donor.bloodGroup;
    await addToBloodStock(labId, bloodType, quantity);

    res.status(200).json({ 
      success: true, 
      message: "Donation recorded successfully", 
      donor 
    });
  } catch (err) {
    console.error("Mark donation error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get recent donations
 * @route GET /api/blood-lab/donations/recent
 * @access Private (Blood Lab)
 */
export const getRecentDonations = async (req, res) => {
  try {
    const labId = req.user._id;
    
    // Get today's start and end
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's start
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const [todayDonations, weekDonations, allDonations, recentDonors] = await Promise.all([
      // Today's donations
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: today, $lt: tomorrow }
      }),
      
      // This week's donations
      Donor.countDocuments({
        'donationHistory.facility': labId,
        'donationHistory.donationDate': { $gte: weekStart }
      }),
      
      // Total donations
      Donor.aggregate([
        { $unwind: '$donationHistory' },
        { $match: { 'donationHistory.facility': labId } },
        { $count: 'total' }
      ]),
      
      // Recent donations with donor details
      Donor.find({
        'donationHistory.facility': labId
      })
      .select('fullName bloodGroup donationHistory')
      .sort({ 'donationHistory.donationDate': -1 })
      .limit(10)
    ]);

    // Format recent donations
    const recentDonations = recentDonors.flatMap(donor => 
      donor.donationHistory
        .filter(d => d.facility.equals(labId))
        .slice(0, 3)
        .map(d => ({
          donorName: donor.fullName,
          bloodGroup: d.bloodGroup,
          quantity: d.quantity,
          date: d.donationDate,
          remarks: d.remarks
        }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      stats: {
        today: todayDonations,
        thisWeek: weekDonations,
        total: allDonations[0]?.total || 0
      },
      donations: recentDonations
    });
  } catch (err) {
    console.error("Get recent donations error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch recent donations" });
  }
};

// Helper function to add to blood stock
const addToBloodStock = async (labId, bloodType, quantity) => {
  try {
    let stock = await Blood.findOne({ bloodGroup: bloodType, bloodLab: labId });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 42);

    if (stock) {
      stock.quantity += quantity;
      stock.expiryDate = expiryDate;
      await stock.save();
    } else {
      await Blood.create({
        bloodGroup: bloodType,
        quantity,
        expiryDate,
        bloodLab: labId,
      });
    }
  } catch (error) {
    console.error("Error adding to blood stock:", error);
  }
};