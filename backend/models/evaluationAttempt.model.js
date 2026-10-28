import mongoose from "mongoose";
const { Schema } = mongoose;

const evaluationAttemptSchema = new Schema(
  {
    freelancerId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
    },
    questionIds: {
      type: [String],
      required: true,
    },
    answers: [
      {
        questionId: String,
        selectedOption: Number,
      },
    ],
    correctAnswers: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    scorePercentage: {
      type: Number,
      default: 0,
    },
    timeLimitSeconds: {
      type: Number,
      default: 600, // 10 minutes default
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    passStatus: {
      type: String,
      enum: ["in_progress", "passed", "failed"],
      default: "in_progress",
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

evaluationAttemptSchema.index({ freelancerId: 1, passStatus: 1 });

export default mongoose.model("EvaluationAttempt", evaluationAttemptSchema);
