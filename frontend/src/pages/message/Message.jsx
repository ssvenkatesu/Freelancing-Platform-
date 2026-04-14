import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import "./Message.scss";
import newRequest from "../../utils/newRequest";
import { io } from "socket.io-client";

const Message = () => {
  const { id } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Connect to Socket.IO
    socketRef.current = io("http://localhost:8800");
    socketRef.current.emit("addUser", currentUser._id);

    // Listen for incoming messages
    socketRef.current.on("getMessage", (message) => {
      if (message.conversationId === id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Listen for typing indicator
    socketRef.current.on("userTyping", ({ conversationId }) => {
      if (conversationId === id) {
        setTyping(true);
      }
    });

    socketRef.current.on("userStopTyping", ({ conversationId }) => {
      if (conversationId === id) {
        setTyping(false);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id, currentUser._id]);

  // Fetch messages and conversation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [msgRes, convRes] = await Promise.all([
          newRequest.get(`/messages/${id}`),
          newRequest.get(`/conversations/single/${id}`),
        ]);
        setMessages(msgRes.data);
        setConversation(convRes.data);
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getReceiverId = () => {
    if (!conversation) return null;
    return currentUser.isSeller
      ? conversation.buyerId
      : conversation.sellerId;
  };

  const handleTyping = () => {
    const receiverId = getReceiverId();
    if (receiverId) {
      socketRef.current?.emit("typing", {
        conversationId: id,
        userId: currentUser._id,
        receiverId,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit("stopTyping", {
          conversationId: id,
          userId: currentUser._id,
          receiverId,
        });
      }, 1500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const receiverId = getReceiverId();

    try {
      const res = await newRequest.post("/messages", {
        conversationId: id,
        desc: newMsg,
      });

      setMessages((prev) => [...prev, res.data]);

      // Send via socket for real-time delivery
      socketRef.current?.emit("sendMessage", {
        conversationId: id,
        senderId: currentUser._id,
        receiverId,
        desc: newMsg,
      });

      // Stop typing indicator
      socketRef.current?.emit("stopTyping", {
        conversationId: id,
        userId: currentUser._id,
        receiverId,
      });

      setNewMsg("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="message">
        <div className="container">
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message">
      <div className="container">
        <div className="chat-header">
          <h2>Conversation</h2>
          <span className="conv-id">#{id.substring(0, 12)}...</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="empty-chat">No messages yet. Say hello! 👋</p>
          )}
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`chat-bubble ${
                msg.userId === currentUser._id ? "own" : "other"
              }`}
            >
              <p>{msg.desc}</p>
              <span className="time">{formatTime(msg.createdAt)}</span>
            </div>
          ))}
          {typing && (
            <div className="chat-bubble other typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            placeholder="Type a message..."
            value={newMsg}
            onChange={(e) => {
              setNewMsg(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button type="submit" disabled={!newMsg.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Message;