import express from "express";
import { getRecommendations } from "../controllers/recommendation.controller.js";

const router = express.Router();

router.post("/freelancers", getRecommendations);
router.post("/", getRecommendations);

export default router;
