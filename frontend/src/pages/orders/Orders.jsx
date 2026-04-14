import React, { useEffect, useState } from "react";
import "./Orders.scss";
import newRequest from "../../utils/newRequest";
import { Link } from "react-router-dom";

const Orders = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
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
                <td>{currentUser.isSeller ? "Buyer #" + order.buyerId.substring(0, 5) : "Seller #" + order.sellerId.substring(0, 5)}</td>
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
  width: "50px",
  height: "50px",
  objectFit: "contain"
}}
                    onClick={() => handleContact(order)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
