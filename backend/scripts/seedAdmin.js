import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/adminModel.js";

dotenv.config();

const email = process.env.DEV_ADMIN_EMAIL;
const password = process.env.DEV_ADMIN_PASSWORD;

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The development admin seed is disabled in production.");
  }
  if (!email || !password) {
    throw new Error("Set DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD before seeding.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    console.log(`Development admin already exists: ${email}`);
  } else {
    await Admin.create({
      name: "Development Admin",
      email,
      password,
      role: "admin",
    });
    console.log(`Development admin created: ${email}`);
  }
} finally {
  await mongoose.disconnect();
}
