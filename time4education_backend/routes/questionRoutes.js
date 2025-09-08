// routes/questionRoutes.js
import express from "express";
import Question from "../models/Question.js";
import Test from "../models/Test.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * ✅ 1) Create a Question (admin)
 * - Accepts either `tests: []` (array of testIds) or single `testId`
 * - Reusable question bank by default (tests can be empty)
 */
router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const {
      type,
      questionText,
      options = [],
      correctAnswer = "",
      sampleInput = "",
      sampleOutput = "",
      hiddenTestCases = [],
      category = "general",
      difficulty = "medium",
      marks = 1,
      explanation = "",
      tests = [],
      testId, // optional single test
    } = req.body;

    // normalize tests array
    const testIds = Array.isArray(tests)
      ? [...new Set(tests.concat(testId ? [testId] : []))]
      : testId
      ? [testId]
      : [];

    // simple MCQ validation
    if (type === "mcq") {
      if (!options || options.length < 2) {
        return res
          .status(400)
          .json({ success: false, message: "MCQ needs at least 2 options" });
      }
      if (!correctAnswer || !options.includes(correctAnswer)) {
        return res.status(400).json({
          success: false,
          message: "MCQ correctAnswer must be one of the options",
        });
      }
    }

    const question = await Question.create({
      type,
      questionText,
      options,
      correctAnswer,
      sampleInput,
      sampleOutput,
      hiddenTestCases,
      category,
      difficulty,
      marks,
      explanation,
      tests: testIds,
      createdBy: req.user.id,
    });

    // link question into each test’s questions[]
    if (testIds.length > 0) {
      await Test.updateMany(
        { _id: { $in: testIds } },
        { $addToSet: { questions: question._id } }
      );
    }

    res.status(201).json({
      success: true,
      message: "✅ Question created",
      question,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "❌ Error", error: error.message });
  }
});

/**
 * ✅ 2) Bulk Create Questions (admin)
 * - Accepts [{ ...questionFields, tests?:[], testId?:string }, ...]
 * - Efficiently links to tests
 */
router.post(
  "/bulk",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { questions = [] } = req.body;
      if (!Array.isArray(questions) || questions.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "No questions provided" });
      }

      // normalize input & add createdBy
      const normalized = questions.map((q) => {
        const testIds = Array.isArray(q.tests)
          ? [...new Set(q.tests.concat(q.testId ? [q.testId] : []))]
          : q.testId
          ? [q.testId]
          : [];
        return {
          type: q.type,
          questionText: q.questionText,
          options: q.options || [],
          correctAnswer: q.correctAnswer || "",
          sampleInput: q.sampleInput || "",
          sampleOutput: q.sampleOutput || "",
          hiddenTestCases: q.hiddenTestCases || [],
          category: q.category || "general",
          difficulty: q.difficulty || "medium",
          marks: q.marks ?? 1,
          explanation: q.explanation || "",
          tests: testIds,
          createdBy: req.user.id,
        };
      });

      const inserted = await Question.insertMany(normalized, {
        ordered: false,
      });

      // build testId -> [questionIds] map to update tests efficiently
      const byTest = new Map();
      inserted.forEach((q) => {
        (q.tests || []).forEach((t) => {
          if (!byTest.has(String(t))) byTest.set(String(t), []);
          byTest.get(String(t)).push(q._id);
        });
      });

      // update each test’s questions array
      await Promise.all(
        Array.from(byTest.entries()).map(([t, qIds]) =>
          Test.findByIdAndUpdate(t, {
            $addToSet: { questions: { $each: qIds } },
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `✅ ${inserted.length} questions added`,
        questions: inserted,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Bulk error",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 3) Get All Questions (admin)
 * - Filters: category, difficulty, type, testId, keyword
 * - Pagination: page, limit
 */
router.get("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const {
      category,
      difficulty,
      type,
      testId,
      keyword,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (testId) query.tests = testId;
    if (keyword) query.$text = { $search: keyword };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
      Question.find(query)
        .select("-hiddenTestCases") // admins can see correctAnswer
        .populate("tests", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Question.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Fetch error",
      error: error.message,
    });
  }
});

/**
 * ✅ 4) Get Questions for a Test (admin & student)
 * - Students don’t receive answer keys or hidden test cases
 */
router.get("/test/:testId", authMiddleware, async (req, res) => {
  try {
    const { testId } = req.params;
    let q = Question.find({ tests: testId, isActive: true });

    if (req.user.role === "student") {
      q = q.select("-correctAnswer -hiddenTestCases -createdBy -__v");
    } else {
      q = q.select("-__v").populate("tests", "title");
    }

    const questions = await q.lean();
    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Fetch error",
      error: error.message,
    });
  }
});

