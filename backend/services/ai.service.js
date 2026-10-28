import dotenv from "dotenv";
dotenv.config();

/**
 * Unified LLM helper supporting OpenRouter API, Gemini API, and fallback logic
 */
/**
 * Unified LLM helper supporting OpenRouter API (with max_tokens limit & auto-fallbacks) and Gemini API
 */
async function callLlm(prompt) {
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
            "X-Title": "MyFiverr Freelancing Platform",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content;
          if (text) return text.trim();
        } else {
          const errText = await response.text();
          console.warn(`[OpenRouter] Model '${model}' returned HTTP ${response.status}: ${errText.substring(0, 150)}`);
        }
      } catch (err) {
        console.warn(`[OpenRouter] Model '${model}' network error:`, err.message);
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
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        } else {
          const errText = await response.text();
          console.warn(`[Gemini API] Endpoint returned HTTP ${response.status}: ${errText.substring(0, 150)}`);
        }
      } catch (err) {
        console.warn("[Gemini API] Network error:", err.message);
      }
    }
  }

  return null;
}

/**
 * Service 1: Generate customized proposal pitch for a job / gig
 */
export const generateProposal = async ({ jobTitle, jobDesc, freelancerName, skills, hourlyRate }) => {
  const prompt = `You are a top 1% freelancer on a freelancing platform.
Write a concise, high-converting client proposal for the following job requirement:
Job Title: ${jobTitle || "Project"}
Job Description: ${jobDesc}

Freelancer Profile:
Name: ${freelancerName || "Professional Freelancer"}
Key Skills: ${skills && skills.length ? skills.join(", ") : "Web Development, Graphic Design, Communication"}
Hourly Rate: $${hourlyRate || "30"}/hr

Keep the tone professional, persuasive, and focus on delivering high quality results promptly. Keep it under 250 words.`;

  const aiResult = await callLlm(prompt);
  if (aiResult) return aiResult.trim();

  // Smart fallback template
  return `Hi there! 👋

I read your project requirements for "${jobTitle || "your project"}" and I am excited to submit my proposal.

Why choose me:
- **Relevant Skills**: ${skills && skills.length ? skills.join(", ") : "Proficient in modern tools, frameworks, and top-tier execution."}
- **Quality Commitment**: I focus on delivering clean, reliable work with fast turnaround times and transparent updates.
- **Fair Pricing**: Competitive rate starting at $${hourlyRate || "30"}/hr.

Project Approach:
1. Clarify remaining details & outline clear project milestones.
2. Deliver clean execution with regular progress demos.
3. Incorporate feedback seamlessly for complete satisfaction.

I would love to discuss how I can help bring this project to life. Looking forward to connecting!

Best regards,
${freelancerName || "Your Freelancer"}`;
};

/**
 * Service 2: Match freelancers against a buyer project requirement
 */
export const matchFreelancers = async ({ projectRequirement, freelancers }) => {
  if (!freelancers || freelancers.length === 0) return [];

  const prompt = `Evaluate the following freelancers for this project requirement and rank them from best fit to least fit.
Project Requirement: "${projectRequirement}"

Freelancers:
${freelancers.map((f, i) => `${i + 1}. ID: ${f._id} | Name: ${f.username} | Country: ${f.country || "Global"} | Bio: ${f.desc || "N/A"} | Skills: ${(f.skills || []).join(", ")}`).join("\n")}

Respond ONLY with a JSON array of objects containing keys "id", "score" (0-100), and "reason" (1 sentence summary). Example:
[{"id": "...", "score": 95, "reason": "Excellent match due to React and Node expertise."}]`;

  const aiResult = await callLlm(prompt);

  if (aiResult) {
    try {
      const cleanedJson = aiResult.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (e) {
      console.warn("Failed to parse LLM match response JSON:", e.message);
    }
  }

  // Fallback matching algorithm based on term matching
  const reqLower = projectRequirement.toLowerCase();
  return freelancers.map((f) => {
    let score = 60;
    const skills = f.skills || [];
    const desc = f.desc || "";

    skills.forEach((s) => {
      if (reqLower.includes(s.toLowerCase())) score += 15;
    });
    if (f.username && reqLower.includes(f.username.toLowerCase())) score += 20;
    if (desc && desc.toLowerCase().split(" ").some((w) => w.length > 3 && reqLower.includes(w))) score += 10;

    score = Math.min(score, 98);

    return {
      id: f._id,
      score,
      reason: `Matches project needs based on skill overlap (${skills.length > 0 ? skills.slice(0, 3).join(", ") : "profile highlights"}).`,
    };
  }).sort((a, b) => b.score - a.score);
};

/**
 * Service 3: Smart reply generator for real-time messaging
 */
export const generateSmartReplies = async ({ conversationHistory, lastMessage }) => {
  const prompt = `Given the last message received in a freelance chat: "${lastMessage}"
Generate 3 short, professional, and helpful quick reply options for a freelancer or client to send back.

Respond ONLY with a JSON array of 3 strings. Example:
["I'll start right away!", "Can you provide more details?", "Sounds great, thanks!"]`;

  const aiResult = await callLlm(prompt);
  if (aiResult) {
    try {
      const cleanedJson = aiResult.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to parse LLM smart reply JSON:", e.message);
    }
  }

  const msgLower = (lastMessage || "").toLowerCase();
  if (msgLower.includes("price") || msgLower.includes("cost") || msgLower.includes("quote")) {
    return [
      "I can offer a competitive quote based on your exact specifications.",
      "My rate is negotiable depending on the scope and timeline.",
      "Let's discuss the project scope so I can give you an accurate price.",
    ];
  }
  if (msgLower.includes("time") || msgLower.includes("when") || msgLower.includes("deadline")) {
    return [
      "I can deliver this within 2-3 business days.",
      "I am available to start immediately!",
      "What is your target deadline for this deliverable?",
    ];
  }
  if (msgLower.includes("hello") || msgLower.includes("hi") || msgLower.includes("hey")) {
    return [
      "Hello! How can I assist you with your project today?",
      "Hi there! Excited to connect with you.",
      "Hey! Thanks for reaching out.",
    ];
  }

  return [
    "Sounds great! I'll get started right away.",
    "Could you clarify a few details regarding the scope?",
    "Thanks for the update! I will keep you posted.",
  ];
};
