import dotenv from "dotenv";
import mongoose from "mongoose";

import Donor from "../models/donorModel.js";
import Facility from "../models/facilityModel.js";
import Blood from "../models/bloodModel.js";
import BloodRequest from "../models/bloodRequestModel.js";
import BloodCamp from "../models/bloodCampModel.js";

dotenv.config();

const DEMO_PREFIX = "DEMO_";
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const donorData = [
  ["Aarav Mehta", "A+", "Male", 29, 68, "Pune"],
  ["Isha Kapoor", "A-", "Female", 26, 57, "Mumbai"],
  ["Rohan Desai", "B+", "Male", 34, 76, "Ahmedabad"],
  ["Nisha Rao", "B-", "Female", 31, 61, "Bengaluru"],
  ["Vivaan Shah", "O+", "Male", 24, 72, "Surat"],
  ["Anaya Iyer", "O-", "Female", 28, 55, "Chennai"],
  ["Kabir Malhotra", "AB+", "Male", 39, 81, "Delhi"],
  ["Tara Sen", "AB-", "Female", 35, 59, "Kolkata"],
  ["Aditya Joshi", "A+", "Male", 42, 84, "Nashik"],
  ["Meera Nair", "B+", "Female", 23, 52, "Kochi"],
  ["Arjun Bhat", "O+", "Male", 30, 70, "Mysuru"],
  ["Sana Khan", "O-", "Female", 27, 58, "Hyderabad"],
  ["Neil Verma", "AB+", "Male", 46, 88, "Jaipur"],
  ["Riya Chawla", "A-", "Female", 33, 63, "Chandigarh"],
  ["Dev Patel", "B-", "Male", 37, 79, "Vadodara"],
];

const hospitalData = [
  ["CityCare Hospital", "Pune", "MH"],
  ["LifeLine Multispeciality Hospital", "Mumbai", "MH"],
  ["Hope Medical Centre", "Ahmedabad", "GJ"],
  ["Apex Care Hospital", "Bengaluru", "KA"],
  ["Sunrise Hospital", "Hyderabad", "TS"],
  ["Unity General Hospital", "Jaipur", "RJ"],
];

const labData = [
  ["CentralLife Blood Lab", "Pune", "MH"],
  ["RedDrop Transfusion Centre", "Mumbai", "MH"],
  ["VitalFlow Blood Services", "Bengaluru", "KA"],
  ["CarePlus Blood Resource Lab", "Hyderabad", "TS"],
];

const stockLevels = {
  "A+": 34,
  "A-": 8,
  "B+": 26,
  "B-": 6,
  "O+": 48,
  "O-": 4,
  "AB+": 15,
  "AB-": 3,
};

