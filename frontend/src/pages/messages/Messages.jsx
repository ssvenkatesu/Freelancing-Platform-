import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Messages.scss";
import newRequest from "../../utils/newRequest";
import moment from "moment";

const Messages = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await newRequest.get("/conversations");
        setConversations(res.data);
      } catch (err) {
        setError("Failed to load conversations.");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const handleRead = async (id) => {
    try {
      await newRequest.put(`/conversations/${id}`);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(currentUser.isSeller
                  ? { readBySeller: true }
                  : { readByBuyer: true }),
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const isUnread = (conv) => {
    if (currentUser.isSeller) return !conv.readBySeller;
    return !conv.readByBuyer;
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (loading) return <div className="messages"><div className="container"><p>Loading messages...</p></div></div>;

  return (
    <div className="messages">
      <div className="container">
        <div className="title">
          <h1>Messages</h1>
        </div>
        {error && <p className="error">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>{currentUser?.isSeller ? "Buyer" : "Seller"}</th>
              <th>Last Message</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {conversations.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  No conversations yet.
                </td>
              </tr>
            )}
            {conversations.map((c) => (
              <tr key={c._id} className={isUnread(c) ? "active" : ""}>
                <td>{currentUser.isSeller ? c.buyerId.substring(0, 10) + "..." : c.sellerId.substring(0, 10) + "..."}</td>
                <td>
                  <Link to={`/message/${c.id}`} className="link">
                    {c.lastMessage
                      ? c.lastMessage.substring(0, 100) + (c.lastMessage.length > 100 ? "..." : "")
                      : "Start a conversation..."}
                  </Link>
                </td>
                <td>{formatTime(c.updatedAt)}</td>
                <td>
                  {isUnread(c) && (
                    <button onClick={() => handleRead(c.id)}>Mark as Read</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Messages;
