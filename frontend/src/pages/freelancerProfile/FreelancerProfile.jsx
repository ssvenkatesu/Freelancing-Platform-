import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import "./FreelancerProfile.scss";
import newRequest from "../../utils/newRequest";
import GigCard from "../../components/gigCard/GigCard";
import EvaluationTestModal from "../../components/evaluationTest/EvaluationTestModal";

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isOwner = currentUser?._id === id;

  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    desc: "",
    bioSummary: "",
    skills: "",
    hourlyRate: 0,
    phone: "",
    country: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, gigsRes, perfRes, summaryRes, reviewsRes] = await Promise.all([
          newRequest.get(`/users/${id}`),
          newRequest.get(`/gigs?userId=${id}`),
          newRequest.get(`/users/freelancers/${id}/performance`).catch(() => null),
          newRequest.get(`/reviews/summary/${id}`).catch(() => null),
          newRequest.get(`/reviews/freelancer/${id}`).catch(() => ({ data: [] })),
        ]);

        setUser(userRes.data);
        setGigs(gigsRes.data);
        if (perfRes?.data) setPerformance(perfRes.data);
        if (summaryRes?.data) setRatingSummary(summaryRes.data);
        if (reviewsRes?.data) setReviews(reviewsRes.data);

        setFormData({
          desc: userRes.data.desc || "",
          bioSummary: userRes.data.bioSummary || "",
          skills: userRes.data.skills ? userRes.data.skills.join(", ") : "",
          hourlyRate: userRes.data.hourlyRate || 0,
          phone: userRes.data.phone || "",
          country: userRes.data.country || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleContact = async () => {
    if (!currentUser) return navigate("/login");
    try {
      const res = await newRequest.post("/conversations", { to: id });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error("Failed to initiate contact:", err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedSkills = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await newRequest.put(`/users/${id}`, {
        ...formData,
        skills: updatedSkills,
      });

      setUser(res.data);
      if (isOwner) {
        localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, ...res.data }));
      }
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  if (loading) {
    return (
      <div className="freelancer-profile">
        <div className="container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="freelancer-profile">
        <div className="container">
          <p>User not found.</p>
        </div>
      </div>
    );
  }

  const metrics = performance?.metrics || {};

  return (
    <div className="freelancer-profile">
      <div className="container">
        {/* Main Profile Header Card */}
        <div className="profile-card">
          <div className="profile-header">
            <img src={user.img || "/img/man.png"} alt={user.username} className="avatar" />
            <div className="info">
              <h1>{user.username}</h1>
              <span className="badge">{user.isSeller ? "Verified Seller & Freelancer" : "Buyer"}</span>
              <div className="meta">
                <span>📍 {user.country || "Global"}</span>
                {user.hourlyRate > 0 && <span>💵 ${user.hourlyRate}/hr</span>}
              </div>
            </div>
            {!isOwner && user.isSeller && (
              <button className="contact-btn" onClick={handleContact}>
                💬 Contact Freelancer
              </button>
            )}
            {isOwner && (
              <div style={{ display: "flex", gap: "10px" }}>
                {user.isSeller && (
                  <button className="eval-btn" onClick={() => setEvalModalOpen(true)} style={{ background: "#109648", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}>
                    🎓 Take Skill Evaluation Test
                  </button>
                )}
                <button className="edit-btn" onClick={() => setEditing(!editing)}>
                  {editing ? "Cancel Editing" : "✏️ Edit Profile"}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form className="edit-form" onSubmit={handleSaveProfile}>
              <h3>Edit Freelancer Profile</h3>
              <label>Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />

              <label>Hourly Rate ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
              />

              <label>Skills (comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, Graphic Design..."
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              />

              <label>Short Bio Summary</label>
              <input
                type="text"
                placeholder="Senior Full Stack Developer with 5+ years experience"
                value={formData.bioSummary}
                onChange={(e) => setFormData({ ...formData, bioSummary: e.target.value })}
              />

              <label>Full Description</label>
              <textarea
                rows="4"
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              />

              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </form>
          ) : (
            <div className="profile-details">
              {user.bioSummary && <p className="bio-summary">"{user.bioSummary}"</p>}

              {user.desc && (
                <div className="section">
                  <h3>About</h3>
                  <p>{user.desc}</p>
                </div>
              )}

              {user.skills && user.skills.length > 0 && (
                <div className="section">
                  <h3>Skills & Expertise</h3>
                  <div className="skills-list">
                    {user.skills.map((skill, index) => (
                      <span key={index} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.resume && (
                <div className="section">
                  <h3>Resume / Portfolio Document</h3>
                  <a href={user.resume} target="_blank" rel="noopener noreferrer" className="resume-link">
                    📄 View Freelancer Resume
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Freelancer Performance & Ratings Analytics Dashboard */}
        {user.isSeller && (
          <div className="performance-dashboard">
            <h2>🏆 Freelancer Performance & Ratings</h2>

            <div className="metrics-grid">
              {/* Card 1: Average Customer Rating */}
              <div className="metric-card rating">
                <div className="card-header">
                  <span className="icon">⭐</span>
                  <span className="label">Customer Rating</span>
                </div>
                <div className="card-value">
                  <span className="big-num">{metrics.averageRating || user.averageRating || 0}</span>
                  <span className="max-scale">/ 5.0</span>
                </div>
                <p className="card-sub">{metrics.ratingCount || user.ratingCount || 0} Client Reviews</p>
              </div>

              {/* Card 2: Internal Performance Score */}
              <div className="metric-card score">
                <div className="card-header">
                  <span className="icon">📊</span>
                  <span className="label">Performance Index</span>
                </div>
                <div className="card-value">
                  <span className="big-num highlight">{performance?.performanceScore || user.performanceScore || 0}</span>
                  <span className="max-scale">/ 100</span>
                </div>
                <button
                  className="formula-toggle"
                  onClick={() => setShowFormula(!showFormula)}
                >
                  {showFormula ? "Hide Score Formula ▲" : "View Score Formula ▼"}
                </button>
              </div>

              {/* Card 3: Completion Rate */}
              <div className="metric-card completion">
                <div className="card-header">
                  <span className="icon">✅</span>
                  <span className="label">Completion Rate</span>
                </div>
                <div className="card-value">
                  <span className="big-num">{metrics.completionRate || user.completionRate || 100}%</span>
                </div>
                <p className="card-sub">
                  {metrics.completedProjects || 0} Completed / {metrics.totalProjects || 0} Accepted
                </p>
              </div>

              {/* Card 4: Evaluation Score */}
              <div className="metric-card evaluation">
                <div className="card-header">
                  <span className="icon">🎓</span>
                  <span className="label">Skill Evaluation</span>
                </div>
                <div className="card-value">
                  <span className="big-num">{metrics.evaluationScore || user.evaluationScore || 0}%</span>
                </div>
                <span className={`status-tag ${metrics.evaluationPassed ? "passed" : "pending"}`}>
                  {metrics.evaluationPassed ? "Passed Verified Test" : "Evaluation Pending"}
                </span>
              </div>

              {/* Card 5: Total Completed Work */}
              <div className="metric-card work">
                <div className="card-header">
                  <span className="icon">💼</span>
                  <span className="label">Work Volume</span>
                </div>
                <div className="card-value">
                  <span className="big-num">${metrics.totalCompletedProjectValue || user.totalEarnings || 0}</span>
                </div>
                <p className="card-sub">
                  Avg Project Value: ${metrics.averageProjectValue || 0}
                </p>
              </div>
            </div>

            {/* Transparent Formula Drawer */}
            {showFormula && performance && (
              <div className="formula-drawer">
                <h3>🔍 Documented Performance Scoring Formula</h3>
                <p className="formula-text">
                  <code>{performance.formula}</code>
                </p>
                <div className="weights-list">
                  <div className="w-item">
                    <span>Customer Rating (40%):</span>
                    <strong>{performance.normalizedComponents?.customerRating?.toFixed(1)} / 100</strong>
                  </div>
                  <div className="w-item">
                    <span>Completion Rate (25%):</span>
                    <strong>{performance.normalizedComponents?.completionRate?.toFixed(1)} / 100</strong>
                  </div>
                  <div className="w-item">
                    <span>Evaluation Score (15%):</span>
                    <strong>{performance.normalizedComponents?.evaluationScore?.toFixed(1)} / 100</strong>
                  </div>
                  <div className="w-item">
                    <span>Project Experience (10%):</span>
                    <strong>{performance.normalizedComponents?.projectExperience?.toFixed(1)} / 100</strong>
                  </div>
                  <div className="w-item">
                    <span>Review Quality (10%):</span>
                    <strong>{performance.normalizedComponents?.reviewQuality?.toFixed(1)} / 100</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Client Reviews Section */}
            <div className="reviews-section">
              <h3>💬 Client Reviews ({reviews.length})</h3>

              {ratingSummary && ratingSummary.distribution && (
                <div className="rating-distribution">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingSummary.distribution[star] || 0;
                    const percent = ratingSummary.ratingCount > 0 ? (count / ratingSummary.ratingCount) * 100 : 0;
                    return (
                      <div key={star} className="dist-row">
                        <span className="star-label">{star} ★</span>
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="count-label">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews submitted yet.</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map((rev) => (
                    <div key={rev._id} className="review-card">
                      <div className="rev-header">
                        <div className="rev-user">
                          <img
                            src={rev.reviewer?.img || "/img/man.png"}
                            alt={rev.reviewer?.username}
                            className="rev-avatar"
                          />
                          <div>
                            <span className="rev-name">{rev.reviewer?.username || "Client"}</span>
                            <span className="rev-country">📍 {rev.reviewer?.country || "Global"}</span>
                          </div>
                        </div>
                        <div className="rev-stars">
                          {[...Array(rev.star || rev.rating || 5)].map((_, i) => (
                            <span key={i} className="star">★</span>
                          ))}
                        </div>
                      </div>
                      <p className="rev-text">{rev.desc || rev.reviewText}</p>
                      <span className="rev-date">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gigs Listed by Seller */}
        {user.isSeller && (
          <div className="gigs-section">
            <h2>Gigs by {user.username}</h2>
            {gigs.length === 0 ? (
              <p className="no-gigs">No active gigs listed yet.</p>
            ) : (
              <div className="gigs-grid">
                {gigs.map((gig) => (
                  <GigCard key={gig._id} item={gig} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EvaluationTestModal
        isOpen={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        onCompleted={() => window.location.reload()}
      />
    </div>
  );
};

export default FreelancerProfile;
