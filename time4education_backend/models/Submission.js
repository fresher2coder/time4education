import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  answers: [
    {
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      selectedOptions: [{ type: String }],
      isCorrect: { type: Boolean, default: false },
      marksAwarded: { type: Number, default: 0 },
    },
  ],

  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },

  submittedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Submission", submissionSchema);
