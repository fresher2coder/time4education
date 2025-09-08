import express from "express";
import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * 🧑‍🎓 Get Student Dashboard (Self, Safe, Aggregated)
 */
router.get(
  "/student/me",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const studentObjectId = new mongoose.Types.ObjectId(studentId);
      const now = new Date();

      console.log(req.user);
      // Optional filters (arrays)
      const { college, batch, department } = req.user;

      const assignments = await Assignment.aggregate([
        // 1️⃣ Filter assignments for student's college/batch/department
        {
          $match: {
            ...(college ? { colleges: { $in: [college, "all"] } } : {}),
            ...(batch ? { batches: { $in: [batch, "all"] } } : {}),
            ...(department
              ? { departments: { $in: [department, "all"] } }
              : {}),
          },
        },

        // 2️⃣ Lookup submission for this student
        {
          $lookup: {
            from: "submissions",
            let: { assignmentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$assignment", "$$assignmentId"] },
                      { $eq: ["$student", studentObjectId] },
                    ],
                  },
                },
              },
            ],
            as: "submission",
          },
        },
        { $unwind: { path: "$submission", preserveNullAndEmptyArrays: true } },

        // 3️⃣ Lookup test details
        {
          $lookup: {
            from: "tests",
            localField: "test",
            foreignField: "_id",
            as: "testDetails",
          },
        },
        { $unwind: { path: "$testDetails", preserveNullAndEmptyArrays: true } },

        // 4️⃣ Compute status, canStart, progress, timeRemaining
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  {
                    case: { $ifNull: ["$submission.submittedAt", false] },
                    then: "completed",
                  },
                  {
                    case: { $and: [{ $ifNull: ["$submission._id", false] }] },
                    then: "in-progress",
                  },
                ],
                default: "not-started",
              },
            },
            canStart: {
              $and: [
                { $eq: ["$submission", null] },
                {
                  $or: [
                    { $lte: ["$startTime", now] },
                    { $eq: ["$startTime", null] },
                  ],
                },
                {
                  $or: [
                    { $gte: ["$endTime", now] },
                    { $eq: ["$endTime", null] },
                  ],
                },
                { $eq: ["$testDetails.status", "active"] },
              ],
            },
            progressPercentage: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$submission.submittedAt", null] },
                    { $ifNull: ["$submission._id", false] },
                  ],
                },
                {
                  $multiply: [
                    {
                      $divide: [
                        { $size: { $ifNull: ["$submission.answers", []] } },
                        { $size: { $ifNull: ["$testDetails.questions", []] } },
                      ],
                    },
                    100,
                  ],
                },
                null,
              ],
            },
            timeRemaining: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$submission.submittedAt", null] },
                    { $eq: ["$submission", null] },
                  ],
                },
                {
                  $divide: [
                    {
                      $subtract: [
                        {
                          $add: [
                            { $ifNull: ["$submission.startedAt", now] },
                            {
                              $multiply: [
                                { $ifNull: ["$testDetails.duration", 0] },
                                60000,
                              ],
                            },
                          ],
                        },
                        now,
                      ],
                    },
                    1000,
                  ],
                },
                null,
              ],
            },
          },
        },

        // 5️⃣ Project final fields for frontend
        {
          $project: {
            assignmentId: "$_id",
            testId: "$testDetails._id",
            title: "$testDetails.title",
            description: "$testDetails.description",
            duration: "$testDetails.duration",
            startTime: 1,
            endTime: 1,
            status: 1,
            score: "$submission.totalScore",
            maxScore: "$testDetails.maxMarks",
            percentage: "$submission.percentage",
            progressPercentage: 1,
            submittedAt: "$submission.submittedAt",
            canStart: 1,
            timeRemaining: 1,
          },
        },
      ]);

      res.json({
        studentId,
        assignments,
        message:
          assignments.length === 0 ? "No assignments available yet." : null,
      });
    } catch (error) {
      console.error("❌ Error building student dashboard:", error);
      res.status(500).json({
        message: "❌ Error building student dashboard",
        error: error.message,
      });
    }
  }
);

export default router;
