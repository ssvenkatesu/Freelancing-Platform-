import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

// Route imports
import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import gigRoute from "./routes/gig.route.js";
import orderRoute from "./routes/order.route.js";
import conversationRoute from "./routes/conversation.route.js";
import messageRoute from "./routes/message.route.js";
import reviewRoute from "./routes/review.route.js";
import aiRoute from "./routes/ai.route.js";
import evaluationRoute from "./routes/evaluation.route.js";
import recommendationRoute from "./routes/recommendation.route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup — direct connection from browser, needs its own CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store online users: { userId -> socketId }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Register user as online
  socket.on("addUser", (userId) => {
    if (userId) {
      onlineUsers.set(String(userId), socket.id);
      io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
      console.log(`👤 User ${userId} online`);
    }
  });

  // Real-time message relay
  socket.on("sendMessage", ({ conversationId, senderId, receiverId, desc }) => {
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", {
        conversationId,
        userId: senderId,
        desc,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Typing start
  socket.on("typing", ({ conversationId, userId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { conversationId, userId });
    }
  });

  // Typing stop
  socket.on("stopTyping", ({ conversationId, userId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStopTyping", { conversationId, userId });
    }
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User ${userId} went offline`);
        break;
      }
    }
    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
    console.log("🔌 Socket disconnected:", socket.id);
  });
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    // Allow both Vite dev server origins
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/gigs", gigRoute);
app.use("/api/orders", orderRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/ai", aiRoute);
app.use("/api/evaluations", evaluationRoute);
app.use("/api/recommendations", recommendationRoute);

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "MyFiverr API is running!" });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  console.error(`❌ [${req.method}] ${req.path} →`, errorMessage);
  return res.status(errorStatus).json(errorMessage);
});

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8800;

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

server.listen(PORT, () => {
  connect();
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time messaging`);
});
