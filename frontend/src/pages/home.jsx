import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import logo from "../assets/logo.png";
import { TextField } from "@mui/material";
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button';
import { AuthContext } from "../contexts/AuthContext";
import VideoCallIcon from '@mui/icons-material/VideoCall';
import LogoutIcon from '@mui/icons-material/Logout';

function HomeComponent() {

        let navigate = useNavigate();
        const [meetingCode, setMeetingCode] = useState("");

        const {addToUserHistory} = useContext(AuthContext);
        let handleJoinVideoCall = async () => {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`)
        }

    return (
        <div className="homePageContainer">

            {/* Navigation Bar */}
            <nav className="homeNavBar">
                <div className="homeNavBrand">
                    <h2>Let's Connect</h2>
                </div>

                <div className="homeNavActions">
                    <Button
                        onClick={() => navigate("/history")}
                        variant="contained"
                        startIcon={<RestoreIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            padding: '10px 24px',
                            boxShadow: '0 4px 18px rgba(0, 180, 216, 0.3)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0096c7 0%, #005f8a 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(0, 180, 216, 0.45)',
                            },
                        }}
                    >
                        History
                    </Button>
                    
                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #ff5e62 0%, #d63031 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '1rem',
                            padding: '10px 24px',
                            boxShadow: '0 4px 18px rgba(255, 94, 98, 0.3)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #e64c50 0%, #b52828 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(255, 94, 98, 0.45)',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="homeMainContent">

                {/* Left Panel — Text & Join Form */}
                <div className="homeLeftPanel">
                    <div className="homeHeroContent">
                        <h1>
                            <span className="homeHighlight">Video calls</span> with
                            <br />friends & family
                        </h1>
                        <p className="homeSubtext">
                            Start or join a meeting instantly. Stay connected with the people who matter most — anywhere, anytime.
                        </p>

                        <div className="homeJoinForm">
                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                id="meeting-code-input"
                                placeholder="Enter meeting code"
                                variant="outlined"
                                fullWidth
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '14px',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        transition: 'all 0.3s ease',
                                        '& fieldset': {
                                            borderColor: 'rgba(255,255,255,0.12)',
                                            transition: 'border-color 0.3s ease',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255,152,57,0.4)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#FF9839',
                                            boxShadow: '0 0 0 3px rgba(255,152,57,0.1)',
                                        },
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '14px 18px',
                                        '&::placeholder': {
                                            color: 'rgba(255,255,255,0.35)',
                                            opacity: 1,
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: 'rgba(255,255,255,0.5)',
                                    },
                                }}
                            />
                            <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                startIcon={<VideoCallIcon />}
                                sx={{
                                    background: 'linear-gradient(135deg, #FF9839 0%, #ff5e62 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    padding: '12px 32px',
                                    borderRadius: '14px',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 25px rgba(255,152,57,0.3)',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #e68933 0%, #e65050 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(255,152,57,0.4)',
                                    },
                                }}
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel — Image */}
                <div className="homeRightPanel">
                    <img src={logo} alt="Video conferencing illustration" />
                </div>

            </div>
        </div>
    )
}

export default withAuth(HomeComponent);