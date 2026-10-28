import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import { recalculateFreelancerMetrics } from "../services/metrics.service.js";

// Helper to generate a fake payment intent ID
const generateFakePaymentIntent = () => {
  return "pi_fake_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);
};

export const createOrder = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.body.gigId);
    if (!gig) return res.status(404).json("Gig not found!");

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      price: gig.price,
      sellerId: gig.userId,
      buyerId: req.userId,
      isCompleted: true,
      payment_intent: generateFakePaymentIntent(),
    });

    const savedOrder = await newOrder.save();

    // Increment sales count on the gig
    await Gig.findByIdAndUpdate(req.body.gigId, { $inc: { sales: 1 } });

    // Recalculate freelancer metrics dynamically
    recalculateFreelancerMetrics(gig.userId).catch((err) =>
      console.error("Metrics update error:", err)
    );

    res.status(200).json(savedOrder);
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller
        ? { sellerId: req.userId }
        : { buyerId: req.userId }),
    });

    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};
