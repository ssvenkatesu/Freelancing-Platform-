import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";
import { recalculateFreelancerMetrics } from "../services/metrics.service.js";

dotenv.config();

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/freelancePlatform";
    console.log("🔄 Connecting to MongoDB for migration:", mongoUri);
    await mongoose.connect(mongoUri);

    console.log("🛠️ Starting backward-compatible schema migration...");

    // 1. Migrate Users
    const users = await User.find();
    let usersUpdated = 0;

    for (const u of users) {
      let modified = false;

      if (!u.skills) { u.skills = []; modified = true; }
      if (u.completedProjectsCount === undefined) { u.completedProjectsCount = 0; modified = true; }
      if (u.cancelledProjectsCount === undefined) { u.cancelledProjectsCount = 0; modified = true; }
      if (u.totalEarnings === undefined) { u.totalEarnings = 0; modified = true; }
      if (u.averageRating === undefined) { u.averageRating = 0; modified = true; }
      if (u.ratingCount === undefined) { u.ratingCount = 0; modified = true; }
      if (!u.evaluationStatus) { u.evaluationStatus = "not_taken"; modified = true; }
      if (u.evaluationScore === undefined) { u.evaluationScore = 0; modified = true; }
      if (u.evaluationAttempts === undefined) { u.evaluationAttempts = 0; modified = true; }
      if (u.evaluationPassed === undefined) { u.evaluationPassed = false; modified = true; }
      if (!u.semanticProfileText) { u.semanticProfileText = ""; modified = true; }
      if (!u.embeddingStatus) { u.embeddingStatus = "pending"; modified = true; }
      if (u.availability === undefined) { u.availability = true; modified = true; }
      if (!u.preferredCategories) { u.preferredCategories = []; modified = true; }

      if (modified) {
        await u.save();
        usersUpdated++;
      }

      if (u.isSeller) {
        await recalculateFreelancerMetrics(u._id);
      }
    }
    console.log(`✅ Users migration complete (${usersUpdated} updated).`);

    // 2. Migrate Orders
    const orders = await Order.find();
    let ordersUpdated = 0;

    for (const o of orders) {
      let modified = false;

      if (!o.status) {
        o.status = o.isCompleted ? "completed" : "in_progress";
        modified = true;
      }
      if (!o.requiredSkills) { o.requiredSkills = []; modified = true; }
      if (o.agreedAmount === undefined) { o.agreedAmount = o.price || 0; modified = true; }
      if (!o.startedAt) { o.startedAt = o.createdAt || new Date(); modified = true; }
      if (!o.completedAt) { o.completedAt = o.updatedAt || new Date(); modified = true; }
      if (!o.completionStatus) { o.completionStatus = "on_time"; modified = true; }

      if (modified) {
        await o.save();
        ordersUpdated++;
      }
    }
    console.log(`✅ Orders migration complete (${ordersUpdated} updated).`);

    // 3. Migrate Reviews
    const reviews = await Review.find();
    let reviewsUpdated = 0;

    for (const r of reviews) {
      let modified = false;

      if (!r.sellerId) {
        const gig = await Gig.findById(r.gigId);
        if (gig) {
          r.sellerId = gig.userId;
          modified = true;
        }
      }
      if (r.projectCompleted === undefined) { r.projectCompleted = true; modified = true; }
      if (r.projectAmount === undefined) { r.projectAmount = 0; modified = true; }

      if (modified) {
        await r.save();
        reviewsUpdated++;
      }
    }
    console.log(`✅ Reviews migration complete (${reviewsUpdated} updated).`);

    console.log("🎉 Migration finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
};

migrate();
