import mongoose from "mongoose";

const StudentAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOptions: [String],
      },
    ],
    status: {
      type: String,
      enum: ["not_started", "in_progress", "submitted"],
      default: "not_started",
    },
    remainingTime: {
      type: Number, // seconds left
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure uniqueness per student + assignment
StudentAttemptSchema.index({ student: 1, assignment: 1 }, { unique: true });

export default mongoose.model("StudentAttempt", StudentAttemptSchema);
