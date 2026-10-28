import React, { useEffect, useState } from "react";
import "./Orders.scss";
import newRequest from "../../utils/newRequest";
import { Link } from "react-router-dom";

const Orders = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [starRating, setStarRating] = useState(5);
  const [reviewDesc, setReviewDesc] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewedOrders, setReviewedOrders] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await newRequest.get("/orders");
        setOrders(res.data);
      } catch (err) {
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleContact = async (order) => {
    const sellerId = order.sellerId;
    const buyerId = order.buyerId;
    const id = sellerId + buyerId;

    try {
      const res = await newRequest.get(`/conversations/single/${id}`);
      window.location.href = `/message/${res.data.id}`;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const res = await newRequest.post("/conversations", {
            to: currentUser.isSeller ? buyerId : sellerId,
          });
          window.location.href = `/message/${res.data.id}`;
        } catch (err2) {
          console.error("Failed to create conversation:", err2);
        }
      }
    }
  };

  const handleOpenReviewModal = (order) => {
    setSelectedOrder(order);
    setStarRating(5);
    setReviewDesc("");
    setReviewError("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!reviewDesc.trim()) {
      setReviewError("Please write a brief review.");
      return;
    }

    setReviewLoading(true);
    setReviewError("");

    try {
      await newRequest.post("/reviews", {
        orderId: selectedOrder._id,
        gigId: selectedOrder.gigId,
        star: starRating,
        desc: reviewDesc,
      });

      setReviewedOrders((prev) => ({ ...prev, [selectedOrder._id]: true }));
      setSelectedOrder(null);
    } catch (err) {
      setReviewError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Failed to submit review. You may have already reviewed this project."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <div className="orders"><div className="container"><p>Loading orders...</p></div></div>;

  return (
    <div className="orders">
      <div className="container">
        <div className="title">
          <h1>{currentUser.isSeller ? "Orders I'm Fulfilling" : "Gigs I've Purchased"}</h1>
        </div>
        {error && <p className="error">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Price</th>
              <th>{currentUser.isSeller ? "Buyer" : "Seller"}</th>
              <th>Status</th>
              <th>Contact</th>
              {!currentUser.isSeller && <th>Review</th>}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={currentUser.isSeller ? "6" : "7"} style={{ textAlign: "center", padding: "40px" }}>
                  No orders found. {currentUser.isSeller ? "Wait for your first client!" : "Go find your first favorite gig!"}
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order._id}>
                <td>
                  <img
                    className="image"
                    src={order.img || "https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=1600"}
                    alt=""
                  />
                </td>
                <td>{order.title}</td>
                <td>${order.price}</td>
                <td>
                  {currentUser.isSeller ? (
                    "Buyer #" + order.buyerId.substring(0, 5)
                  ) : (
                    <Link to={`/profile/${order.sellerId}`} className="seller-link">
                      Seller #{order.sellerId.substring(0, 5)} ↗
                    </Link>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${order.isCompleted ? "completed" : "pending"}`}>
                    {order.isCompleted ? "Completed" : "In Progress"}
                  </span>
                </td>
                <td>
                  <img
                    className="message"
                    src="./img/message.png"
                    alt="Contact"
                    style={{
                      cursor: "pointer",
                      width: "36px",
                      height: "36px",
                      objectFit: "contain",
                    }}
                    onClick={() => handleContact(order)}
                  />
                </td>
                {!currentUser.isSeller && (
                  <td>
                    {order.isCompleted ? (
                      reviewedOrders[order._id] ? (
                        <span className="reviewed-badge">✓ Reviewed</span>
                      ) : (
                        <button
                          className="review-btn"
                          onClick={() => handleOpenReviewModal(order)}
                        >
                          ⭐ Rate Freelancer
                        </button>
                      )
                    ) : (
                      <span className="disabled-text">Pending completion</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <div className="review-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⭐ Rate & Review Freelancer</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <p className="order-title">
                Project: <strong>{selectedOrder.title}</strong>
              </p>

              <label>Select Rating (1 to 5 Stars):</label>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-icon ${star <= starRating ? "active" : ""}`}
                    onClick={() => setStarRating(star)}
                  >
                    ★
                  </span>
                ))}
                <span className="rating-label">{starRating} / 5 Stars</span>
              </div>

              <label>Client Review & Feedback:</label>
              <textarea
                rows="4"
                placeholder="Share details of your experience working with this freelancer..."
                value={reviewDesc}
                onChange={(e) => setReviewDesc(e.target.value)}
              />

              {reviewError && <p className="modal-error">{reviewError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={reviewLoading || !reviewDesc.trim()}
                >
                  {reviewLoading ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
