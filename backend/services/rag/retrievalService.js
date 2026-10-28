import User from "../../models/user.model.js";
import Gig from "../../models/gig.model.js";
import Order from "../../models/order.model.js";
import Review from "../../models/review.model.js";

/**
 * Hybrid Retrieval Engine combining MongoDB structured queries and text matching
 */
export const retrieveRelevantContext = async (query) => {
  const queryLower = query.toLowerCase();

  // 1. Fetch all seller/freelancer profiles
  const allSellers = await User.find({ isSeller: true }).select("-password");

  // Filter sellers by query keywords or intent
  let matchedSellers = allSellers.filter((s) => {
    if (queryLower.includes(s.username.toLowerCase())) return true;
    if (s.skills && s.skills.some((sk) => queryLower.includes(sk.toLowerCase()))) return true;
    if (s.desc && s.desc.toLowerCase().split(" ").some((w) => w.length > 3 && queryLower.includes(w))) return true;
    if (s.bioSummary && s.bioSummary.toLowerCase().split(" ").some((w) => w.length > 3 && queryLower.includes(w))) return true;
    if (queryLower.includes("evaluation") || queryLower.includes("test") || queryLower.includes("passed")) {
      if (s.evaluationStatus === "passed" || s.evaluationPassed) return true;
    }
    if (queryLower.includes("rating") || queryLower.includes("top rated") || queryLower.includes("best")) {
      if (s.averageRating >= 4.0) return true;
    }
    if (queryLower.includes("completion") || queryLower.includes("complete")) {
      if (s.completedProjectsCount > 0 || s.completionRate >= 80) return true;
    }
    return false;
  });

  // If no specific keyword filter matched, include top sellers as default context
  if (matchedSellers.length === 0) {
    matchedSellers = allSellers.slice(0, 5);
  }

  const sellerIds = matchedSellers.map((s) => s._id.toString());

  // 2. Fetch associated Gigs
  const gigs = await Gig.find({ userId: { $in: sellerIds } });

  // 3. Fetch associated Completed Orders / Projects
  const orders = await Order.find({
    sellerId: { $in: sellerIds },
    isCompleted: true,
  });

  // 4. Fetch associated Client Reviews
  const sellerGigIds = gigs.map((g) => g._id.toString());
  const reviews = await Review.find({
    $or: [{ sellerId: { $in: sellerIds } }, { gigId: { $in: sellerGigIds } }],
  });

  // 5. Build Source Tracking Metadata
  const sources = [];

  matchedSellers.forEach((s) => {
    sources.push({
      type: "freelancer",
      id: s._id.toString(),
      name: s.username,
      label: `Based on ${s.username}'s Profile`,
    });
  });

  orders.slice(0, 3).forEach((o) => {
    sources.push({
      type: "project",
      id: o._id.toString(),
      name: o.title,
      label: `Based on Project "${o.title}"`,
    });
  });

  reviews.slice(0, 3).forEach((r) => {
    sources.push({
      type: "review",
      id: r._id.toString(),
      name: `Review for ${r.sellerId || "Freelancer"}`,
      label: "Based on Customer Reviews",
    });
  });

  return {
    freelancers: matchedSellers,
    gigs,
    orders,
    reviews,
    sources,
  };
};
