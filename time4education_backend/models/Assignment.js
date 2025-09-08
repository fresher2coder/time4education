// models/Assignment.js
import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    // 🔗 Linked Test
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    // 🎯 Targeting info — now arrays
    colleges: {
      type: [String], // ["CollegeA", "CollegeB"] or ["general"]
      default: ["general"],
    },
    batches: {
      type: [String], // ["2025", "2026"] or ["all"]
      default: ["all"],
    },
    departments: {
      type: [String], // ["CSE", "IT"] or ["general"]
      default: ["general"],
    },

    // 📝 Optional instructions for students
    instructions: {
      type: String,
      default: "",
    },

    // 👤 Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🕒 Schedule overrides (optional)
    startTime: Date,
    endTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
