import express from "express";
import {
  createReview,
  getReviews,
  getFreelancerReviews,
  getRatingSummary,
  deleteReview,
} from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", verifyToken, createReview);
router.get("/freelancer/:id", getFreelancerReviews);
router.get("/summary/:id", getRatingSummary);
router.get("/:gigId", getReviews);
router.delete("/:id", verifyToken, deleteReview);

export default router;
