import Review from "../models/review.model.js";
import Gig from "../models/gig.model.js";

export const createReview = async (req, res, next) => {
  if (req.isSeller)
    return res.status(403).json("Sellers can't create a review!");

  try {
    const existingReview = await Review.findOne({
      gigId: req.body.gigId,
      userId: req.userId,
    });

    if (existingReview)
      return res.status(403).json("You have already created a review for this gig!");

    const newReview = new Review({
      userId: req.userId,
      gigId: req.body.gigId,
      desc: req.body.desc,
      star: req.body.star,
    });

    const savedReview = await newReview.save();

    // Update gig totalStars and starNumber
    await Gig.findByIdAndUpdate(req.body.gigId, {
      $inc: { totalStars: req.body.star, starNumber: 1 },
    });

    res.status(201).json(savedReview);
  } catch (err) {
    next(err);
  }
};

export const getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId });
    res.status(200).json(reviews);
  } catch (err) {
    next(err);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json("Review not found!");

    if (review.userId !== req.userId)
      return res.status(403).json("You can delete only your own review!");

    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json("Review has been deleted!");
  } catch (err) {
    next(err);
  }
};
