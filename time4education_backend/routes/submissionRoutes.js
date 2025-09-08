import express from "express";
import Submission from "../models/Submission.js";
import Assignment from "../models/Assignment.js";
import Question from "../models/Question.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * ✅ 1. Submit Test (Student)
 */
// routes/submissionRoutes.js
// routes/submissionRoutes.js
router.post(
  "/",
  authMiddleware,
  roleMiddleware("student"),

  async (req, res) => {
    try {
      const { assignmentId, answers } = req.body;

      // 1. Get assignment and its linked test
      const assignment = await Assignment.findById(assignmentId).populate(
        "test"
      );
      if (!assignment) {
        return res.status(404).json({ message: "❌ Assignment not found" });
      }

      // 2. Prevent duplicate submissions
      const existing = await Submission.findOne({
        assignment: assignmentId,
        student: req.user.id,
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "❌ Already submitted this test" });
      }

      // 3. Fetch all questions for this test
      const questions = await Question.aggregate([
        {
          $match: {
            tests: assignment.test._id.toString(),
          },
        },

        {
          $project: {
            correctAnswer: 1,
            marks: 1,
          },
        },
      ]);

      // 4. Evaluate answers
      let totalScore = 0;
      let maxScore = assignment.test.maxMarks;
      const processedAnswers = [];

      questions.forEach((q) => {
        const studentAnswer = answers.find(
          (a) => a.question.toString() === q._id.toString()
        );

        const isCorrect =
          studentAnswer &&
          studentAnswer.selectedOptions &&
          studentAnswer.selectedOptions.includes(q.correctAnswer);

        const marksAwarded = isCorrect ? q.marks || 1 : 0;
        totalScore += marksAwarded;
        // maxScore += q.marks || 1;

        processedAnswers.push({
          question: q._id,
          selectedOptions: studentAnswer ? studentAnswer.selectedOptions : [],
          isCorrect,
          marksAwarded,
        });
      });

      // ✅ Fix percentage type + guard against divide-by-zero
      let percentage = 0;
      if (maxScore > 0) {
        percentage = Number(((totalScore / maxScore) * 100).toFixed(2));
      }

      // 5. Save submission
      const submission = new Submission({
        assignment: assignmentId,
        test: assignment.test._id,
        student: req.user.id,
        // answers: processedAnswers,
        totalScore,
        maxScore,
        percentage,
      });

      // await submission.save();

      res.status(201).json({
        message: "✅ Test submitted successfully",
        testTile: assignment.test.title,
      });
    } catch (error) {
      console.error("❌ Error submitting test:", error); // <-- Helpful for debugging
      res.status(500).json({
        message: "❌ Error submitting test",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 2. Get My Submission (Student)
 */
router.get(
  "/my/:assignmentId",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      const submission = await Submission.findOne({
        assignment: assignmentId,
        student: req.user.id,
      })
        .populate("test", "title description duration")
        .populate("assignment", "college batch department");

      if (!submission) {
        return res.status(404).json({ message: "❌ No submission found" });
      }

      res.json({ submission });
    } catch (error) {
      res.status(500).json({
        message: "❌ Error fetching submission",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 3. Get All Submissions for Assignment (Admin/Faculty)
 */
router.get(
  "/assignment/:assignmentId",
  authMiddleware,
  roleMiddleware(["admin", "faculty"]),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      const submissions = await Submission.find({ assignment: assignmentId })
        .populate("student", "name email")
        .populate("test", "title description duration");

      res.json({ count: submissions.length, submissions });
    } catch (error) {
      res.status(500).json({
        message: "❌ Error fetching submissions",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 4. Assignment-level Analytics (Admin/Faculty)
 */
router.get(
  "/analytics/assignment/:assignmentId",
  authMiddleware,
  roleMiddleware(["admin", "faculty"]),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      const submissions = await Submission.find({ assignment: assignmentId });

      if (!submissions.length) {
        return res.status(404).json({ message: "❌ No submissions yet" });
      }

      const scores = submissions.map((s) => s.totalScore);
      const percentages = submissions.map((s) => s.percentage);

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const avgPercentage =
        percentages.reduce((a, b) => a + b, 0) / percentages.length;

      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);

      res.json({
        assignmentId,
        totalSubmissions: submissions.length,
        avgScore,
        avgPercentage,
        highest,
        lowest,
        distribution: {
          "0-40": submissions.filter((s) => s.percentage < 40).length,
          "40-60": submissions.filter(
            (s) => s.percentage >= 40 && s.percentage < 60
          ).length,
          "60-80": submissions.filter(
            (s) => s.percentage >= 60 && s.percentage < 80
          ).length,
          "80-100": submissions.filter((s) => s.percentage >= 80).length,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "❌ Error fetching assignment analytics",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 5. Student-level History Analytics
 */
router.get("/student/history/:studentId", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only see their own history
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res.status(403).json({ message: "❌ Not authorized" });
    }

    const submissions = await Submission.find({ student: studentId })
      .populate("assignment", "college batch department")
      .populate("test", "title description duration")
      .sort({ submittedAt: 1 });

    if (!submissions.length) {
      return res
        .status(404)
        .json({ message: "❌ No submissions found for this student" });
    }

    const history = submissions.map((sub) => ({
      testId: sub.test._id,
      testTitle: sub.test.title,
      assignmentId: sub.assignment._id,
      college: sub.assignment.college,
      batch: sub.assignment.batch,
      department: sub.assignment.department,
      submittedAt: sub.submittedAt,
      score: sub.totalScore,
      maxScore: sub.maxScore,
      percentage: sub.percentage,
    }));

    const avgScore = history.reduce((a, h) => a + h.score, 0) / history.length;
    const highest = Math.max(...history.map((h) => h.score));
    const lowest = Math.min(...history.map((h) => h.score));

    res.json({
      studentId,
      totalTestsTaken: history.length,
      avgScore,
      highest,
      lowest,
      progress: history,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Error fetching student history",
      error: error.message,
    });
  }
});

router.get(
  "/analysis/:assignmentId",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;

      const submission = await Submission.findOne({
        assignment: assignmentId,
        student: req.user.id,
      })
        .populate("test", "title description duration")
        .populate({
          path: "answers.question",
          select: "topic difficulty", // or other metadata you want
        });

      if (!submission) {
        return res.status(404).json({ message: "❌ No submission found" });
      }

      // Build analysis data
      const total = submission.answers.length;
      const attempted = submission.answers.filter(
        (a) => a.selectedOptions.length > 0
      ).length;
      const correct = submission.answers.filter((a) => a.isCorrect).length;
      const incorrect = attempted - correct;
      const unattempted = total - attempted;

      const topicStats = {};
      submission.answers.forEach((ans) => {
        const topic = ans.question?.topic || "General";
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0 };
        }
        topicStats[topic].total++;
        if (ans.isCorrect) topicStats[topic].correct++;
      });

      res.json({
        testTitle: submission.test.title,
        submittedAt: submission.submittedAt,
        total,
        attempted,
        correct,
        incorrect,
        unattempted,
        topicStats,
      });
    } catch (error) {
      console.error("❌ Error building analysis:", error);
      res.status(500).json({
        message: "❌ Error building analysis",
        error: error.message,
      });
    }
  }
);

export default router;
