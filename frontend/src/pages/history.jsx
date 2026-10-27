import React from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import "../App.css";

export default function History() {

    const { getHistoryOfuser } = useContext(AuthContext);

    const [meetings, setMettings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfuser();
                setMettings(history);
                console.log(history);
            } catch {
                // IMPLEMENT SNACK BAR
            }
        }
        fetchHistory();
    }, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <div className="historyPageContainer">

            {/* Navigation Bar */}
            <nav className="historyNavBar">
                <div className="historyNavBrand">
                    <HistoryIcon sx={{ fontSize: '1.8rem', color: '#FF9839' }} />
                    <h2>Meeting History</h2>
                </div>

                <Button
                    onClick={() => routeTo("/home")}
                    variant="contained"
                    startIcon={<HomeIcon />}
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
                    Back to Home
                </Button>
            </nav>

            {/* Content */}
            <div className="historyContent">
                {meetings.length !== 0 ? (
                    <div className="historyGrid">
                        {meetings.map((e, i) => (
                            <div className="historyCard" key={i}>
                                <div className="historyCardIcon">
                                    <VideoCallIcon sx={{ fontSize: '2rem', color: '#FF9839' }} />
                                </div>
                                <div className="historyCardInfo">
                                    <Typography sx={{
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                        letterSpacing: '0.5px',
                                        wordBreak: 'break-all',
                                    }}>
                                        {e.meetingCode}
                                    </Typography>
                                    <div className="historyCardDate">
                                        <CalendarTodayIcon sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }} />
                                        <Typography sx={{
                                            color: 'rgba(255,255,255,0.5)',
                                            fontSize: '0.85rem',
                                        }}>
                                            {formatDate(e.date)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="historyEmpty">
                        <HistoryIcon sx={{ fontSize: '4rem', color: 'rgba(255,255,255,0.15)' }} />
                        <Typography sx={{
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '1.2rem',
                            fontWeight: 500,
                            mt: 2,
                        }}>
                            No meeting history yet
                        </Typography>
                        <Typography sx={{
                            color: 'rgba(255,255,255,0.25)',
                            fontSize: '0.9rem',
                            mt: 0.5,
                        }}>
                            Your past meetings will appear here
                        </Typography>
                    </div>
                )}
            </div>
        </div>
    )
}