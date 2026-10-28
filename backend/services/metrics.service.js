import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";

/**
 * Configurable performance score weights (must sum to 1.0)
 */
export const PERFORMANCE_WEIGHTS = {
  customerRating: 0.40,
  completionRate: 0.25,
  evaluationScore: 0.15,
  projectExperience: 0.10,
  reviewQuality: 0.10,
};

/**
 * Dynamically recalculates derived freelancer metrics & transparent performance score:
 * - completedProjectsCount
 * - cancelledProjectsCount
 * - totalEarnings
 * - averageRating & ratingCount
 * - performanceScore (transparent weighted calculation)
 * - completionRate (via virtual getter)
 * - semanticProfileText (for SBERT / RAG embedding)
 */
export const recalculateFreelancerMetrics = async (sellerId) => {
  if (!sellerId) return null;

  try {
    // 1. Fetch freelancer user document
    const user = await User.findById(sellerId);
    if (!user || !user.isSeller) return null;

    // 2. Aggregate Order Stats
    const orders = await Order.find({ sellerId });
    let completedCount = 0;
    let cancelledCount = 0;
    let totalEarnings = 0;

    orders.forEach((o) => {
      if (o.status === "cancelled") {
        cancelledCount++;
      } else if (o.isCompleted || o.status === "completed") {
        completedCount++;
        totalEarnings += o.agreedAmount || o.price || 0;
      }
    });

    // 3. Aggregate Review Stats
    const sellerGigs = await Gig.find({ userId: sellerId }).select("_id");
    const sellerGigIds = sellerGigs.map((g) => g._id.toString());

    const reviews = await Review.find({
      $or: [{ sellerId }, { gigId: { $in: sellerGigIds } }],
    });

    const ratingCount = reviews.length;
    const totalStars = reviews.reduce((acc, r) => acc + (r.star || r.rating || 0), 0);
    const averageRating = ratingCount > 0 ? parseFloat((totalStars / ratingCount).toFixed(2)) : 0;

    // 4. Calculate Completion Rate
    const totalAccepted = completedCount + cancelledCount;
    const completionRate = totalAccepted > 0 ? Math.round((completedCount / totalAccepted) * 100) : 100;

    // 5. Calculate Normalized Performance Components (0 - 100)
    const normCustomerRating = (averageRating / 5) * 100; // e.g. 5.0 -> 100, 4.0 -> 80
    const normCompletionRate = completionRate; // 0 - 100
    const normEvaluationScore = user.evaluationScore || 0; // 0 - 100
    const normProjectExperience = Math.min(100, (completedCount / 20) * 100); // Caps at 20 completed projects
    const normReviewQuality = Math.min(100, (ratingCount / 10) * 100); // Caps at 10 reviews

    // 6. Calculate Final Performance Score (0 - 100)
    const performanceScore = Math.round(
      PERFORMANCE_WEIGHTS.customerRating * normCustomerRating +
      PERFORMANCE_WEIGHTS.completionRate * normCompletionRate +
      PERFORMANCE_WEIGHTS.evaluationScore * normEvaluationScore +
      PERFORMANCE_WEIGHTS.projectExperience * normProjectExperience +
      PERFORMANCE_WEIGHTS.reviewQuality * normReviewQuality
    );

    // 7. Generate Semantic Profile Text for SBERT skill matching and RAG chatbot
    const skillsText = (user.skills || []).join(", ");
    const bioText = user.bioSummary || user.desc || "";
    const experienceText = (user.experience || [])
      .map((e) => `${e.title} at ${e.company} (${e.years || 0} yrs): ${e.description || ""}`)
      .join(". ");
    const portfolioText = (user.portfolio || [])
      .map((p) => `${p.title}: ${p.description || ""}`)
      .join(". ");
    const reviewHighlights = reviews
      .slice(0, 5)
      .map((r) => r.desc || r.reviewText)
      .filter(Boolean)
      .join(". ");

    const semanticProfileText = [
      `Freelancer: ${user.username}`,
      `Bio: ${bioText}`,
      `Skills: ${skillsText}`,
      `Experience: ${experienceText}`,
      `Portfolio: ${portfolioText}`,
      `Recent Client Feedback: ${reviewHighlights}`,
    ]
      .filter((s) => s.length > 10)
      .join("\n");

    // 8. Save updated metrics to User document
    user.completedProjectsCount = completedCount;
    user.cancelledProjectsCount = cancelledCount;
    user.totalEarnings = totalEarnings;
    user.averageRating = averageRating;
    user.ratingCount = ratingCount;
    user.performanceScore = performanceScore;
    user.semanticProfileText = semanticProfileText;
    user.embeddingStatus = "pending";

    await user.save();
    return user;
  } catch (err) {
    console.error(`Error recalculating metrics for seller ${sellerId}:`, err.message);
    return null;
  }
};

/**
 * Returns complete performance breakdown and weights for API output
 */
export const getFreelancerPerformanceDetails = (user) => {
  const completedCount = user.completedProjectsCount || 0;
  const cancelledCount = user.cancelledProjectsCount || 0;
  const totalAccepted = completedCount + cancelledCount;
  const completionRate = totalAccepted > 0 ? Math.round((completedCount / totalAccepted) * 100) : 100;
  const averageRating = user.averageRating || 0;
  const ratingCount = user.ratingCount || 0;

  const normCustomerRating = (averageRating / 5) * 100;
  const normCompletionRate = completionRate;
  const normEvaluationScore = user.evaluationScore || 0;
  const normProjectExperience = Math.min(100, (completedCount / 20) * 100);
  const normReviewQuality = Math.min(100, (ratingCount / 10) * 100);

  const averageProjectValue = completedCount > 0 ? parseFloat((user.totalEarnings / completedCount).toFixed(2)) : 0;

  return {
    performanceScore: user.performanceScore || 0,
    formula: "0.40 * customerRating + 0.25 * completionRate + 0.15 * evaluationScore + 0.10 * projectExperience + 0.10 * reviewQuality",
    weights: PERFORMANCE_WEIGHTS,
    normalizedComponents: {
      customerRating: normCustomerRating,
      completionRate: normCompletionRate,
      evaluationScore: normEvaluationScore,
      projectExperience: normProjectExperience,
      reviewQuality: normReviewQuality,
    },
    metrics: {
      averageRating,
      ratingCount,
      totalProjects: totalAccepted,
      completedProjects: completedCount,
      cancelledProjects: cancelledCount,
      completionRate,
      totalCompletedProjectValue: user.totalEarnings || 0,
      averageProjectValue,
      evaluationScore: user.evaluationScore || 0,
      evaluationStatus: user.evaluationStatus || "not_taken",
      evaluationPassed: user.evaluationPassed || false,
    },
  };
};
