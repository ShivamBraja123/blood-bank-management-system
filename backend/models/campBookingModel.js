import mongoose from "mongoose";

const campBookingSchema = new mongoose.Schema(
  {
    campId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodCamp",
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    donorModel: {
      type: String,
      enum: ["Donor", "User"],
      required: true,
    },
    status: {
      type: String,
      enum: ["booked"],
      default: "booked",
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

campBookingSchema.index({ campId: 1, donorId: 1 }, { unique: true });

export default mongoose.model("CampBooking", campBookingSchema);
