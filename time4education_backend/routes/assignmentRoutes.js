// routes/assignmentRoutes.js
import mongoose from "mongoose";
import express from "express";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * ✅ Get All Assignments (filtered for students automatically)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "student") {
      query = {
        colleges: { $in: [req.user.college, "all"] },
        batches: { $in: [req.user.batch, "all"] },
        departments: { $in: [req.user.department, "all"] },
      };
    }

    const assignments = await Assignment.find(query)
      .populate({
        path: "test",
        populate: {
          path: "questions",
          select: "questionText options type marks",
        },
      })
      .populate("createdBy", "name email");

    let result = assignments;

    // For students: mark which assignments are already submitted
    if (req.user.role === "student") {
      const studentSubmissions = await Submission.find({
        student: req.user._id,
      }).select("assignment");

      const submittedIds = new Set(
        studentSubmissions.map((s) => s.assignment.toString())
      );

      result = assignments.map((a) => {
        const plain = a.toObject();
        plain.completed = submittedIds.has(a._id.toString());
        return plain;
      });
    }

    res.json({
      success: true,
      count: result.length,
      assignments: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error fetching assignments",
      error: error.message,
    });
  }
});

/**
 * ✅ Get Single Assignment by ID (with test questions)
 */
// routes/assignmentRoutes.js

import StudentAttempt from "../models/StudentAttempt.js";

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate(
        "test",
        "title description duration startTime endTime status maxMarks noOfQuestions"
      )
      .lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const studentId = req.user._id; // assuming you’ve set req.user via auth middleware

    // Check if we already have a locked attempt
    let attempt = await StudentAttempt.findOne({
      student: studentId,
      assignment: assignment._id,
    }).populate(
      "questionOrder",
      "type questionText options marks correctAnswer"
    );

    if (attempt) {
      // Already locked → return existing question set
      return res.json({
        ...assignment,
        questions: attempt.questionOrder,
      });
    }

    // First time → sample 20 random questions
    const questions = await Question.aggregate([
      { $match: { tests: assignment.test._id } },
      { $sample: { size: assignment.test.noOfQuestions } },
      {
        $project: {
          type: 1,
          questionText: 1,
          options: 1,
          marks: 1,
          correctAnswer: 1,
        },
      },
    ]);

    // Save locked attempt
    attempt = await StudentAttempt.create({
      student: studentId,
      assignment: assignment._id,
      questionOrder: questions.map((q) => q._id),
      status: "not_started",
    });

    res.json({
      ...assignment,
      questions, // same set that’s now locked in DB
    });
  } catch (err) {
    console.error("Error fetching assignment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

import { DateTime } from "luxon";
const normalizeDate = (dateString) => {
  const zone = "Asia/Kolkata";
  return DateTime.fromISO(dateString, { zone }).toUTC().toJSDate();
};
/**
 * ✅ Create Assignment (admin only)
 */
router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const {
      test,
      colleges = ["all"],
      batches = ["all"],
      departments = ["all"],
      instructions = "",
      startTime,
      endTime,
    } = req.body;

    const normalizedStart = startTime ? normalizeDate(startTime) : null;
    const normalizedEnd = endTime ? normalizeDate(endTime) : null;

    const newAssignment = new Assignment({
      test,
      colleges,
      batches,
      departments,
      instructions,
      startTime: normalizedStart,
      endTime: normalizedEnd,
      createdBy: req.user._id,
    });

    const saved = await newAssignment.save();

    res.status(201).json({
      success: true,
      message: "✅ Assignment created",
      assignment: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error creating assignment",
      error: error.message,
    });
  }
});

/**
 * ✅ Delete Assignment (admin only)
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const deleted = await Assignment.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "❌ Assignment not found" });
      }
      res.json({
        success: true,
        message: "✅ Assignment deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error deleting assignment",
        error: error.message,
      });
    }
  }
);

export default router;
