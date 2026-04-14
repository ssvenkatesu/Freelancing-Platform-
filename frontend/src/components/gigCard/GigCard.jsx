import React from "react";
import "./GigCard.scss";
import { Link } from "react-router-dom";

const GigCard = ({ item }) => {
  const avgStar =
    item.starNumber > 0
      ? Math.round(item.totalStars / item.starNumber)
      : 0;

  return (
    <Link to={`/gig/${item._id}`} className="link">
      <div className="gigCard">
        <img
          src={
            item.cover ||
            item.img ||
            "https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=1600"
          }
          alt={item.title || item.desc}
        />
        <div className="info">
          <div className="user">
            <img
              src={
                item.pp ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
              }
              alt=""
            />
            <span>{item.username || "Freelancer"}</span>
          </div>
          <p>{(item.desc || item.title || "").substring(0, 80)}{(item.desc || "").length > 80 ? "..." : ""}</p>
          {avgStar > 0 && (
            <div className="star">
              <img src="./img/star.png" alt="" />
              <span>{avgStar} ({item.starNumber})</span>
            </div>
          )}
        </div>
        <hr />
        <div className="detail">
          <img src="./img/heart.png" alt="" />
          <div className="price">
            <span>STARTING AT</span>
            <h2>$ {item.price}</h2>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
