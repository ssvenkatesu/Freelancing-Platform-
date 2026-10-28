import express from "express";
import {
  getProposal,
  getMatchedFreelancers,
  getSmartReplies,
  handleRagChat,
} from "../controllers/ai.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/chat", handleRagChat);
router.post("/rag-chat", handleRagChat);
router.post("/generate-proposal", verifyToken, getProposal);
router.post("/match-freelancers", getMatchedFreelancers);
router.post("/smart-reply", verifyToken, getSmartReplies);

export default router;
