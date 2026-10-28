import express from "express";
import {
  deleteUser,
  getUser,
  updateUser,
  getSellers,
  getFreelancerPerformance,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.get("/sellers/all", getSellers);
router.get("/freelancers/:id/performance", getFreelancerPerformance);
router.get("/:id/performance", getFreelancerPerformance);
router.delete("/:id", verifyToken, deleteUser);
router.put("/:id", verifyToken, updateUser);
router.get("/:id", getUser);

export default router;
