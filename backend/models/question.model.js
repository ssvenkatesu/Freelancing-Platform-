import mongoose from "mongoose";
const { Schema } = mongoose;

const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    options: {
      type: [String],
      required: true,
      validate: [
        (val) => val.length === 4,
        "Question must provide exactly 4 options.",
      ],
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: false,
    },
    marks: {
      type: Number,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ category: 1, active: 1, difficulty: 1 });

export default mongoose.model("Question", questionSchema);
