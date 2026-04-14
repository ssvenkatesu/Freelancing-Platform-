import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import newRequest from "../../utils/newRequest";
import { Slider } from "infinite-react-carousel/lib";
import "./Gig.scss";

const Gig = () => {
  const { id } = useParams();
  const [gig, setGig] = useState(null);
  const [seller, setSeller] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewInput, setReviewInput] = useState({ star: 5, desc: "" });
  const [reviewError, setReviewError] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const gigRes = await newRequest.get(`/gigs/single/${id}`);
        setGig(gigRes.data);

        const sellerRes = await newRequest.get(`/users/${gigRes.data.userId}`);
        setSeller(sellerRes.data);

        const reviewRes = await newRequest.get(`/reviews/${id}`);
        setReviews(reviewRes.data);

        // Check if purchased
        if (currentUser && !currentUser.isSeller) {
          const orderRes = await newRequest.get("/orders");
          const existingOrder = orderRes.data.find((o) => o.gigId === id);
          if (existingOrder) {
            setHasPurchased(true);
          }
        }
      } catch (err) {
        setError("Failed to load gig.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, currentUser?._id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError(null);
    try {
      const res = await newRequest.post("/reviews", {
        gigId: id,
        star: parseInt(reviewInput.star),
        desc: reviewInput.desc,
      });
      setReviews((prev) => [res.data, ...prev]);
      setReviewInput({ star: 5, desc: "" });
    } catch (err) {
      setReviewError(err.response?.data || "Could not submit review.");
    }
  };

  const avgStar =
    gig?.starNumber > 0
      ? Math.round(gig.totalStars / gig.starNumber)
      : 0;

  if (loading) return <div className="gig"><div className="container"><p className="loading-msg">Loading gig...</p></div></div>;
  if (error || !gig) return <div className="gig"><div className="container"><p className="error-msg">{error || "Gig not found."}</p></div></div>;

  const allImages = [gig.cover, ...(gig.images || [])].filter(Boolean);

  return (
    <div className="gig">
      <div className="container">
        {/* LEFT SIDE */}
        <div className="left">
          <span className="breadcrumbs">Freelance &gt; {gig.cat || "Services"} &gt;</span>
          <h1>{gig.title}</h1>

          {seller && (
            <div className="user">
              <img
                className="pp"
                src={seller.img || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                alt=""
              />
              <span>{seller.username}</span>
              {avgStar > 0 && (
                <div className="stars">
                  {[...Array(avgStar)].map((_, i) => (
                    <img key={i} src="/img/star.png" alt="" />
                  ))}
                  <span>{avgStar}</span>
                </div>
              )}
            </div>
          )}

          {allImages.length > 0 ? (
            <Slider slidesToShow={1} arrowsScroll={1} className="slider">
              {allImages.map((img, i) => (
                <img key={i} src={img} alt={`gig-img-${i}`} />
              ))}
            </Slider>
          ) : (
            <div className="slider no-img">
              <p>No images provided.</p>
            </div>
          )}

          <h2>About This Gig</h2>
          <p>{gig.desc}</p>

          {seller && (
            <div className="seller">
              <h2>About The Seller</h2>
              <div className="user">
                <img
                  src={seller.img || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"}
                  alt=""
                />
                <div className="info">
                  <span>{seller.username}</span>
                  <button>Contact Me</button>
                </div>
              </div>
              <div className="box">
                <div className="items">
                  {seller.country && (
                    <div className="item">
                      <span className="title">From</span>
                      <span className="desc">{seller.country}</span>
                    </div>
                  )}
                  {seller.desc && (
                    <div className="item">
                      <span className="title">About</span>
                      <span className="desc">{seller.desc}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REVIEWS */}
          <div className="reviews">
            <h2>Reviews ({reviews.length})</h2>

            {reviews.map((review) => (
              <div className="item" key={review._id}>
                <div className="user">
                  <img
                    className="pp"
                    src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                    alt=""
                  />
                  <div className="info">
                    <span>User</span>
                  </div>
                </div>
                <div className="stars">
                  {[...Array(review.star)].map((_, i) => (
                    <img key={i} src="/img/star.png" alt="" />
                  ))}
                  <span>{review.star}</span>
                </div>
                <p>{review.desc}</p>
                <hr />
              </div>
            ))}

            {/* Add review form (buyers only) */}
            {currentUser && !currentUser.isSeller && (
              <form className="add-review" onSubmit={handleReviewSubmit}>
                <h3>Leave a Review</h3>
                <select
                  value={reviewInput.star}
                  onChange={(e) => setReviewInput((p) => ({ ...p, star: e.target.value }))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Share your experience..."
                  value={reviewInput.desc}
                  onChange={(e) => setReviewInput((p) => ({ ...p, desc: e.target.value }))}
                  required
                />
                {reviewError && <span className="err">{reviewError}</span>}
                <button type="submit">Submit Review</button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="right">
          <div className="price">
            <h3>{gig.shortTitle || gig.title}</h3>
            <h2>$ {gig.price}</h2>
          </div>
          <p>{gig.shortDesc || gig.desc?.substring(0, 120)}</p>
          <div className="details">
            {gig.deliveryTime && (
              <div className="item">
                <img src="/img/clock.png" alt="" />
                <span>{gig.deliveryTime} Day{gig.deliveryTime > 1 ? "s" : ""} Delivery</span>
              </div>
            )}
            {gig.revisionNumber && (
              <div className="item">
                <img src="/img/recycle.png" alt="" />
                <span>{gig.revisionNumber} Revision{gig.revisionNumber > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          {gig.features?.length > 0 && (
            <div className="features">
              {gig.features.map((f, i) => (
                <div className="item" key={i}>
                  <img src="/img/greencheck.png" alt="" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}
          {currentUser ? (
            hasPurchased ? (
              <button disabled className="purchased-btn">Already Purchased</button>
            ) : (
              <Link to={`/samplepay/${id}`}>
                <button>Continue</button>
              </Link>
            )
          ) : (
            <Link to="/login">
              <button>Login to Order</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gig;
