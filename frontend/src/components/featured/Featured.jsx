import React, { useState } from "react";
import "./Featured.scss"
import { useNavigate } from "react-router-dom";

const Featured = () => {
    const [input, setInput] = useState("");
    const navigate = useNavigate();

    const handleSubmit = () => {
        if (input.trim()) {
            navigate(`/gigs?search=${input}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    return(
        <div className="featured">
           <div className="container">
                <div className="left">
                    <h1>Scale your professional workforce with freelancers</h1>
                    <div className="search">
                        <div className="searchinput">
                            <img src="./img/search.png" alt=""/>
                            <input 
                                type="text" 
                                placeholder="Search for freelancers" 
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <button onClick={handleSubmit}>Search</button>
                    </div>
                    <div className="popular">
                        <span>Popular:</span>
                        <button onClick={() => navigate("/gigs?search=design")}>Web Design</button>
                        <button onClick={() => navigate("/gigs?search=wordpress")}>WordPress</button>
                        <button onClick={() => navigate("/gigs?search=logo")}>Logo Design</button>
                    </div>
                </div>

                <div className="right">
                    <img src="./img/man.png" alt="A man pic"></img>
                </div>
           </div>
        </div>
    );
}

export default Featured;