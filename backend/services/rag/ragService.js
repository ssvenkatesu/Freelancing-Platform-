import RagConversation from "../../models/ragConversation.model.js";
import { retrieveRelevantContext } from "./retrievalService.js";
import { buildContext } from "./contextBuilder.js";
import { buildPrompt } from "./promptService.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Unified LLM helper supporting OpenRouter API (with max_tokens limit & auto-fallbacks) and Gemini API
 */
async function callLlm(promptText) {
  // 1. Try OpenRouter API
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey && openRouterKey.trim()) {
    const candidateModels = Array.from(new Set([
      process.env.OPENROUTER_MODEL,
      "openrouter/auto",
      "meta-llama/llama-3.2-1b-instruct:free",
      "meta-llama/llama-3-8b-instruct:free",
      "qwen/qwen-2-7b-instruct:free",
      "microsoft/phi-3-medium-128k-instruct:free",
      "huggingfaceh4/zephyr-7b-beta:free",
    ])).filter(Boolean);

    for (const model of candidateModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey.trim()}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "MyFiverr RAG Chatbot",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: promptText }],
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        } else {
          const errText = await response.text();
          console.warn(`[OpenRouter RAG] Model '${model}' returned HTTP ${response.status}: ${errText.substring(0, 150)}`);
        }
      } catch (err) {
        console.warn(`[OpenRouter RAG] Model '${model}' network error:`, err.message);
      }
    }
  }

  // 2. Try Gemini API
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.trim()) {
    const geminiEndpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey.trim()}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey.trim()}`,
    ];

    for (const url of geminiEndpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errText = await response.text();
          console.warn(`[Gemini API RAG] Endpoint returned HTTP ${response.status}: ${errText.substring(0, 150)}`);
        }
      } catch (err) {
        console.warn("[Gemini API RAG] Network error:", err.message);
      }
    }
  }

  return null;
}

/**
 * Intelligent deterministic fallback answer generator strictly grounded in retrieved database records
 */
function generateFallbackGroundedAnswer(query, retrievedData) {
  const qLower = query.toLowerCase();
  const { freelancers, gigs, orders, reviews } = retrievedData;

  if (!freelancers || freelancers.length === 0) {
    return "I couldn't find enough information about that in the freelancer database.";
  }

  // Question type 1: React / Skill lookup
  if (qLower.includes("react") || qLower.includes("node") || qLower.includes("python") || qLower.includes("skill")) {
    const matching = freelancers.filter((f) =>
      (f.skills || []).some((s) => qLower.includes(s.toLowerCase()))
    );
    if (matching.length > 0) {
      return `Based on our database records, the following freelancers have matching skills:\n\n` +
        matching.map((f) => `- **${f.username}** (${(f.skills || []).join(", ")}) — Rating: ${f.averageRating || 0}/5.0, Completion Rate: ${f.completionRate || 100}%`).join("\n");
    }
  }

  // Question type 2: Highest completion rate / top rated
  if (qLower.includes("completion rate") || qLower.includes("highest")) {
    const top = [...freelancers].sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))[0];
    if (top) {
      return `According to database records, **${top.username}** has the highest completion rate at **${top.completionRate || 100}%** with ${top.completedProjectsCount || 0} completed projects and an average customer rating of ${top.averageRating || 0}/5.0.`;
    }
  }

  // Question type 3: Evaluation test / passed
  if (qLower.includes("evaluation") || qLower.includes("test") || qLower.includes("passed")) {
    const passedSellers = freelancers.filter((f) => f.evaluationPassed || f.evaluationStatus === "passed");
    if (passedSellers.length > 0) {
      return `The following freelancers have passed the platform skill evaluation test:\n\n` +
        passedSellers.map((f) => `- **${f.username}** — Score: ${f.evaluationScore || 0}%, Status: ${f.evaluationStatus || "passed"}`).join("\n");
    }
  }

  // Question type 4: Customer reviews / feedback
  if (qLower.includes("review") || qLower.includes("customer") || qLower.includes("say")) {
    if (reviews && reviews.length > 0) {
      return `Here is what customers are saying in recent reviews:\n\n` +
        reviews.slice(0, 3).map((r) => `- "${r.desc || r.reviewText}" (${r.star || r.rating} Stars)`).join("\n");
    }
  }

  // General grounded summary of retrieved freelancers
  return `Based on retrieved database records for your query:\n\n` +
    freelancers.slice(0, 3).map((f) => `- **${f.username}**: Skills: ${(f.skills || []).join(", ") || "General"}, Rating: ${f.averageRating || 0}/5.0 (${f.ratingCount || 0} reviews), Completed Projects: ${f.completedProjectsCount || 0}, Completion Rate: ${f.completionRate || 100}%, Evaluation: ${f.evaluationScore || 0}%`).join("\n\n");
}

/**
 * Main RAG Chatbot Service Handler
 */
export const handleRagQuery = async ({ message, conversationId, userId }) => {
  const convId = conversationId || `rag_conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Fetch or create RagConversation
  let conv = await RagConversation.findOne({ conversationId: convId });
  if (!conv) {
    conv = new RagConversation({
      conversationId: convId,
      userId: userId || "",
      messages: [],
    });
  }

  // 2. Retrieve Database Records (Hybrid Structured + Text Search)
  const retrievedData = await retrieveRelevantContext(message);

  // 3. Build Grounded Context
  const contextText = buildContext(retrievedData);

  // 4. Build System Prompt with Anti-Hallucination Guardrails
  const promptText = buildPrompt(message, contextText);

  // 5. Call LLM (OpenRouter, Gemini, or Fallback Engine)
  let answer = await callLlm(promptText);
  if (!answer) {
    answer = generateFallbackGroundedAnswer(message, retrievedData);
  }

  // 6. Format Sources List
  const sources = retrievedData.sources || [];

  // 7. Save to RagConversation
  conv.messages.push({
    sender: "user",
    text: message,
    sources: [],
    createdAt: new Date(),
  });

  conv.messages.push({
    sender: "bot",
    text: answer,
    sources,
    createdAt: new Date(),
  });

  await conv.save();

  return {
    conversationId: convId,
    answer,
    sources,
  };
};
