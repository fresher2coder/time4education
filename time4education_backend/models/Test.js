// models/Test.js
import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  duration: { type: Number, required: true }, // in minutes

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // ✅ Linked questions
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  // ✅ New: Precomputed total marks for this test
  maxMarks: { type: Number, default: 0 }, // total marks from all linked questions

  // ✅ Active / Inactive / Archived
  status: {
    type: String,
    enum: ["active", "inactive", "archived"],
    default: "active",
  },

  // ✅ Optional scheduling
  startTime: { type: Date },
  endTime: { type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto update updatedAt
testSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// 🆕 Middleware: auto-calculate maxMarks whenever questions change
testSchema.pre("save", async function (next) {
  if (this.isModified("questions") && this.questions?.length > 0) {
    try {
      const Question = mongoose.model("Question");
      const qs = await Question.find({ _id: { $in: this.questions } }).select(
        "marks"
      );
      const totalMarks = qs.reduce((sum, q) => sum + (q.marks || 1), 0);
      this.maxMarks = totalMarks;
    } catch (err) {
      console.error("Error computing maxMarks:", err);
    }
  }
  next();
});

export default mongoose.model("Test", testSchema);
