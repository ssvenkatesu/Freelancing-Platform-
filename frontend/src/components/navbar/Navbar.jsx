import React, { useEffect, useState } from "react";
import "./Navbar.scss";
import { Link, useNavigate } from "react-router-dom";
import newRequest from "../../utils/newRequest";

const Navbar = () => {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  const isActive = () => {
    window.scrollY > 0 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => window.removeEventListener("scroll", isActive);
  }, []);

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.removeItem("currentUser");
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={active ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link to="/" className="link">
            <span className="text">Freelance</span>
          </Link>
          <span className="dot">.</span>
        </div>
        <div className="links">
          <span>Freelance Business</span>
          <span>Explore</span>
          <span>English</span>
          {!currentUser && (
            <Link className="link" to="/login">
              <span>Sign in</span>
            </Link>
          )}
          {!currentUser?.isSeller && <span>Become a Seller</span>}
          {!currentUser && (
            <Link className="link" to="/register">
              <button>Join</button>
            </Link>
          )}
          {currentUser && (
            <div className="user" onClick={() => setOpen(!open)}>
              <img
                src={
                  currentUser.img ||
                  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png"
                }
                alt=""
              />
              <span>{currentUser.username}</span>
              {open && (
                <div className="options">
                  {currentUser.isSeller && (
                    <>
                      <Link to="/mygigs">My Gigs</Link>
                      <Link to="/add">Add New Gig</Link>
                    </>
                  )}
                  <Link to="/orders">Orders</Link>
                  <Link to="/messages">Messages</Link>
                  <Link onClick={handleLogout}>Logout</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {active && (
        <>
          <hr />
          <div className="menu">
            <Link className="link" to="/gigs?cat=design">Graphics & Design</Link>
            <Link className="link" to="/gigs?cat=animation">Video & Animation</Link>
            <Link className="link" to="/gigs?cat=writing">Writing & Translations</Link>
            <Link className="link" to="/gigs?cat=marketing">Digital Marketing</Link>
            <Link className="link" to="/gigs?cat=ai">AI Services</Link>
            <Link className="link" to="/gigs?cat=music">Music & Audio</Link>
            <Link className="link" to="/gigs?cat=web">Programming & Tech</Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;