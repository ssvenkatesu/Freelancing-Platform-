import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./samplepay.scss";
import newRequest from "../../utils/newRequest";

const Samplepay = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [step, setStep] = useState("review"); // "review" | "paying" | "success"
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Card form state (all fake)
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await newRequest.get(`/gigs/single/${gigId}`);
        setGig(res.data);
      } catch (err) {
        setError("Gig not found.");
      } finally {
        setLoading(false);
      }
    };
    if (gigId) fetchGig();
    else setLoading(false);
  }, [gigId]);

  const formatCardNumber = (val) => {
    return val
      .replace(/\D/g, "")
      .substring(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").substring(0, 4);
    if (digits.length >= 3) return digits.substring(0, 2) + "/" + digits.substring(2);
    return digits;
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCard((prev) => ({
      ...prev,
      [name]:
        name === "number"
          ? formatCardNumber(value)
          : name === "expiry"
          ? formatExpiry(value)
          : name === "cvv"
          ? value.replace(/\D/g, "").substring(0, 3)
          : value,
    }));
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!gigId) {
      setError("No gig selected for payment.");
      return;
    }

    setStep("paying");
    setPaying(true);

    // Simulate payment processing animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const res = await newRequest.post("/orders", { gigId });
      setOrder(res.data);
      setStep("success");
    } catch (err) {
      setError(err.response?.data || "Payment failed. Please try again.");
      setStep("review");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="pay">
        <div className="pay-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (step === "success" && order) {
    return (
      <div className="pay">
        <div className="pay-container success-container">
          <div className="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p className="success-sub">Your order has been placed successfully.</p>
          <div className="order-details">
            <div className="detail-row">
              <span>Order ID</span>
              <span className="mono">{order._id}</span>
            </div>
            <div className="detail-row">
              <span>Payment Ref</span>
              <span className="mono">{order.payment_intent}</span>
            </div>
            <div className="detail-row">
              <span>Gig</span>
              <span>{order.title}</span>
            </div>
            <div className="detail-row total">
              <span>Amount Paid</span>
              <span>${order.price}</span>
            </div>
          </div>
          <div className="action-btns">
            <button className="primary-btn" onClick={() => navigate("/orders")}>
              View My Orders
            </button>
            <button className="secondary-btn" onClick={() => navigate("/")}>
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "paying") {
    return (
      <div className="pay">
        <div className="pay-container processing-container">
          <div className="spinner"></div>
          <h2>Processing Payment...</h2>
          <p>Please do not close this window.</p>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pay">
      <div className="pay-container">
        <div className="pay-left">
          <h1>Checkout</h1>
          <div className="gig-summary">
            {gig?.cover && <img src={gig.cover} alt="Gig" />}
            <div className="gig-info">
              <h3>{gig?.title || "Gig Package"}</h3>
              {gig?.deliveryTime && (
                <p>🕒 {gig.deliveryTime} day delivery</p>
              )}
              {gig?.revisionNumber && (
                <p>🔁 {gig.revisionNumber} revision{gig.revisionNumber > 1 ? "s" : ""}</p>
              )}
            </div>
          </div>

          <div className="price-breakdown">
            <div className="price-row">
              <span>Service fee</span>
              <span>${gig?.price || 0}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>${gig?.price || 0}</span>
            </div>
          </div>

          <div className="secure-badge">
            🔒 Secure, encrypted payment · Money-back guarantee
          </div>
        </div>

        <div className="pay-right">
          <h2>Payment Details</h2>
          <p className="demo-notice">🧪 Demo Mode — Use any card details</p>

          <form onSubmit={handlePay} className="card-form">
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="number"
                value={card.number}
                onChange={handleCardChange}
                placeholder="4242 4242 4242 4242"
                required
              />
            </div>
            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                type="text"
                name="name"
                value={card.name}
                onChange={handleCardChange}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiry"
                  value={card.expiry}
                  onChange={handleCardChange}
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={card.cvv}
                  onChange={handleCardChange}
                  placeholder="123"
                  required
                />
              </div>
            </div>

            {error && <p className="pay-error">{error}</p>}

            <button type="submit" className="pay-btn" disabled={paying}>
              Pay ${gig?.price || 0} Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Samplepay;