/**
 * ✅ 5) Get Question Bank only (admin)
 * - Only questions not attached to any test
 */
router.get(
  "/bank",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { category, difficulty, type, keyword } = req.query;
      const filters = { tests: { $size: 0 }, isActive: true };
      if (category) filters.category = category;
      if (difficulty) filters.difficulty = difficulty;
      if (type) filters.type = type;
      if (keyword) filters.$text = { $search: keyword };

      const questions = await Question.find(filters)
        .select("-hiddenTestCases")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, count: questions.length, questions });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Bank fetch error",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 6) Get Single Question (admin & student)
 * - Students don’t receive answer keys or hidden test cases
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    let query = Question.findById(req.params.id);
    if (req.user.role === "student") {
      query = query.select("-correctAnswer -hiddenTestCases -createdBy -__v");
    } else {
      query = query.select("-__v").populate("tests", "title");
    }
    const question = await query;
    if (!question)
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });

    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Fetch error",
      error: error.message,
    });
  }
});

/**
 * ✅ 7) Update Question (admin)
 */
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const updated = await Question.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Question not found" });

      res.json({
        success: true,
        message: "✅ Question updated",
        question: updated,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Update error",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 8) Attach Question → Test (admin)
 */
// ✅ Attach Question to Test
router.put(
  "/:id/attach/:testId",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { id, testId } = req.params;

      const [question, test] = await Promise.all([
        Question.findByIdAndUpdate(
          id,
          { $addToSet: { tests: testId } },
          { new: true }
        ),
        Test.findByIdAndUpdate(
          testId,
          { $addToSet: { questions: id } },
          { new: true }
        ),
      ]);

      if (!question || !test) {
        return res
          .status(404)
          .json({ success: false, message: "Question or Test not found" });
      }

      res.json({
        success: true,
        message: "✅ Question attached to test",
        question,
        test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error attaching question to test",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 8A) Attach Question → Test (admin)
 */
// ✅ Attach Question to Multiple Tests

router.post(
  "/bulk-attach-tests",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { testIds } = req.body; // array of test ObjectIds
      if (!Array.isArray(testIds) || testIds.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "testIds required" });
      }

      // 1. Attach all tests to all questions
      const questionUpdate = await Question.updateMany(
        {},
        { $addToSet: { tests: { $each: testIds } } }
      );

      // 2. (Optional) Attach all questions to all tests
      const allQuestionIds = await Question.find().distinct("_id");
      const testUpdate = await Test.updateMany(
        { _id: { $in: testIds } },
        { $addToSet: { questions: { $each: allQuestionIds } } }
      );

      res.json({
        success: true,
        message: "✅ All tests linked to all questions (and vice versa)",
        questionUpdate,
        testUpdate,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error in bulk attach",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 9) Detach Question ← Test (admin)
 * - Keeps the question in the bank if no tests remain
 * - Optional cleanup if no tests reference the question anymore
 */
router.put(
  "/:id/detach/:testId",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { id, testId } = req.params;

      const [question, test] = await Promise.all([
        Question.findByIdAndUpdate(
          id,
          { $pull: { tests: testId } },
          { new: true }
        ),
        Test.findByIdAndUpdate(
          testId,
          { $pull: { questions: id } },
          { new: true }
        ),
      ]);

      if (!question || !test) {
        return res
          .status(404)
          .json({ success: false, message: "Question or Test not found" });
      }

      // 🔧 Optional cleanup → delete question if no longer attached to any test
      if (question.tests.length === 0) {
        // ❓Choice 1: keep in bank (default, safer)
        // do nothing
        // ❓Choice 2: auto-delete unused questions
        // await Question.findByIdAndDelete(id);
      }

      res.json({
        success: true,
        message: "✅ Question detached from test",
        question,
        test,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error detaching question from test",
        error: error.message,
      });
    }
  }
);

/**
 * ✅ 10) Delete Question (admin only)
 * - Prevents deletion if still attached to tests
 * - Ensures clean question bank management
 */
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const question = await Question.findById(req.params.id);

      if (!question) {
        return res
          .status(404)
          .json({ success: false, message: "❌ Question not found" });
      }

      if (question.tests && question.tests.length > 0) {
        return res.status(400).json({
          success: false,
          message: "❌ Cannot delete — question is still attached to tests",
          attachedTests: question.tests,
        });
      }

      await Question.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "✅ Question deleted successfully (from bank)",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "❌ Error deleting question",
        error: error.message,
      });
    }
  }
);

export default router;
