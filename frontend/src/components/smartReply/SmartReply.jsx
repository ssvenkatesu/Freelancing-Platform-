import React, { useEffect, useState } from "react";
import "./SmartReply.scss";
import newRequest from "../../utils/newRequest";

const SmartReply = ({ lastMessage, onSelectReply }) => {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lastMessage) return;

    const fetchReplies = async () => {
      setLoading(true);
      try {
        const res = await newRequest.post("/ai/smart-reply", { lastMessage });
        if (res.data && res.data.replies) {
          setReplies(res.data.replies);
        }
      } catch (err) {
        console.warn("Smart reply error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();
  }, [lastMessage]);

  if (!lastMessage || (replies.length === 0 && !loading)) return null;

  return (
    <div className="smart-reply-container">
      <span className="smart-reply-label">✨ AI Suggestions:</span>
      <div className="smart-reply-chips">
        {loading ? (
          <span className="loading-text">Generating quick replies...</span>
        ) : (
          replies.map((reply, idx) => (
            <button
              key={idx}
              className="reply-chip"
              onClick={() => onSelectReply(reply)}
            >
              {reply}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default SmartReply;
