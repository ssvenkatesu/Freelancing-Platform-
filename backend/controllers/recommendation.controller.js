import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const SBERT_SERVICE_URL = process.env.SBERT_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/recommendations/freelancers
 * Matches gig requirements against all active platform freelancers using Sentence-BERT (SBERT) embeddings.
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { title, description, requiredSkills, budget, category } = req.body;

    if (!title && !description) {
      return res.status(400).json("Title or description is required for recommendations!");
    }

    // 1. Fetch all active sellers/freelancers from MongoDB
    const sellers = await User.find({ isSeller: true }).select("-password");

    if (!sellers || sellers.length === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // 2. Format payload for Python SBERT Microservice
    const formattedFreelancers = sellers.map((s) => ({
      id: s._id.toString(),
      username: s.username,
      bio: s.bioSummary || s.desc || "",
      skills: s.skills || [],
      experience: (s.experience || []).map((e) => `${e.title} ${e.description || ""}`).join(" "),
      portfolio: (s.portfolio || []).map((p) => `${p.title} ${p.description || ""}`).join(" "),
      completedProjects: s.completedProjectsCount || 0,
      completionRate: s.completionRate || 100,
      averageRating: s.averageRating || 0,
      evaluationScore: s.evaluationScore || 0,
      performanceScore: s.performanceScore || 0,
    }));

    const gigPayload = {
      title: title || "Freelance Project",
      description: description || "",
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      category: category || "",
      budget: Number(budget || 0),
    };

    let recommendations = [];

    // 3. Call Python SBERT Microservice
    try {
      const sbertRes = await fetch(`${SBERT_SERVICE_URL}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gig: gigPayload,
          freelancers: formattedFreelancers,
        }),
      });

      if (sbertRes.ok) {
        const data = await sbertRes.json();
        recommendations = data.recommendations || [];
      } else {
        console.warn("SBERT Microservice HTTP Error:", sbertRes.status);
      }
    } catch (sbertError) {
      console.warn("⚠️ SBERT service unreachable. Executing fallback ranking:", sbertError.message);
    }

    // 4. Fallback ranking if SBERT microservice is offline
    if (recommendations.length === 0) {
      const queryText = `${gigPayload.title} ${gigPayload.description} ${gigPayload.requiredSkills.join(" ")}`.toLowerCase();

      recommendations = sellers.map((s) => {
        let skillMatches = 0;
        const skills = s.skills || [];
        const matchedSkills = [];

        skills.forEach((sk) => {
          if (queryText.includes(sk.toLowerCase())) {
            skillMatches++;
            matchedSkills.push(sk);
          }
        });

        const normSkill = Math.min(1.0, (skillMatches / Math.max(1, gigPayload.requiredSkills.length)) || (skillMatches > 0 ? 0.7 : 0.4));
        const normPerf = (s.performanceScore || 0) / 100;
        const normEval = (s.evaluationScore || 0) / 100;
        const normComp = (s.completionRate || 100) / 100;
        const normRating = (s.averageRating || 0) / 5;

        const finalScore = Number(((0.50 * normSkill + 0.20 * normPerf + 0.10 * normEval + 0.10 * normComp + 0.10 * normRating) * 100).toFixed(2));

        const reasons = [];
        if (matchedSkills.length > 0) reasons.append(`Matches ${matchedSkills.join(", ")} requirements`);
        reasons.append(`Completed ${s.completedProjectsCount || 0} projects`);
        reasons.append(`${s.completionRate || 100}% completion rate`);
        reasons.append(`${s.averageRating || 0} / 5.0 average customer rating`);

        return {
          freelancerId: s._id.toString(),
          matchScore: Number(normSkill.toFixed(4)),
          skillMatch: Number(normSkill.toFixed(4)),
          performanceScore: s.performanceScore || 0,
          evaluationScore: s.evaluationScore || 0,
          completionRate: s.completionRate || 100,
          averageRating: s.averageRating || 0,
          finalScore,
          explanation: `Fallback semantic score of ${Math.round(normSkill * 100)}% based on skill alignment.`,
          factualReasons: reasons,
        };
      }).sort((a, b) => b.finalScore - a.finalScore);
    }

    // 5. Enrich recommendation objects with full Mongoose user models
    const enrichedResults = recommendations.map((rec) => {
      const userObj = sellers.find((s) => s._id.toString() === rec.freelancerId);
      return {
        ...rec,
        user: userObj || null,
      };
    }).filter((r) => r.user !== null);

    res.status(200).json({
      totalEvaluated: sellers.length,
      recommendations: enrichedResults,
    });
  } catch (err) {
    next(err);
  }
};
