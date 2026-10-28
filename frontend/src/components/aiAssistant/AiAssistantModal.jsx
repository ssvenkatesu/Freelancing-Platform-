import React, { useState } from "react";
import "./AiAssistantModal.scss";
import newRequest from "../../utils/newRequest";
import { Link } from "react-router-dom";

const AiAssistantModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("match"); // "match" | "proposal"
  
  // Matchmaking State
  const [projectDesc, setProjectDesc] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  // Proposal State
  const [jobTitle, setJobTitle] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [skills, setSkills] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [proposal, setProposal] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
  const isFreelancer = Boolean(currentUser?.isSeller);

  if (!isOpen) return null;

  const handleMatchmaking = async (e) => {
    e.preventDefault();
    if (!projectDesc.trim()) return;

    setMatchLoading(true);
    setMatchError("");
    try {
      const res = await newRequest.post("/ai/match-freelancers", {
        projectRequirement: projectDesc,
      });
      setMatches(res.data);
    } catch (err) {
      setMatchError("Failed to fetch matches. Please try again.");
    } finally {
      setMatchLoading(false);
    }
  };

  const handleGenerateProposal = async (e) => {
    e.preventDefault();
    if (!jobDesc.trim()) return;

    if (!isFreelancer) {
      return;
    }

    setProposalLoading(true);
    try {
      const res = await newRequest.post("/ai/generate-proposal", {
        jobTitle,
        jobDesc,
        freelancerName: currentUser.username || "Freelancer",
        skills: skills ? skills.split(",").map((s) => s.trim()) : currentUser.skills || [],
        hourlyRate: hourlyRate || currentUser.hourlyRate || 30,
      });
      setProposal(res.data.proposal);
    } catch (err) {
      console.error("Proposal Error:", err);
    } finally {
      setProposalLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="title">
            <span>✨ AI Freelance Suite</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="ai-modal-tabs">
          <button
            className={activeTab === "match" ? "active" : ""}
            onClick={() => setActiveTab("match")}
          >
            🔍 Smart Matchmaker
          </button>
          <button
            className={activeTab === "proposal" ? "active" : ""}
            onClick={() => setActiveTab("proposal")}
          >
            📝 Proposal Generator {!isFreelancer && "(Freelancers Only)"}
          </button>
        </div>

        <div className="ai-modal-body">
          {activeTab === "match" && (
            <div className="tab-content match-tab">
              <p className="subtitle">
                Describe your project requirement and our AI will analyze registered freelancers to find your perfect match.
              </p>
              <form onSubmit={handleMatchmaking}>
                <textarea
                  rows="3"
                  placeholder="e.g. Need a full-stack React and Node developer to build a modern dashboard..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                />
                <button type="submit" disabled={matchLoading || !projectDesc.trim()}>
                  {matchLoading ? "Analyzing & Matching..." : "Find Best Matches"}
                </button>
              </form>

              {matchError && <p className="error">{matchError}</p>}

              <div className="matches-list">
                {matches.length > 0 && <h3>Top Recommended Freelancers</h3>}
                {matches.map((item) => (
                  <div key={item.id} className="match-card">
                    <div className="user-info">
                      <img
                        src={item.user?.img || "/img/man.png"}
                        alt={item.user?.username}
                        className="avatar"
                      />
                      <div>
                        <Link to={`/profile/${item.user?._id}`} onClick={onClose} className="username">
                          {item.user?.username}
                        </Link>
                        <span className="country">📍 {item.user?.country || "Global"}</span>
                      </div>
                      <div className="score-badge">
                        <span>{item.score}% Match</span>
                      </div>
                    </div>
                    <p className="match-reason">💡 {item.reason}</p>
                    {item.user?.skills && item.user.skills.length > 0 && (
                      <div className="skills-tags">
                        {item.user.skills.map((skill, i) => (
                          <span key={i} className="skill-chip">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "proposal" && (
            <div className="tab-content proposal-tab">
              {!isFreelancer ? (
                <div style={{ padding: "35px 20px", textAlign: "center" }}>
                  <span style={{ fontSize: "44px", display: "block", marginBottom: "12px" }}>🔒</span>
                  <h3 style={{ margin: "0 0 8px 0", color: "#222", fontSize: "18px" }}>
                    Freelancers Only Feature
                  </h3>
                  <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.5", maxWidth: "420px", margin: "0 auto" }}>
                    The AI Proposal Generator is exclusively available for registered freelancers to pitch prospective client projects.
                  </p>
                </div>
              ) : (
                <>
                  <p className="subtitle">
                    Generate a professional, high-converting job proposal tailored to any project description in seconds.
                  </p>
                  <form onSubmit={handleGenerateProposal}>
                    <input
                      type="text"
                      placeholder="Job Title (e.g., E-commerce Website Development)"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                    <textarea
                      rows="3"
                      placeholder="Paste Job Description..."
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                    />
                    <div className="row">
                      <input
                        type="text"
                        placeholder="Skills (comma separated, e.g. React, Node, CSS)"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Hourly Rate ($)"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                      />
                    </div>
                    <button type="submit" disabled={proposalLoading || !jobDesc.trim()}>
                      {proposalLoading ? "Drafting Proposal..." : "Generate Proposal"}
                    </button>
                  </form>

                  {proposal && (
                    <div className="proposal-result">
                      <div className="result-header">
                        <h4>Generated Proposal</h4>
                        <button onClick={copyToClipboard} className="copy-btn">
                          {copied ? "Copied! ✓" : "Copy to Clipboard"}
                        </button>
                      </div>
                      <pre className="proposal-text">{proposal}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
