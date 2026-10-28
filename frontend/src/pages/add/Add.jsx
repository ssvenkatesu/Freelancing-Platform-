import React, { useState } from "react";
import upload from "../../utils/upload";
import "./Add.scss";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";
import RecommendationResults from "../../components/recommendationResults/RecommendationResults";

const Add = () => {
  const navigate = useNavigate();
  const [singleFile, setSingleFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [gig, setGig] = useState({
    title: "",
    cat: "design",
    desc: "",
    shortTitle: "",
    shortDesc: "",
    deliveryTime: 1,
    revisionNumber: 1,
    features: [],
    price: 0,
  });

  const [featureInput, setFeatureInput] = useState("");
  
  // Extension Fields for AI Recommendation Engine
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("any");

  // Recommendation State
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleChange = (e) => {
    setGig((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setGig((prev) => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      setFeatureInput("");
    }
  };

  const removeFeature = (index) => {
    setGig((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills((prev) => [...prev, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setRequiredSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFindFreelancers = async () => {
    if (!gig.title.trim() && !gig.desc.trim()) {
      setRecError("Please enter a Title or Description before matching freelancers.");
      setShowRecommendations(true);
      return;
    }

    setRecLoading(true);
    setRecError(null);
    setShowRecommendations(true);

    try {
      const res = await newRequest.post("/recommendations/freelancers", {
        title: gig.title,
        description: gig.desc,
        requiredSkills,
        category: gig.cat,
        budget: Number(gig.price) || 0,
        experienceLevel,
      });

      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Recommendation Error:", err);
      setRecError("Failed to fetch freelancer recommendations. Please check backend connection.");
    } finally {
      setRecLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploading(true);
    try {
      let coverUrl = "";
      let imageUrls = [];

      if (singleFile) {
        coverUrl = await upload(singleFile);
      }
      if (files.length > 0) {
        imageUrls = await Promise.all([...files].map((f) => upload(f)));
      }

      await newRequest.post("/gigs", {
        ...gig,
        cover: coverUrl,
        images: imageUrls,
        price: Number(gig.price),
        deliveryTime: Number(gig.deliveryTime),
        revisionNumber: Number(gig.revisionNumber),
      });

      navigate("/mygigs");
    } catch (err) {
      setError(err.response?.data || "Failed to create gig. Make sure you are logged in as a seller.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="add">
      <div className="container">
        <h1>Add New Gig / Project Requirement</h1>
        <form onSubmit={handleSubmit}>
          <div className="sections">
            <div className="info">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={gig.title}
                placeholder="e.g. I will do something I'm really good at"
                onChange={handleChange}
                required
              />

              <label>Category</label>
              <select name="cat" value={gig.cat} onChange={handleChange}>
                <option value="design">Design</option>
                <option value="web">Web Development</option>
                <option value="animation">Animation</option>
                <option value="music">Music</option>
                <option value="marketing">Digital Marketing</option>
                <option value="writing">Writing & Translation</option>
                <option value="ai">AI Services</option>
              </select>

              <label>Required Skills for Project</label>
              <div className="feature-row">
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Figma"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                />
                <button type="button" onClick={addSkill}>+ Add Skill</button>
              </div>
              <div className="addedFeatures">
                {requiredSkills.map((s, i) => (
                  <div className="item" key={i}>
                    <span>{s}</span>
                    <button type="button" onClick={() => removeSkill(i)}>✕</button>
                  </div>
                ))}
              </div>

              <label>Experience Requirement</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                <option value="any">Any Experience Level</option>
                <option value="junior">Junior (1-2 years)</option>
                <option value="mid">Mid-Level (3-5 years)</option>
                <option value="senior">Senior (5+ years)</option>
              </select>

              <label>Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSingleFile(e.target.files[0])}
              />

              <label>Upload Additional Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />

              <label>Description</label>
              <textarea
                name="desc"
                value={gig.desc}
                placeholder="Brief description to introduce your project requirement to freelancers"
                cols="0"
                rows="16"
                onChange={handleChange}
                required
              />

              <div className="button-group">
                <button
                  type="button"
                  className="find-freelancers-btn"
                  onClick={handleFindFreelancers}
                >
                  🔍 Find Suitable Freelancers
                </button>

                <button type="submit" className="create-gig-btn" disabled={uploading}>
                  {uploading ? "Creating..." : "Create Gig"}
                </button>
              </div>
              {error && <span className="error">{error}</span>}
            </div>

            <div className="details">
              <label>Service Title</label>
              <input
                type="text"
                name="shortTitle"
                value={gig.shortTitle}
                placeholder="e.g. One-page web design"
                onChange={handleChange}
              />

              <label>Short Description</label>
              <textarea
                name="shortDesc"
                value={gig.shortDesc}
                placeholder="Short description of your service"
                cols="30"
                rows="10"
                onChange={handleChange}
              />

              <label>Delivery Time (days)</label>
              <input
                type="number"
                name="deliveryTime"
                min="1"
                value={gig.deliveryTime}
                onChange={handleChange}
              />

              <label>Revision Number</label>
              <input
                type="number"
                name="revisionNumber"
                min="0"
                value={gig.revisionNumber}
                onChange={handleChange}
              />

              <label>Add Features</label>
              <div className="feature-row">
                <input
                  type="text"
                  placeholder="e.g. Source file included"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <button type="button" onClick={addFeature}>+</button>
              </div>
              <div className="addedFeatures">
                {gig.features.map((f, i) => (
                  <div className="item" key={i}>
                    <span>{f}</span>
                    <button type="button" onClick={() => removeFeature(i)}>✕</button>
                  </div>
                ))}
              </div>

              <label>Price / Budget ($)</label>
              <input
                type="number"
                name="price"
                min="1"
                value={gig.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </form>

        {/* Live SBERT Recommendation Section */}
        {showRecommendations && (
          <RecommendationResults
            recommendations={recommendations}
            loading={recLoading}
            error={recError}
            onClose={() => setShowRecommendations(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Add;
