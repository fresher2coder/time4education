import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    // ✅ A question can be linked to multiple tests (reusable)
    tests: [{ type: mongoose.Schema.Types.ObjectId, ref: "Test" }],

    // ✅ Question Type
    type: {
      type: String,
      enum: ["mcq", "coding"],
      required: true,
    },

    // ✅ Common fields
    questionText: { type: String, required: true, trim: true },
    explanation: { type: String, default: "" },

    // ✅ MCQ-specific
    options: {
      type: [String],
      default: [],
    },
    correctAnswer: { type: String, default: "" },

    // ✅ Coding-specific
    sampleInput: { type: String, default: "" },
    sampleOutput: { type: String, default: "" },
    hiddenTestCases: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
      },
    ],

    // ✅ Meta
    category: { type: String, default: "general", trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    marks: { type: Number, default: 1, min: 0 },
    isActive: { type: Boolean, default: true },
    lang: { type: String, default: "java" }, // <-- add this

    // ✅ Reference to creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Indexing for faster searches (keyword, category, difficulty)
questionSchema.index({ questionText: "text", category: 1, difficulty: 1 });

export default mongoose.model("Question", questionSchema);
