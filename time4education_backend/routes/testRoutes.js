// routes/testRoutes.js
import express from "express";
import Test from "../models/Test.js";
import Question from "../models/Question.js";
import Assignment from "../models/Assignment.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * ✅ Helper to recalculate maxMarks from Questions (reverse lookup)
 */
const recalcMaxMarks = async (testId) => {
  const questions = await Question.find({ tests: testId }).select("marks");
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  await Test.findByIdAndUpdate(testId, { maxMarks: totalMarks });
  return totalMarks;
};

/**
 * Helper to normalize the date
 */
import { DateTime } from "luxon";
const normalizeDate = () => {
  const zone = "Asia/Kolkata";
  const start = DateTime.fromObject(
    {
      year: 2025,
      month: 9,
      day: 7,
      hour: 4,
      minute: 0,
    },
    { zone }
  )
    .toUTC()
    .toJSDate();

  const end = DateTime.fromObject(
    {
      year: 2025,
      month: 9,
      day: 7,
      hour: 23,
      minute: 0,
    },
    { zone }
  )
    .toUTC()
    .toJSDate();

  // Save start and end in Mongo
};

/**
 * ✅ Create Test (Admin only)
 */
router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { title, description, duration, startTime, endTime } = req.body;
    const normalizedStart = startTime ? new Date(startTime) : null;
    const normalizedEnd = endTime ? new Date(endTime) : null;
    const newTest = new Test({
      title,
      description,
      duration,
      startTime: normalizedStart,
      endTime: normalizedEnd,
      createdBy: req.user.id,
      maxMarks: 0, // initially no questions linked
    });

    await newTest.save();

    res.status(201).json({
      success: true,
      message: "✅ Test created successfully",
      test: newTest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error creating test",
      error: error.message,
    });
  }
});

/**
 * ✅ Get single test (with computed maxMarks)
 * Students can only access tests they’re assigned via Assignment
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });

    // refresh maxMarks dynamically (safe sync)
    const maxMarks = await recalcMaxMarks(test._id);
    test.maxMarks = maxMarks;

    // If not admin — verify assignment
    if (req.user.role !== "admin") {
      const assignment = await Assignment.findOne({
        test: req.params.id,
        $or: [{ college: req.user.college }, { college: "general" }],
        $or: [{ batch: req.user.batch }, { batch: "all" }],
        $or: [{ department: req.user.department }, { department: "general" }],
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: "❌ You are not assigned to this test",
        });
      }

      const now = new Date();
      if (test.status !== "active") {
        return res
          .status(403)
          .json({ success: false, message: "Test is not active" });
      }
      if (test.startTime && now < test.startTime) {
        return res
          .status(403)
          .json({ success: false, message: "Test has not started yet" });
      }
      if (test.endTime && now > test.endTime) {
        return res
          .status(403)
          .json({ success: false, message: "Test has ended" });
      }
    }

    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error fetching test",
      error: error.message,
    });
  }
});

/**
 * ✅ Update Test (Admin only)
 */

/**
 * ✅ Update Test (Admin only)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { startTime, endTime, questions, ...rest } = req.body;

      let updatePayload = { ...rest };

      if (startTime) updatePayload.startTime = new Date(startTime);
      if (endTime) updatePayload.endTime = new Date(endTime);
      if (questions) updatePayload.questions = questions;

      const updatedTest = await Test.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true }
      );

      if (!updatedTest) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }

      // 🧮 Recalculate maxMarks if questions were updated
      if (questions) {
        const maxMarks = await recalcMaxMarks(updatedTest._id);
        updatedTest.maxMarks = maxMarks;
      }

      res.json({
        success: true,
        message: "✅ Test updated successfully",
        test: updatedTest,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error updating test",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ List Tests (Admin → all; Student → only assigned & active)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    let tests = [];

    if (req.user.role === "admin") {
      tests = await Test.find().populate("createdBy", "name email");
    } else {
      // fetch assignments for this student
      const assignments = await Assignment.find({
        $or: [{ college: req.user.college }, { college: "general" }],
        $or: [{ batch: req.user.batch }, { batch: "all" }],
        $or: [{ department: req.user.department }, { department: "general" }],
      }).select("test");

      const testIds = assignments.map((a) => a.test);

      tests = await Test.find({
        _id: { $in: testIds },
        status: "active",
        $or: [{ startTime: null }, { startTime: { $lte: new Date() } }],
        $or: [{ endTime: null }, { endTime: { $gte: new Date() } }],
      }).populate("createdBy", "name email");
    }

    // Optional: refresh maxMarks for each (safe)
    await Promise.all(tests.map((t) => recalcMaxMarks(t._id)));

    res.json({
      success: true,
      count: tests.length,
      tests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error fetching tests",
      error: error.message,
    });
  }
});

/**
 * ✅ Archive, Restore, Delete remain same (no questions populate needed)
 */
router.put(
  "/:id/archive",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }
      test.status = "archived";
      await test.save();
      res.json({
        success: true,
        message: "✅ Test archived successfully (can be restored later)",
        test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error archiving test",
        error: error.message,
      });
    }
  }
);

router.put(
  "/:id/restore",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }
      if (test.status !== "archived") {
        return res.status(400).json({
          success: false,
          message: "❌ Only archived tests can be restored",
        });
      }
      test.status = "active";
      await test.save();
      res.json({
        success: true,
        message: "✅ Test restored to active status",
        test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error restoring test",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) {
        return res
          .status(404)
          .json({ success: false, message: "Test not found" });
      }
      // No need to check questions here — by design questions live separately
      await Test.findByIdAndDelete(test._id);
      await Assignment.deleteMany({ test: req.params.id });
      res.json({
        success: true,
        message: "✅ Test permanently deleted + related assignments cleaned",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error hard deleting test",
        error: error.message,
      });
    }
  }
);

export default router;
