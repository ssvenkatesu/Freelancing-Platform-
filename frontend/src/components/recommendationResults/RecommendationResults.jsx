import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RecommendationResults.scss";
import newRequest from "../../utils/newRequest";

const RecommendationResults = ({ recommendations, loading, error, onClose }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState("finalScore"); // "finalScore" | "matchScore" | "rating" | "completion" | "evaluation"
  const [filterPassedOnly, setFilterPassedOnly] = useState(false);

  if (loading) {
    return (
      <div className="recommendation-results-container">
        <div className="loading-box">
          <div className="spinner"></div>
          <h3>Running SBERT Semantic Vector Matchmaking...</h3>
          <p>Analyzing freelancer skills, portfolios, evaluation test scores, and reviews.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendation-results-container">
        <div className="error-box">
          <p className="error-text">⚠️ {error}</p>
          <button className="close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendation-results-container">
        <div className="empty-box">
          <h3>No Matching Freelancers Found</h3>
          <p>Try adjusting your project title, description, or required skills to expand search results.</p>
          <button className="close-btn" onClick={onClose}>Close Recommendations</button>
        </div>
      </div>
    );
  }

  // Filter List
  let filtered = recommendations.filter((rec) => {
    if (filterPassedOnly) {
      return rec.user?.evaluationPassed || rec.evaluationScore >= 70;
    }
    return true;
  });

  // Sort List
  filtered.sort((a, b) => {
    if (sortBy === "matchScore") return (b.matchScore || 0) - (a.matchScore || 0);
    if (sortBy === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === "completion") return (b.completionRate || 0) - (a.completionRate || 0);
    if (sortBy === "evaluation") return (b.evaluationScore || 0) - (a.evaluationScore || 0);
    return (b.finalScore || 0) - (a.finalScore || 0); // Default finalScore
  });

  const handleStartChat = async (freelancerId) => {
    if (!currentUser) return navigate("/login");
    try {
      const res = await newRequest.post("/conversations", { to: freelancerId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  return (
    <div className="recommendation-results-container">
      <div className="results-header">
        <div>
          <h2>🎯 Recommended Freelancers (SBERT Vector Matching)</h2>
          <p className="sub-text">
            Evaluated {recommendations.length} freelancers based on semantic similarity, skill tests, customer reviews, and completion metrics.
          </p>
        </div>
        <button className="close-x-btn" onClick={onClose}>&times;</button>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <div className="sort-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="finalScore">Combined Recommendation Score</option>
            <option value="matchScore">Semantic SBERT Match (%)</option>
            <option value="rating">Customer Rating (★)</option>
            <option value="completion">Completion Rate (%)</option>
            <option value="evaluation">Skill Evaluation Score (%)</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filterPassedOnly}
              onChange={(e) => setFilterPassedOnly(e.target.checked)}
            />
            <span>Show Passed Evaluation Only</span>
          </label>
        </div>
      </div>

      {/* Cards List */}
      <div className="cards-grid">
        {filtered.map((item) => {
          const user = item.user || {};
          const freelancerId = item.freelancerId || user._id;
          const matchPct = Math.round((item.matchScore || item.skillMatch || 0) * 100);

          return (
            <div key={freelancerId} className="rec-card">
              <div className="card-top">
                <img
                  src={user.img || "/img/man.png"}
                  alt={user.username}
                  className="avatar"
                />
                <div className="user-details">
                  <h3
                    className="username"
                    onClick={() => navigate(`/profile/${freelancerId}`)}
                  >
                    {user.username} ↗
                  </h3>
                  <span className="location">📍 {user.country || "Global"}</span>
                  <div className="skills-chips">
                    {(user.skills || []).slice(0, 4).map((skill, sIdx) => (
                      <span key={sIdx} className="skill-chip">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="match-badge-box">
                  <span className="match-pct">{matchPct}% Match</span>
                  <span className="final-score-label">Score Index: {item.finalScore}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="card-metrics">
                <div className="m-item">
                  <span className="m-label">⭐ Rating</span>
                  <strong className="m-val">{item.averageRating || user.averageRating || 0} / 5.0</strong>
                  <span className="m-sub">({user.ratingCount || 0} reviews)</span>
                </div>

                <div className="m-item">
                  <span className="m-label">✅ Completion</span>
                  <strong className="m-val">{item.completionRate || user.completionRate || 100}%</strong>
                  <span className="m-sub">({user.completedProjectsCount || 0} projects)</span>
                </div>

                <div className="m-item">
                  <span className="m-label">🎓 Evaluation</span>
                  <strong className="m-val">{item.evaluationScore || user.evaluationScore || 0}%</strong>
                  <span className="m-sub">{user.evaluationPassed ? "Passed Test" : "Pending"}</span>
                </div>

                <div className="m-item">
                  <span className="m-label">📊 Performance</span>
                  <strong className="m-val">{item.performanceScore || user.performanceScore || 0} / 100</strong>
                  <span className="m-sub">Index Score</span>
                </div>
              </div>

              {/* Relevant Experience & Portfolio */}
              {user.portfolio && user.portfolio.length > 0 && (
                <div className="experience-block">
                  <span className="exp-title">💼 Relevant Work History:</span>
                  <ul className="exp-list">
                    {user.portfolio.slice(0, 2).map((p, pIdx) => (
                      <li key={pIdx}>
                        <strong>{p.title}</strong>: {p.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Factual Explanations */}
              {item.factualReasons && item.factualReasons.length > 0 && (
                <div className="reasons-block">
                  <span className="reasons-title">💡 Factual Match Evidence:</span>
                  <ul>
                    {item.factualReasons.map((reason, rIdx) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="card-actions">
                <button
                  className="profile-btn"
                  onClick={() => navigate(`/profile/${freelancerId}`)}
                >
                  👤 View Profile
                </button>
                <button
                  className="chat-btn"
                  onClick={() => handleStartChat(freelancerId)}
                >
                  💬 Start Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationResults;
