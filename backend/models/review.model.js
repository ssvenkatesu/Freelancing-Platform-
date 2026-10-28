import mongoose from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    gigId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    star: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5],
    },
    desc: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: false,
    },
    sellerId: {
      type: String,
      required: false,
    },
    projectCompleted: {
      type: Boolean,
      default: true,
    },
    projectAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getters for specification aliases
reviewSchema.virtual("rating").get(function () {
  return this.star;
});

reviewSchema.virtual("reviewText").get(function () {
  return this.desc;
});

reviewSchema.virtual("project").get(function () {
  return this.orderId || this.gigId;
});

reviewSchema.virtual("client").get(function () {
  return this.userId;
});

reviewSchema.virtual("freelancer").get(function () {
  return this.sellerId;
});

// Indexes for review analysis & freelancer aggregate queries
reviewSchema.index({ sellerId: 1 });
reviewSchema.index({ gigId: 1 });
reviewSchema.index({ star: -1 });

export default mongoose.model("Review", reviewSchema);
