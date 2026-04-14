import React, { useEffect, useRef, useState } from "react";
import "./Gigs.scss";
import GigCard from "../../components/gigCard/GigCard";
import newRequest from "../../utils/newRequest";
import { useSearchParams } from "react-router-dom";

const Gigs = () => {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("cat") || "";
  const searchParam = searchParams.get("search") || "";

  const [sort, setSort] = useState("sales");
  const [open, setOpen] = useState(false);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const minRef = useRef();
  const maxRef = useRef();

  const fetchGigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (catParam) params.append("cat", catParam);
      if (searchParam) params.append("search", searchParam);
      if (minRef.current?.value) params.append("min", minRef.current.value);
      if (maxRef.current?.value) params.append("max", maxRef.current.value);
      params.append("sort", sort);

      const res = await newRequest.get(`/gigs?${params.toString()}`);
      setGigs(res.data);
    } catch (err) {
      setError("Failed to load gigs. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGigs();
  }, [sort, catParam, searchParam]);

  const reSort = (type) => {
    setSort(type);
    setOpen(false);
  };

  const apply = () => fetchGigs();

  const catLabel = {
    design: "Graphics & Design",
    web: "Programming & Tech",
    animation: "Video & Animation",
    music: "Music & Audio",
    marketing: "Digital Marketing",
    writing: "Writing & Translations",
    ai: "AI Services",
  };

  return (
    <div className="gigs">
      <div className="container">
        <span className="breadcrumbs">
          Freelance &gt; {catLabel[catParam] || (searchParam ? "Search Results" : "All Categories")} &gt;
        </span>
        <h1>{catLabel[catParam] || (searchParam ? `Results for "${searchParam}"` : "All Gigs")}</h1>
        <p>
          Explore the boundaries of talent and technology with experts from around the globe
        </p>
        <div className="menu">
          <div className="left">
            <span>Budget</span>
            <input ref={minRef} type="number" placeholder="min" />
            <input ref={maxRef} type="number" placeholder="max" />
            <button onClick={apply}>Apply</button>
          </div>
          <div className="right">
            <span className="sortBy">Sort by</span>
            <span className="sortType">
              {sort === "sales" ? "Best Selling" : "Newest"}
            </span>
            <img src="./img/down.png" alt="" onClick={() => setOpen(!open)} />
            {open && (
              <div className="rightMenu">
                {sort === "sales" ? (
                  <span onClick={() => reSort("createdAt")}>Newest</span>
                ) : (
                  <span onClick={() => reSort("sales")}>Best Selling</span>
                )}
                <span onClick={() => reSort("sales")}>Popular</span>
              </div>
            )}
          </div>
        </div>
        <div className="cards">
          {loading && <span className="loading">Loading gigs...</span>}
          {error && <span className="error">{error}</span>}
          {!loading && !error && gigs.length === 0 && (
            <span className="empty">
              No results found for your search. Try adjusting filters or searching for something else!
            </span>
          )}
          {!loading &&
            gigs.map((gig) => <GigCard key={gig._id} item={gig} />)}
        </div>
      </div>
    </div>
  );
};

export default Gigs;