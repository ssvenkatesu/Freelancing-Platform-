import React, { useState, useRef, useEffect } from "react";
import "./RagChatbotWidget.scss";
import newRequest from "../../utils/newRequest";

const RagChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! 👋 I am your Grounded AI Assistant. Ask me anything about our platform freelancers, skills, ratings, evaluation tests, or client reviews!",
      sources: [],
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || loading) return;

    const userMessage = { sender: "user", text, sources: [] };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMsg("");
    setLoading(true);

    try {
      const res = await newRequest.post("/ai/chat", {
        message: text,
        conversationId,
      });

      if (res.data.conversationId) setConversationId(res.data.conversationId);

      const botMessage = {
        sender: "bot",
        text: res.data.answer,
        sources: res.data.sources || [],
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
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

  return (
    <div className="rag-widget-container">
      {/* Floating Action Button */}
      {!isOpen && (
        <button className="rag-trigger-btn" onClick={() => setIsOpen(true)}>
          <span className="bot-icon">🤖</span>
          <span className="btn-text">AI Database Assistant</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="rag-chat-drawer">
          <div className="drawer-header">
            <div className="header-info">
              <span className="icon">🤖</span>
              <div>
                <h3>Platform AI Assistant</h3>
                <span className="status-badge">⚡ Grounded in DB Truth</span>
              </div>
            </div>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              &times;
            </button>
          </div>

          <div className="drawer-body">
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-bubble-row ${msg.sender}`}>
                  <div className="bubble">
                    <p className="text">{msg.text}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources-container">
                        <span className="sources-title">📌 Source Evidence:</span>
                        <div className="source-chips">
                          {msg.sources.slice(0, 3).map((src, i) => (
                            <span key={i} className="source-chip">
                              {src.label || src.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-bubble-row bot">
                  <div className="bubble loading-bubble">
                    <span>Searching database & drafting grounded response...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="quick-prompts">
              <button onClick={() => handleSendMessage("Who are the React developers?")}>
                💡 Who are the React developers?
              </button>
              <button onClick={() => handleSendMessage("Who has the highest completion rate?")}>
                ⭐ Who has top completion rates?
              </button>
              <button onClick={() => handleSendMessage("Which freelancers passed the evaluation test?")}>
                🎓 Who passed evaluation tests?
              </button>
            </div>
          </div>

          <form
            className="drawer-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask about freelancers, skills, ratings..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
            />
            <button type="submit" disabled={loading || !inputMsg.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RagChatbotWidget;
