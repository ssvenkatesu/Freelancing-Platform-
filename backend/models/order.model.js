import mongoose from "mongoose";
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    gigId: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    buyerId: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: true,
    },
    payment_intent: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    agreedAmount: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "completed",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    completionStatus: {
      type: String,
      enum: ["on_time", "late", "cancelled"],
      default: "on_time",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual aliases for compatibility with new requirement specs
orderSchema.virtual("freelancer").get(function () {
  return this.sellerId;
});

orderSchema.virtual("client").get(function () {
  return this.buyerId;
});

orderSchema.virtual("effectiveAmount").get(function () {
  return this.agreedAmount || this.price || 0;
});

// Indexes for order history and freelancer stats tracking
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ buyerId: 1 });
orderSchema.index({ gigId: 1 });

export default mongoose.model("Order", orderSchema);
