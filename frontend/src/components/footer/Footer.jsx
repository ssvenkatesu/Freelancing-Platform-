import React from "react";
import "./Footer.scss"

const Footer = () =>{
    return(
        <>
        <hr/>
        <div className="footer">
            <div className="container">
                <div className="top">
                    <div className="item">
                        {/* <h2>Categories</h2> */}
                    </div>
                </div>
                <div className="bottom">
                    <div className="left"></div>
                    <h2>Freelance</h2>
                    <span>Freelance. internation private limited. 2023</span>
                    <div className="right">
                        <div className="social">
                            <img src="img/twitter.png" alt="" />
                            <img src="img/facebook.png" alt="" />
                            <img src="img/linkedin.png" alt="" />
                            <img src="img/pinterest.png" alt="" />
                            <img src="img/instagram.png" alt="" />
                        </div>
                        <div className="link">
                            <img src="img/language.png" alt="img not found" />
                            <span>English</span>
                        </div>
                        <div className="link">
                            <img src="img/coin.png" alt="" />
                            <span>USD</span>
                        </div>
                        <img src="/img/accessibility.png" alt="" />
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default Footer;