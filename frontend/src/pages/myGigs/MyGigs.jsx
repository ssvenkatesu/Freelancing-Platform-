import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyGigs.scss";
import newRequest from "../../utils/newRequest";

const MyGigs = () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await newRequest.get(`/gigs?userId=${currentUser._id}`);
        setGigs(res.data);
      } catch (err) {
        setError("Failed to load gigs.");
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleDelete = async (id) => {
    try {
      await newRequest.delete(`/gigs/${id}`);
      setGigs((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert("Failed to delete gig.");
    }
  };

  if (loading) return <div className="myGigs"><div className="container"><p>Loading...</p></div></div>;

  return (
    <div className="myGigs">
      <div className="container">
        <div className="title">
          <h1>{currentUser?.isSeller ? "My Gigs" : "My Orders"}</h1>
          {currentUser?.isSeller && (
            <Link to="/add">
              <button>Add New Gig</button>
            </Link>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Price</th>
              <th>Sales</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {gigs.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                  No gigs yet. Create your first gig!
                </td>
              </tr>
            )}
            {gigs.map((gig) => (
              <tr key={gig._id}>
                <td>
                  <img
                    className="image"
                    src={gig.cover || "https://images.pexels.com/photos/270408/pexels-photo-270408.jpeg?auto=compress&cs=tinysrgb&w=1600"}
                    alt=""
                  />
                </td>
                <td>{gig.title}</td>
                <td>${gig.price}</td>
                <td>{gig.sales}</td>
                <td>
                  <img
                    className="delete"
                    src="./img/delete.png"
                    alt="Delete"
                    onClick={() => handleDelete(gig._id)}
                    style={{ cursor: "pointer" }}
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

export default MyGigs;
