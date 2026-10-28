import Question from "../models/question.model.js";
import EvaluationAttempt from "../models/evaluationAttempt.model.js";
import User from "../models/user.model.js";
import { recalculateFreelancerMetrics } from "../services/metrics.service.js";

// Configurable Passing Threshold (70%)
export const PASSING_THRESHOLD = 70;

// Configurable Test Question Count (10 questions)
export const TEST_QUESTION_COUNT = 10;

/**
 * GET /api/evaluations/categories
 * Returns list of supported categories with question counts
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Question.aggregate([
      { $match: { active: true } },
      { $group: { _id: "$category", questionCount: { $sum: 1 } } },
      { $project: { category: "$_id", questionCount: 1, _id: 0 } },
      { $sort: { category: 1 } },
    ]);

    // Default categories if bank is currently empty
    const defaultCategories = [
      "JavaScript", "React", "Node.js", "Python", "Java",
      "SQL", "MongoDB", "HTML/CSS", "UI/UX", "Cybersecurity", "Data Science"
    ];

    const categoryMap = new Map(categories.map((c) => [c.category, c.questionCount]));
    const result = defaultCategories.map((cat) => ({
      category: cat,
      questionCount: categoryMap.get(cat) || 0,
    }));

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/evaluations/start
 * Starts a new evaluation attempt or returns an existing active attempt
 */
