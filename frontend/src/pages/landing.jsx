import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";


export default function LandingPage() {

    const router = useNavigate();

    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navheader">
                    <h2>Video Conferencing App</h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => {
                        router("/guestLink");
                    }}>Join as Guest</p>
                    <p onClick={() => {
                        router("/auth")
                    }}>Register</p>
                    <div onClick={() => {
                        router("/auth")
                    }} role="button">
                        <p >Sign In</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your friends</h1>
                    <p>Make the world small</p>
                    <div role="button">
                        <Link to={"/auth"}>
                            Get Started
                        </Link>
                    </div>
                </div>
                <div>
                    <img src="/group.png" alt=""></img>
                </div>
            </div>
        </div>
    )
}