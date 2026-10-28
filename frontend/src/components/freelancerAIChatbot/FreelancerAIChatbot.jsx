import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FreelancerAIChatbot.scss";
import newRequest from "../../utils/newRequest";

const INITIAL_BOT_MESSAGE = {
  sender: "bot",
  text: "Hello! 👋 I am your Freelancer AI Assistant. Ask me anything about our platform freelancers, skills, ratings, completion rates, or client feedback!",
  sources: [],
};

const SUGGESTED_QUESTIONS = [
  "Find React freelancers",
  "Who has the highest completion rate?",
  "What projects has this freelancer completed?",
  "What do customers say about this freelancer?",
  "Find freelancers experienced in e-commerce",
];

const FreelancerAIChatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_BOT_MESSAGE]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState("");

  const chatEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleClearConversation = () => {
    setMessages([INITIAL_BOT_MESSAGE]);
    setConversationId("");
    setError(null);
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputMsg;

    if (!textToSend || !textToSend.trim()) {
      setError("Please enter a question.");
      return;
    }

    if (loading) return;

    setError(null);
    const userMessage = { sender: "user", text: textToSend.trim(), sources: [] };
    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputMsg("");
    setLoading(true);

    try {
      const res = await newRequest.post("/ai/chat", {
        message: textToSend.trim(),
        conversationId,
      });

      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
      }

      const botMessage = {
        sender: "bot",
        text: res.data.answer || "I couldn't find enough information about that in the freelancer database.",
        sources: res.data.sources || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("AI Chatbot Error:", err);
      const isAuthErr = err.response?.status === 401;

      if (isAuthErr) {
        setError("Please sign in to chat with the AI assistant.");
      } else {
        setError("Network or server error. Please try again.");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I couldn't find enough information about that in the freelancer database.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = (source) => {
    if (source.id || source.type === "freelancer") {
      setIsOpen(false);
      navigate(`/profile/${source.id}`);
    }
  };

  return (
    <div className="freelancer-ai-chatbot">
      {/* Floating Chatbot Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Ask Freelancer AI Assistant"
        >
          <span className="icon">🤖</span>
          <span className="label">AI Freelancer Assistant</span>
        </button>
      )}

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="window-header">
            <div className="header-title">
              <span className="bot-avatar">🤖</span>
              <div>
                <h3>Freelancer AI Assistant</h3>
                <span className="online-status">🟢 Database Grounded</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="clear-btn"
                onClick={handleClearConversation}
                title="Clear Conversation"
              >
                🗑️ Clear
              </button>
              <button
                className="close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Chat"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Messages & Body */}
          <div className="window-body">
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-row ${msg.sender}`}>
                  <div className="message-bubble">
                    <p className="message-text">{msg.text}</p>

                    {/* Sources Display */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources-block">
                        <span className="sources-label">Sources:</span>
                        <div className="source-list">
                          {msg.sources.map((source, sIdx) => (
                            <button
                              key={sIdx}
                              className={`source-badge ${source.type || "freelancer"}`}
                              onClick={() => handleSourceClick(source)}
                            >
                              📌 {source.label || source.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-row bot">
                  <div className="message-bubble loading">
                    <span className="dot-pulse">Searching database & analyzing profiles...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Questions */}
            <div className="suggested-questions">
              <span className="suggestions-label">Click a question to ask:</span>
              <div className="suggestions-scroll">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    className="suggestion-chip"
                    onClick={() => handleSendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Form */}
          <form
            className="window-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            {error && <p className="footer-error">{error}</p>}
            <div className="input-group">
              <input
                type="text"
                placeholder="Ask about freelancers, skills, ratings..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={loading || !inputMsg.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FreelancerAIChatbot;
