import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Gig from "../models/gig.model.js";
import Order from "../models/order.model.js";
import Review from "../models/review.model.js";
import { recalculateFreelancerMetrics } from "../services/metrics.service.js";

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/freelancePlatform";
    console.log("🌱 Connecting to MongoDB for seeding:", mongoUri);
    await mongoose.connect(mongoUri);

    console.log("🧹 Checking existing dataset...");
    const existingSellers = await User.countDocuments({ isSeller: true });

    if (existingSellers >= 3) {
      console.log(`ℹ️ Database already has ${existingSellers} sellers. Recalculating metrics on existing data...`);
      const sellers = await User.find({ isSeller: true });
      for (const s of sellers) {
        await recalculateFreelancerMetrics(s._id);
      }
      console.log("✅ Metrics recalculated for all existing sellers.");
      process.exit(0);
    }

    console.log("🌱 Seeding realistic development dataset...");
    const hashedPassword = bcrypt.hashSync("password123", 5);

    // Seed Buyers
    const buyer1 = await User.create({
      username: "alice_client",
      email: "alice@example.com",
      password: hashedPassword,
      country: "United States",
      isSeller: false,
    });

    // Seed Freelancers
    const seller1 = await User.create({
      username: "dev_alex",
      email: "alex@example.com",
      password: hashedPassword,
      country: "Canada",
      isSeller: true,
      skills: ["React", "Node.js", "MongoDB", "Express", "TypeScript", "REST API"],
      hourlyRate: 45,
      bioSummary: "Senior Full Stack JavaScript Developer with 6+ years experience building scalable Web Apps.",
      desc: "Specialized in React, Node.js, Mongoose, and modern web application development. Delivered over 50+ projects globally.",
      evaluationStatus: "passed",
      evaluationScore: 94,
      evaluationAttempts: 1,
      evaluationPassed: true,
      availability: true,
      preferredCategories: ["Programming & Tech", "Web Development"],
      experience: [
        {
          title: "Senior Full Stack Engineer",
          company: "TechCraft Inc.",
          years: 4,
          description: "Architected microservices and built React frontend applications.",
        },
      ],
      portfolio: [
        {
          title: "SaaS Dashboard Engine",
          description: "Real-time analytics dashboard with React, Node, and WebSockets.",
          link: "https://github.com/example/saas-dashboard",
        },
      ],
    });

    const seller2 = await User.create({
      username: "design_maria",
      email: "maria@example.com",
      password: hashedPassword,
      country: "Germany",
      isSeller: true,
      skills: ["UI/UX Design", "Figma", "Logo Design", "Branding", "Adobe XD", "Illustration"],
      hourlyRate: 50,
      bioSummary: "Award-winning UI/UX & Brand Identity Designer crafting sleek digital experiences.",
      desc: "I turn complex ideas into visually stunning, conversion-focused user interfaces and modern brand systems.",
      evaluationStatus: "passed",
      evaluationScore: 98,
      evaluationAttempts: 1,
      evaluationPassed: true,
      availability: true,
      preferredCategories: ["Graphics & Design"],
      experience: [
        {
          title: "Lead Visual Designer",
          company: "Studio Pixel",
          years: 5,
          description: "Designed UI/UX for top tier mobile and desktop applications.",
        },
      ],
    });

    // Seed Gigs
    const gig1 = await Gig.create({
      userId: seller1._id.toString(),
      title: "Build modern full-stack web application with React and Node.js",
      desc: "Complete end-to-end web application development using MERN stack with authentication, real-time database, and responsive UI.",
      cat: "web",
      price: 250,
      shortTitle: "Full Stack Web App",
      shortDesc: "Complete MERN app with database and backend APIs",
      deliveryTime: 5,
      revisionNumber: 3,
      features: ["Custom UI", "Express REST APIs", "Database Integration", "Real-Time Socket"],
      sales: 12,
      tags: ["React", "Node", "MongoDB", "MERN"],
    });

    const gig2 = await Gig.create({
      userId: seller2._id.toString(),
      title: "Design modern UI UX mobile and web interface in Figma",
      desc: "High-fidelity Figma wireframes, prototype, design tokens, and user experience design for iOS, Android, or Web.",
      cat: "design",
      price: 180,
      shortTitle: "Figma UI/UX Design",
      shortDesc: "Pixel-perfect Figma designs for mobile or web app",
      deliveryTime: 3,
      revisionNumber: 5,
      features: ["Figma File", "Clickable Prototype", "Mobile & Desktop Responsive", "Design System"],
      sales: 8,
      tags: ["Figma", "UI/UX", "Mobile Design"],
    });

    // Seed Orders
    const order1 = await Order.create({
      gigId: gig1._id.toString(),
      title: gig1.title,
      price: gig1.price,
      agreedAmount: 250,
      sellerId: seller1._id.toString(),
      buyerId: buyer1._id.toString(),
      isCompleted: true,
      status: "completed",
      payment_intent: "pi_seed_001",
      description: "Build MVP freelance portal dashboard",
      requiredSkills: ["React", "Node.js"],
      completionStatus: "on_time",
    });

    const order2 = await Order.create({
      gigId: gig2._id.toString(),
      title: gig2.title,
      price: gig2.price,
      agreedAmount: 180,
      sellerId: seller2._id.toString(),
      buyerId: buyer1._id.toString(),
      isCompleted: true,
      status: "completed",
      payment_intent: "pi_seed_002",
      description: "Figma design for client mobile app",
      requiredSkills: ["Figma", "UI/UX"],
      completionStatus: "on_time",
    });

    // Seed Reviews
    await Review.create({
      gigId: gig1._id.toString(),
      userId: buyer1._id.toString(),
      sellerId: seller1._id.toString(),
      orderId: order1._id.toString(),
      star: 5,
      desc: "Outstanding code quality! Delivered ahead of schedule with immaculate documentation.",
      projectCompleted: true,
      projectAmount: 250,
    });

    await Review.create({
      gigId: gig2._id.toString(),
      userId: buyer1._id.toString(),
      sellerId: seller2._id.toString(),
      orderId: order2._id.toString(),
      star: 5,
      desc: "Beautiful UI designs and smooth prototypes. Very responsive communicator!",
      projectCompleted: true,
      projectAmount: 180,
    });

    // Recalculate metrics for seeded sellers
    await recalculateFreelancerMetrics(seller1._id);
    await recalculateFreelancerMetrics(seller2._id);

    console.log("🎉 Seeding complete! Added sample freelancers, gigs, orders, reviews, and computed metrics.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();
