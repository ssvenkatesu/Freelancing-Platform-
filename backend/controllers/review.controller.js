import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { recalculateFreelancerMetrics } from "../services/metrics.service.js";

/**
 * Creates a review for a completed project/order with strict security checks
 */
export const createReview = async (req, res, next) => {
  if (req.isSeller) {
    return res.status(403).json("Only buyers/clients can submit reviews!");
  }

  const { gigId, orderId, star, rating, desc, reviewText } = req.body;
  const finalStar = Number(star || rating);
  const finalDesc = desc || reviewText;

  // Validation: Rating Range (1 to 5)
  if (!finalStar || finalStar < 1 || finalStar > 5 || !Number.isInteger(finalStar)) {
    return res.status(400).json("Rating must be an integer between 1 and 5!");
  }

  // Validation: Non-empty description
  if (!finalDesc || !finalDesc.trim()) {
    return res.status(400).json("Review text is required!");
  }

  try {
    let targetSellerId = "";
    let targetGigId = gigId;
    let targetOrderId = orderId || "";
    let projectAmount = 0;

    if (targetOrderId) {
      const order = await Order.findById(targetOrderId);
      if (!order) {
        return res.status(404).json("Associated order not found!");
      }

      // Security Check 1: Only the buyer of the order can submit a review
      if (order.buyerId !== req.userId) {
        return res.status(403).json("Only the client who purchased this order can leave a review!");
      }

      // Security Check 2: Project must be completed
      if (!order.isCompleted && order.status !== "completed") {
        return res.status(400).json("Reviews can only be submitted for completed projects!");
      }

      targetSellerId = order.sellerId;
      targetGigId = order.gigId;
      projectAmount = order.agreedAmount || order.price || 0;

      // Duplicate Check by Order ID
      const existingOrderReview = await Review.findOne({ orderId: targetOrderId });
      if (existingOrderReview) {
        return res.status(403).json("You have already reviewed this completed order!");
      }
    } else if (targetGigId) {
      const gig = await Gig.findById(targetGigId);
      if (!gig) return res.status(404).json("Gig not found!");
      targetSellerId = gig.userId;

      // Duplicate Check by Gig ID and Buyer ID
      const existingGigReview = await Review.findOne({ gigId: targetGigId, userId: req.userId });
      if (existingGigReview) {
        return res.status(403).json("You have already submitted a review for this gig!");
      }
    } else {
      return res.status(400).json("Order ID or Gig ID is required to submit a review!");
    }

    const newReview = new Review({
      userId: req.userId,
      gigId: targetGigId,
      orderId: targetOrderId,
      sellerId: targetSellerId,
      star: finalStar,
      desc: finalDesc.trim(),
      projectCompleted: true,
      projectAmount,
    });

    const savedReview = await newReview.save();

    // Increment sales/stars on Gig if applicable
    if (targetGigId) {
      await Gig.findByIdAndUpdate(targetGigId, {
        $inc: { totalStars: finalStar, starNumber: 1 },
      });
    }

    // Recalculate dynamic freelancer performance & rating metrics
    if (targetSellerId) {
      recalculateFreelancerMetrics(targetSellerId).catch((err) =>
        console.error("Error updating freelancer metrics:", err)
      );
    }

    res.status(201).json(savedReview);
  } catch (err) {
    next(err);
  }
};

/**
 * Gets reviews for a specific gig
 */
export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/freelancer/:id
 * Gets all client reviews submitted for a specific freelancer
 */
export const getFreelancerReviews = async (req, res, next) => {
  try {
    const sellerId = req.params.id;
    const sellerGigs = await Gig.find({ userId: sellerId }).select("_id");
    const sellerGigIds = sellerGigs.map((g) => g._id.toString());

    const reviews = await Review.find({
      $or: [{ sellerId }, { gigId: { $in: sellerGigIds } }],
    }).sort({ createdAt: -1 });

    // Enrich reviews with reviewer user details
    const reviewerIds = [...new Set(reviews.map((r) => r.userId))];
    const reviewers = await User.find({ _id: { $in: reviewerIds } }).select("username img country");

    const enrichedReviews = reviews.map((r) => {
      const reviewer = reviewers.find((u) => u._id.toString() === r.userId);
      return {
        ...r.toObject(),
        reviewer: reviewer || { username: "Client", country: "Global" },
      };
    });

    res.status(200).json(enrichedReviews);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reviews/summary/:id
 * Gets rating distribution (5★ to 1★), average rating, and total review count
 */
export const getRatingSummary = async (req, res, next) => {
  try {
    const sellerId = req.params.id;
    const sellerGigs = await Gig.find({ userId: sellerId }).select("_id");
    const sellerGigIds = sellerGigs.map((g) => g._id.toString());

    const reviews = await Review.find({
      $or: [{ sellerId }, { gigId: { $in: sellerGigIds } }],
    });

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalStars = 0;

    reviews.forEach((r) => {
      const star = r.star || r.rating || 5;
      if (distribution[star] !== undefined) distribution[star]++;
      totalStars += star;
    });

    const ratingCount = reviews.length;
    const averageRating = ratingCount > 0 ? parseFloat((totalStars / ratingCount).toFixed(2)) : 0;

    res.status(200).json({
      sellerId,
      averageRating,
      ratingCount,
      distribution,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes a review owned by user
 */
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json("Review not found!");

    if (review.userId !== req.userId)
      return res.status(403).json("You can delete only your own review!");

    await Review.findByIdAndDelete(req.params.id);

    if (review.sellerId) {
      recalculateFreelancerMetrics(review.sellerId).catch((err) =>
        console.error("Error updating freelancer metrics:", err)
      );
    }

    res.status(200).json("Review has been deleted!");
  } catch (err) {
    next(err);
  }
};
