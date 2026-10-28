import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    isSeller: {
      type: Boolean,
      default: false,
    },
    resume: {
      type: String,
      required: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      default: 0,
    },
    bioSummary: {
      type: String,
      required: false,
    },
    experience: [
      {
        title: String,
        company: String,
        years: Number,
        description: String,
      },
    ],
    portfolio: [
      {
        title: String,
        description: String,
        link: String,
        image: String,
      },
    ],
    completedProjectsCount: {
      type: Number,
      default: 0,
    },
    cancelledProjectsCount: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    performanceScore: {
      type: Number,
      default: 0,
    },
    evaluationScore: {
      type: Number,
      default: 0,
    },
    evaluationStatus: {
      type: String,
      enum: ["not_taken", "pending", "passed", "failed"],
      default: "not_taken",
    },
    evaluationAttempts: {
      type: Number,
      default: 0,
    },
    evaluationPassed: {
      type: Boolean,
      default: false,
    },
    semanticProfileText: {
      type: String,
      default: "",
    },
    embeddingStatus: {
      type: String,
      enum: ["pending", "embedded", "failed"],
      default: "pending",
    },
    availability: {
      type: Boolean,
      default: true,
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getter for completionRate
userSchema.virtual("completionRate").get(function () {
  const total = (this.completedProjectsCount || 0) + (this.cancelledProjectsCount || 0);
  if (total === 0) return 100;
  return Math.round(((this.completedProjectsCount || 0) / total) * 100);
});

// Alias virtual getter for bio (maps to desc or bioSummary)
userSchema.virtual("bio").get(function () {
  return this.bioSummary || this.desc || "";
});

// Indexes for fast recommendation, skill matching, evaluation filters
userSchema.index({ isSeller: 1, evaluationStatus: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ averageRating: -1 });

export default mongoose.model("User", userSchema);
