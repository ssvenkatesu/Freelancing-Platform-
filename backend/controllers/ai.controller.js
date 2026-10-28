import { generateProposal, matchFreelancers, generateSmartReplies } from "../services/ai.service.js";
import { handleRagQuery } from "../services/rag/ragService.js";
import User from "../models/user.model.js";

export const getProposal = async (req, res, next) => {
  try {
    if (!req.isSeller) {
      return res.status(403).json("Proposal generator is only available to freelancers!");
    }

    const { jobTitle, jobDesc, freelancerName, skills, hourlyRate } = req.body;
    
    if (!jobDesc) {
      return res.status(400).json("Job description is required!");
    }

    const proposal = await generateProposal({
      jobTitle,
      jobDesc,
      freelancerName,
      skills,
      hourlyRate,
    });

    res.status(200).json({ proposal });
  } catch (err) {
    next(err);
  }
};

export const getMatchedFreelancers = async (req, res, next) => {
  try {
    const { projectRequirement } = req.body;

    if (!projectRequirement) {
      return res.status(400).json("Project requirement is required!");
    }

    const sellers = await User.find({ isSeller: true }).select("-password");

    const matches = await matchFreelancers({
      projectRequirement,
      freelancers: sellers,
    });

    const enrichedResults = matches.map((match) => {
      const userObj = sellers.find((s) => s._id.toString() === match.id);
      return {
        ...match,
        user: userObj || null,
      };
    }).filter((item) => item.user !== null);

    res.status(200).json(enrichedResults);
  } catch (err) {
    next(err);
  }
};

export const getSmartReplies = async (req, res, next) => {
  try {
    const { lastMessage } = req.body;

    const replies = await generateSmartReplies({ lastMessage });
    res.status(200).json({ replies });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ai/chat & POST /api/ai/rag-chat
 * Grounded RAG Chatbot endpoint
 */
export const handleRagChat = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json("Message parameter is required!");
    }

    const result = await handleRagQuery({
      message: message.trim(),
      conversationId,
      userId: req.userId || "",
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