export const startEvaluation = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json("You are not authenticated!");
  }

  const { category } = req.body;
  if (!category) {
    return res.status(400).json("Category is required to start an evaluation!");
  }

  try {
    // Check for an active in-progress attempt
    const existingActive = await EvaluationAttempt.findOne({
      freelancerId: req.userId,
      passStatus: "in_progress",
    });

    const now = new Date();

    if (existingActive) {
      // Check if attempt is still within time limit + 30s grace
      const timeLimitMs = (existingActive.timeLimitSeconds + 30) * 1000;
      const elapsedTime = now - new Date(existingActive.startedAt);

      if (elapsedTime <= timeLimitMs) {
        // Return existing active questions (WITHOUT correct answers!)
        const questions = await Question.find({
          _id: { $in: existingActive.questionIds },
        }).select("-correctAnswer");

        return res.status(200).json({
          message: "Resuming active evaluation attempt.",
          attemptId: existingActive._id,
          category: existingActive.category,
          timeLimitSeconds: existingActive.timeLimitSeconds,
          startedAt: existingActive.startedAt,
          remainingSeconds: Math.max(0, Math.floor((timeLimitMs - elapsedTime) / 1000)),
          questions,
        });
      } else {
        // Expired active attempt -> mark as failed
        existingActive.passStatus = "failed";
        existingActive.submittedAt = now;
        await existingActive.save();
      }
    }

    // Fetch questions for requested category
    let availableQuestions = await Question.find({
      category: { $regex: new RegExp(`^${category}$`, "i") },
      active: true,
    });

    // Fallback if exact category has fewer than 10 questions: grab active questions across tech categories
    if (availableQuestions.length < TEST_QUESTION_COUNT) {
      const extraQuestions = await Question.find({ active: true });
      availableQuestions = [...availableQuestions, ...extraQuestions];
      // Deduplicate by ID
      const seen = new Set();
      availableQuestions = availableQuestions.filter((q) => {
        const idStr = q._id.toString();
        if (seen.has(idStr)) return false;
        seen.add(idStr);
        return true;
      });
    }

    if (availableQuestions.length === 0) {
      return res.status(400).json("No questions available for this category yet!");
    }

    // Shuffle & pick 10 questions
    const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, TEST_QUESTION_COUNT);
    const questionIds = selectedQuestions.map((q) => q._id.toString());

    // Count previous attempts for freelancer
    const previousAttemptCount = await EvaluationAttempt.countDocuments({
      freelancerId: req.userId,
    });

    const newAttempt = new EvaluationAttempt({
      freelancerId: req.userId,
      category,
      questionIds,
      timeLimitSeconds: 600, // 10 minutes
      startedAt: now,
      passStatus: "in_progress",
      attemptNumber: previousAttemptCount + 1,
    });

    const savedAttempt = await newAttempt.save();

    // Strip correctAnswer before returning to client (SECURITY REQUIREMENT)
    const clientQuestions = selectedQuestions.map((q) => ({
      _id: q._id,
      question: q.question,
      category: q.category,
      difficulty: q.difficulty,
      options: q.options,
    }));

    res.status(201).json({
      attemptId: savedAttempt._id,
      category,
      timeLimitSeconds: savedAttempt.timeLimitSeconds,
      startedAt: savedAttempt.startedAt,
      remainingSeconds: savedAttempt.timeLimitSeconds,
      questions: clientQuestions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/evaluations/submit
 * Grades evaluation test server-side, updates freelancer status and metrics
 */
export const submitEvaluation = async (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json("You are not authenticated!");
  }

  const { attemptId, answers } = req.body;
  if (!attemptId) {
    return res.status(400).json("Attempt ID is required!");
  }

  try {
    const attempt = await EvaluationAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json("Evaluation attempt not found!");
    }

    if (attempt.freelancerId !== req.userId) {
      return res.status(403).json("You are not authorized to submit this attempt!");
    }

    if (attempt.passStatus !== "in_progress") {
      return res.status(400).json("This evaluation attempt has already been submitted!");
    }

    const now = new Date();

    // Fetch actual questions from DB to grade server-side
    const questions = await Question.find({
      _id: { $in: attempt.questionIds },
    });

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
    let correctAnswers = 0;
    const submittedAnswers = Array.isArray(answers) ? answers : [];

    const detailedFeedback = attempt.questionIds.map((qId) => {
      const q = questionMap.get(qId);
      const userAns = submittedAnswers.find((a) => String(a.questionId) === qId);
      const selectedOption = userAns ? Number(userAns.selectedOption) : -1;
      const isCorrect = q && selectedOption === q.correctAnswer;

      if (isCorrect) correctAnswers++;

      return {
        questionId: qId,
        question: q?.question || "",
        options: q?.options || [],
        selectedOption,
        correctOption: q?.correctAnswer,
        isCorrect,
        explanation: q?.explanation || "",
      };
    });

    const totalQuestions = attempt.questionIds.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = scorePercentage >= PASSING_THRESHOLD;
    const passStatus = passed ? "passed" : "failed";

    // Update attempt
    attempt.answers = submittedAnswers;
    attempt.correctAnswers = correctAnswers;
    attempt.scorePercentage = scorePercentage;
    attempt.passStatus = passStatus;
    attempt.submittedAt = now;
    await attempt.save();

    // Update User record with evaluation status & score
    const user = await User.findById(req.userId);
    if (user) {
      user.evaluationScore = scorePercentage;
      user.evaluationStatus = passStatus;
      user.evaluationPassed = passed || user.evaluationPassed;
      user.evaluationAttempts = (user.evaluationAttempts || 0) + 1;
      await user.save();

      // Recalculate dynamic metrics and transparent performance index
      recalculateFreelancerMetrics(req.userId).catch((e) =>
        console.error("Error updating metrics after evaluation:", e)
      );
    }

    res.status(200).json({
      message: passed ? "Congratulations! You passed the evaluation test. 🎉" : "Evaluation completed.",
      attemptId: attempt._id,
      category: attempt.category,
      scorePercentage,
      correctAnswers,
      totalQuestions,
      passStatus,
      passed,
      passingThreshold: PASSING_THRESHOLD,
      submittedAt: now,
      feedback: detailedFeedback,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/evaluations/my-result
 * Returns logged-in user's evaluation attempts
 */
export const getMyResults = async (req, res, next) => {
  try {
    const attempts = await EvaluationAttempt.find({ freelancerId: req.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(attempts);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/evaluations/freelancer/:id
 * Returns public evaluation summary for a freelancer
 */
export const getFreelancerEvaluation = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "evaluationScore evaluationStatus evaluationAttempts evaluationPassed"
    );

    if (!user) return res.status(404).json("Freelancer not found!");

    const lastPassedAttempt = await EvaluationAttempt.findOne({
      freelancerId: req.params.id,
      passStatus: "passed",
    }).sort({ submittedAt: -1 });

    res.status(200).json({
      freelancerId: req.params.id,
      evaluationScore: user.evaluationScore || 0,
      evaluationStatus: user.evaluationStatus || "not_taken",
      evaluationAttempts: user.evaluationAttempts || 0,
      evaluationPassed: user.evaluationPassed || false,
      lastCategoryTested: lastPassedAttempt?.category || null,
      dateCompleted: lastPassedAttempt?.submittedAt || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/evaluations/questions
 * Adds a new question to the bank (Admin endpoint)
 */
export const addQuestion = async (req, res, next) => {
  try {
    const newQuestion = new Question(req.body);
    const saved = await newQuestion.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};
