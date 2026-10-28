import User from "../models/user.model.js";
import { recalculateFreelancerMetrics, getFreelancerPerformanceDetails } from "../services/metrics.service.js";

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (req.userId !== user._id.toString()) {
      return res.status(403).json("You can delete only your own account!");
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User deleted.");
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found!");

    const { password, ...info } = user._doc;
    res.status(200).json(info);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json("You can update only your account!");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const getSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ isSeller: true }).select("-password");
    res.status(200).json(sellers);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/freelancers/:id/performance
 * Returns detailed performance score, weights breakdown, and project metrics
 */
export const getFreelancerPerformance = async (req, res, next) => {
  try {
    const user = await recalculateFreelancerMetrics(req.params.id);
    if (!user) {
      const existingUser = await User.findById(req.params.id);
      if (!existingUser) return res.status(404).json("Freelancer not found!");
      const details = getFreelancerPerformanceDetails(existingUser);
      return res.status(200).json(details);
    }

    const details = getFreelancerPerformanceDetails(user);
    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
};