const futureDate = (daysFromNow) => {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const makePhone = (index) => `900000${String(index).padStart(4, "0")}`;

const makeAddress = (city, stateCode, index) => ({
  street: `${DEMO_PREFIX} Community Avenue ${index}`,
  city,
  state: stateCode === "MH" ? "Maharashtra" : stateCode === "GJ" ? "Gujarat" : stateCode === "KA" ? "Karnataka" : stateCode === "TS" ? "Telangana" : stateCode === "TN" ? "Tamil Nadu" : "Rajasthan",
  pincode: `${400000 + index}`,
});

async function seedDemoData() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const demoDonorEmails = donorData.map((_, index) => `demo_donor_${index + 1}@example.com`);
  const demoFacilityEmails = [
    ...hospitalData.map((_, index) => `demo_hospital_${index + 1}@example.com`),
    ...labData.map((_, index) => `demo_lab_${index + 1}@example.com`),
  ];
  const oldDemoFacilities = await Facility.find({
    email: { $in: demoFacilityEmails },
  }).select("_id");
  const oldFacilityIds = oldDemoFacilities.map((facility) => facility._id);

  await Promise.all([
    Donor.deleteMany({ email: { $in: demoDonorEmails } }),
    BloodRequest.deleteMany({
      $or: [
        { hospitalId: { $in: oldFacilityIds } },
        { labId: { $in: oldFacilityIds } },
      ],
    }),
    Blood.deleteMany({
      $or: [
        { bloodLab: { $in: oldFacilityIds } },
        { hospital: { $in: oldFacilityIds } },
      ],
    }),
    BloodCamp.deleteMany({ hospital: { $in: oldFacilityIds } }),
    Facility.deleteMany({ email: { $in: demoFacilityEmails } }),
  ]);

  const donors = [];
  for (const [index, [name, bloodGroup, gender, age, weight, city]] of donorData.entries()) {
    const donor = await Donor.create({
      fullName: `${DEMO_PREFIX}${name}`,
      email: demoDonorEmails[index],
      password: "DemoDonor123!",
      phone: makePhone(index + 1),
      address: makeAddress(city, city === "Ahmedabad" || city === "Surat" || city === "Vadodara" ? "GJ" : city === "Bengaluru" || city === "Mysuru" ? "KA" : city === "Hyderabad" ? "TS" : city === "Jaipur" ? "RJ" : city === "Chennai" ? "TN" : "MH", index + 1),
      bloodGroup,
      age,
      gender,
      weight,
      eligibleToDonate: index % 5 !== 0,
      lastDonationDate: index % 3 === 0 ? new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) : undefined,
    });
    donors.push(donor);
  }

  const facilities = [];
  for (const [index, [name, city, stateCode]] of hospitalData.entries()) {
    facilities.push(await Facility.create({
      name: `${DEMO_PREFIX}${name}`,
      email: demoFacilityEmails[index],
      password: "DemoFacility123!",
      phone: makePhone(100 + index),
      emergencyContact: makePhone(200 + index),
      address: makeAddress(city, stateCode, 100 + index),
      registrationNumber: `${DEMO_PREFIX}HOSP${String(index + 1).padStart(3, "0")}`,
      facilityType: "hospital",
      facilityCategory: index % 2 === 0 ? "Private" : "Trust",
      documents: {
        registrationProof: {
          url: "https://example.com/demo-registration-proof.pdf",
          filename: "demo-registration-proof.pdf",
        },
      },
      status: "approved",
      approvedAt: new Date(),
      operatingHours: { open: "08:00", close: "22:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      is24x7: index % 2 === 0,
      emergencyServices: true,
    }));
  }

  const labs = [];
  for (const [index, [name, city, stateCode]] of labData.entries()) {
    labs.push(await Facility.create({
      name: `${DEMO_PREFIX}${name}`,
      email: demoFacilityEmails[hospitalData.length + index],
      password: "DemoFacility123!",
      phone: makePhone(300 + index),
      emergencyContact: makePhone(400 + index),
      address: makeAddress(city, stateCode, 300 + index),
      registrationNumber: `${DEMO_PREFIX}LAB${String(index + 1).padStart(3, "0")}`,
      facilityType: "blood-lab",
      facilityCategory: index % 2 === 0 ? "Private" : "Charity",
      documents: {
        registrationProof: {
          url: "https://example.com/demo-registration-proof.pdf",
          filename: "demo-registration-proof.pdf",
        },
      },
      status: "approved",
      approvedAt: new Date(),
      operatingHours: { open: "07:00", close: "21:00", workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] },
      is24x7: index === 0,
      emergencyServices: true,
    }));
  }

  for (const [labIndex, lab] of labs.entries()) {
    await Blood.insertMany(bloodGroups.map((bloodGroup) => ({
      bloodGroup,
      quantity: Math.max(1, stockLevels[bloodGroup] - labIndex * 2),
      expiryDate: futureDate(35 + labIndex * 5),
      bloodLab: lab._id,
    })));
  }

  await Blood.insertMany(bloodGroups.map((bloodGroup, index) => ({
    bloodGroup,
    quantity: Math.max(1, 2 + (index % 4) * 2),
    expiryDate: futureDate(20 + index),
    hospital: facilities[index % facilities.length]._id,
  })));

  const requestStatuses = ["pending", "accepted", "rejected", "accepted", "pending", "accepted", "pending", "accepted", "pending"];
  const requests = await BloodRequest.insertMany(requestStatuses.map((status, index) => ({
    hospitalId: facilities[index % facilities.length]._id,
    labId: labs[index % labs.length]._id,
    bloodType: bloodGroups[index % bloodGroups.length],
    units: 2 + (index % 5),
    status,
    processedAt: status === "pending" ? undefined : new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
    notes: `${DEMO_PREFIX} Demo request ${index + 1} for interview demonstration`,
  })));

  const campTitles = [
    "Community Blood Donation Camp",
    "University Blood Donation Drive",
    "Mega Blood Donation Camp",
    "Youth Blood Donation Camp",
    "Emergency Blood Donation Drive",
    "Voluntary Blood Donation Camp",
  ];
  const camps = await BloodCamp.insertMany(campTitles.map((title, index) => ({
    hospital: labs[index % labs.length]._id,
    title: `${DEMO_PREFIX}${title}`,
    description: "Fictional demonstration event for voluntary blood donation and community awareness.",
    date: futureDate(7 + index * 9),
    time: { start: "09:00", end: "16:00" },
    location: {
      venue: `${DEMO_PREFIX} Community Hall ${index + 1}`,
      city: hospitalData[index % hospitalData.length][1],
      state: hospitalData[index % hospitalData.length][2] === "MH" ? "Maharashtra" : hospitalData[index % hospitalData.length][2] === "GJ" ? "Gujarat" : hospitalData[index % hospitalData.length][2] === "KA" ? "Karnataka" : hospitalData[index % hospitalData.length][2] === "TS" ? "Telangana" : "Rajasthan",
      pincode: `${411000 + index}`,
    },
    expectedDonors: 40 + index * 15,
    actualDonors: index % 2 === 0 ? 0 : 18 + index,
    status: "Upcoming",
  })));

  const donationHistory = donors.slice(0, 8).map((donor, index) => ({
    updateOne: {
      filter: { _id: donor._id },
      update: {
        $set: { lastDonationDate: new Date(Date.now() - (120 + index * 15) * 24 * 60 * 60 * 1000) },
        $push: {
          donationHistory: {
            donationDate: new Date(Date.now() - (120 + index * 15) * 24 * 60 * 60 * 1000),
            facility: labs[index % labs.length]._id,
            bloodGroup: donor.bloodGroup,
            quantity: 1 + (index % 2),
            remarks: `${DEMO_PREFIX} Verified community donation`,
            verified: true,
          },
        },
      },
    },
  }));
  await Donor.bulkWrite(donationHistory);

  console.log(JSON.stringify({
    donors: donors.length,
    hospitals: facilities.length,
    labs: labs.length,
    inventoryRecords: labs.length * bloodGroups.length + bloodGroups.length,
    requests: requests.length,
    camps: camps.length,
    demoEmails: demoDonorEmails,
  }, null, 2));
}

seedDemoData()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
