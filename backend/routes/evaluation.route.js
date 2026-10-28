import express from "express";
import {
  getCategories,
  startEvaluation,
  submitEvaluation,
  getMyResults,
  getFreelancerEvaluation,
  addQuestion,
} from "../controllers/evaluation.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.get("/categories", getCategories);
router.post("/start", verifyToken, startEvaluation);
router.post("/submit", verifyToken, submitEvaluation);
router.get("/my-result", verifyToken, getMyResults);
router.get("/freelancer/:id", getFreelancerEvaluation);
router.post("/questions", verifyToken, addQuestion);

export default router;
