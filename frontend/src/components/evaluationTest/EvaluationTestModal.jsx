import React, { useEffect, useState } from "react";
import "./EvaluationTestModal.scss";
import newRequest from "../../utils/newRequest";

const EvaluationTestModal = ({ isOpen, onClose, onCompleted }) => {
  const [stage, setStage] = useState("select"); // "select" | "test" | "results"
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Active Test State
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(600); // 10 mins

  // Results State
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        const res = await newRequest.get("/evaluations/categories");
        setCategories(res.data);
      } catch (err) {
        console.warn("Failed to load evaluation categories:", err);
      }
    };
    fetchCategories();
  }, [isOpen]);

  // Live Timer Countdown
  useEffect(() => {
    if (stage !== "test" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  if (!isOpen) return null;

  const handleStartTest = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await newRequest.post("/evaluations/start", {
        category: selectedCategory,
      });

      setAttemptId(res.data.attemptId);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.remainingSeconds || 600);
      setCurrentIndex(0);
      setUserAnswers({});
      setStage("test");
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to start evaluation test."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    setError("");

    const formattedAnswers = Object.entries(userAnswers).map(([qId, option]) => ({
      questionId: qId,
      selectedOption: option,
    }));

    try {
      const res = await newRequest.post("/evaluations/submit", {
        attemptId,
        answers: formattedAnswers,
      });

      setResult(res.data);
      setStage("results");
      if (onCompleted) onCompleted(res.data);
    } catch (err) {
      setError("Failed to submit test answers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="eval-modal-overlay" onClick={onClose}>
      <div className="eval-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="eval-modal-header">
          <div className="title">
            <span>🎓 Freelancer Entry Evaluation Test</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="eval-modal-body">
          {/* Stage 1: Category Selection */}
          {stage === "select" && (
            <div className="select-stage">
              <h2>Select Skill Verification Category</h2>
              <p className="subtitle">
                Verify your expertise by taking a 10-minute skill test. Passing score is 70% or higher.
              </p>

              <div className="category-grid">
                {(categories.length > 0
                  ? categories
                  : [
                      { category: "JavaScript" },
                      { category: "React" },
                      { category: "Node.js" },
                      { category: "Python" },
                      { category: "SQL" },
                      { category: "MongoDB" },
                      { category: "UI/UX" },
                      { category: "HTML/CSS" },
                    ]
                ).map((catItem) => (
                  <button
                    key={catItem.category}
                    className={`cat-card ${
                      selectedCategory === catItem.category ? "selected" : ""
                    }`}
                    onClick={() => setSelectedCategory(catItem.category)}
                  >
                    <span className="cat-name">{catItem.category}</span>
                    <span className="cat-badge">10 Questions</span>
                  </button>
                ))}
              </div>

              {error && <p className="error">{error}</p>}

              <button
                className="start-btn"
                onClick={handleStartTest}
                disabled={loading}
              >
                {loading ? "Preparing Questions..." : `Start ${selectedCategory} Test`}
              </button>
            </div>
          )}

          {/* Stage 2: Active Test */}
          {stage === "test" && currentQ && (
            <div className="test-stage">
              <div className="quiz-topbar">
                <div className="stepper">
                  Question {currentIndex + 1} of {questions.length}
                </div>
                <div className={`timer-box ${timeLeft < 120 ? "urgent" : ""}`}>
                  ⏱️ Time Left: <strong>{formatTimer(timeLeft)}</strong>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="fill"
                  style={{
                    width: `${((currentIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>

              <div className="question-box">
                <h3 className="q-text">{currentQ.question}</h3>
                <div className="options-list">
                  {currentQ.options.map((optionText, idx) => (
                    <label
                      key={idx}
                      className={`option-card ${
                        userAnswers[currentQ._id] === idx ? "selected" : ""
                      }`}
                      onClick={() => handleSelectOption(currentQ._id, idx)}
                    >
                      <input
                        type="radio"
                        name={`q_${currentQ._id}`}
                        checked={userAnswers[currentQ._id] === idx}
                        onChange={() => {}}
                      />
                      <span className="opt-letter">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span className="opt-text">{optionText}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <p className="error">{error}</p>}

              <div className="quiz-footer">
                <button
                  className="nav-btn"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                >
                  ← Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    className="nav-btn primary"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    className="submit-btn"
                    onClick={handleSubmitTest}
                    disabled={loading}
                  >
                    {loading ? "Grading..." : "Submit Test ✅"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stage 3: Test Results */}
          {stage === "results" && result && (
            <div className="results-stage">
              <div className={`status-banner ${result.passed ? "passed" : "failed"}`}>
                <span className="icon">{result.passed ? "🎉" : "❌"}</span>
                <h2>{result.passed ? "Evaluation Passed!" : "Evaluation Failed"}</h2>
                <p className="banner-sub">
                  Score: <strong>{result.scorePercentage}%</strong> (Passing threshold: {result.passingThreshold}%)
                </p>
              </div>

              <div className="stats-row">
                <div className="stat-box">
                  <span className="label">Category</span>
                  <span className="val">{result.category}</span>
                </div>
                <div className="stat-box">
                  <span className="label">Correct Answers</span>
                  <span className="val">
                    {result.correctAnswers} / {result.totalQuestions}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="label">Result</span>
                  <span className={`val ${result.passed ? "green" : "red"}`}>
                    {result.passStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {result.feedback && (
                <div className="feedback-section">
                  <h3>Question Review & Explanations</h3>
                  {result.feedback.map((item, i) => (
                    <div
                      key={i}
                      className={`feedback-card ${item.isCorrect ? "correct" : "incorrect"}`}
                    >
                      <div className="fb-header">
                        <span>
                          Q{i + 1}. {item.question}
                        </span>
                        <span className="status-chip">
                          {item.isCorrect ? "Correct ✓" : "Incorrect ✗"}
                        </span>
                      </div>
                      {item.explanation && (
                        <p className="explanation">💡 {item.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="results-actions">
                {!result.passed && (
                  <button
                    className="retake-btn"
                    onClick={() => setStage("select")}
                  >
                    🔄 Retake Test
                  </button>
                )}
                <button className="finish-btn" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EvaluationTestModal;
