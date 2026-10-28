import React, { useRef, useState, useEffect } from "react";
import { TextField, Button, IconButton, Badge } from "@mui/material";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";
import styles from "../styles/videoComponent.module.css";
import VideocamOffTwoToneIcon from '@mui/icons-material/VideocamOffTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import CallEndTwoToneIcon from '@mui/icons-material/CallEndTwoTone';
import MicOffTwoToneIcon from '@mui/icons-material/MicOffTwoTone';
import MicNoneTwoToneIcon from '@mui/icons-material/MicNoneTwoTone';
import ScreenShare from '@mui/icons-material/ScreenShareTwoTone';
import ScreenShareOff from '@mui/icons-material/StopScreenShareTwoTone';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import '../App.css';

import { IS_PROD, server, ws_server } from "../environment";
import { connectSocket } from "../utils/socketAdapter";

const server_url = ws_server || server;
var connections = {};
let audioCtx = null; // reuse a single AudioContext to avoid browser limit exhaustion

const peerConfigConnections = {
    "iceServers": [
        {
            "urls": "stun:stun.l.google.com:19302"
        }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let showModalRef = useRef(true);

    let localVideoRef = useRef();
    const videoRef = useRef([]);

    let [videoAvailable, setVideoAvailable] = useState(true); // video hardware available
    let [audioAvailable, setAudioAvailable] = useState(true); // audio hardware available
    let [video, setVideo] = useState(true); // video is currently on or off
    let [audio, setAudio] = useState(true); // audio is currently on or off
    let [screen, setScreen] = useState(); // screen share active or not
    let [showModal, setModal] = useState(true);
    let [screenAvailable, setScreenAvailable] = useState(); // does browser support screen sharing
    let [messages, setMessages] = useState([]); // all chat messages
    let [message, setMessage] = useState(""); // current chat message
    let [newMessages, setNewMessages] = useState(0); // unread messages
    let [askForUsername, setaskForUsername] = useState(true); // for guest mode login
    let [username, setUsername] = useState(""); // for guest mode
    let [videos, setVideos] = useState([]);

    // ASK the browser for permission to use the media devices on mount
    const getPermissions = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            setVideoAvailable(true);
            setAudioAvailable(true);
            setVideo(true);
            setAudio(true);

            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }
            return stream;
        } catch (err) {
            setVideoAvailable(false);
            setAudioAvailable(false);
            setVideo(false);
            setAudio(false);
            console.log('Media permission denied or device not found:', err);
        }
    }

    useEffect(() => {
        getPermissions();
    }, []);

    // When transitioning from lobby to meeting room, attach stream to the new in-room video element
    useEffect(() => {
        if (!askForUsername && localVideoRef.current && window.localStream) {
            localVideoRef.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    useEffect(() => {
        showModalRef.current = showModal;
        if (showModal) {
            setNewMessages(0);
        }
    }, [showModal]);

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) { // here id is same as id2 used in socket.on("signal")
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setAudio(false);
            setVideo(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {
                console.log(e);
            }

            // TODO blacksilence

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for (let id in connections) {
                connections[id].addStream(window.localStream);

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description).then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                    }).catch(e => console.log(e));
                })
            }
        })
    }

    let silence = () => {
        // Reuse a single AudioContext — browsers cap simultaneous instances (typically 6-8)
        if (!audioCtx || audioCtx.state === 'closed') {
            audioCtx = new AudioContext();
        }
        let oscillator = audioCtx.createOscillator();
        let dst = oscillator.connect(audioCtx.createMediaStreamDestination());
        oscillator.start();
        audioCtx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }


    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });

        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();

        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio }).then(getUserMediaSuccess)
                .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {
                console.log(e);
            }
        }
    }

    //TODO
    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === "offer") {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }
            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    // TODO
    let addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);

        if (socketIdSender !== socketIdRef.current && !showModalRef.current) {
            setNewMessages((prevMessages) => prevMessages + 1);
        }
    }


    let connectToSocketServer = () => {
        socketRef.current = connectSocket(server_url, { secure: server_url.startsWith("https") });

        socketRef.current.on("signal", gotMessageFromServer);

        socketRef.current.on("chat-message", addMessage);

        socketRef.current.on("user-left", (id) => {
            setVideos((videos) => videos.filter((video) => video.socketId !== id));
            videoRef.current = videoRef.current.filter((video) => video.socketId !== id);
            if (connections[id]) {
                try { connections[id].close(); } catch(e) {}
                delete connections[id];
            }
        });

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach((socketListId) => {
                connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                connections[socketListId].onicecandidate = (event) => { // it is to establish a direct connection between the two peers
                    if (event.candidate !== null) {
                        socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                    }
                }

                connections[socketListId].onaddstream = (event) => {
                    console.log('onaddstream from', socketListId, event);

                    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    if (videoExists) {
                        setVideos(videos => {
                            const updatedVideos = videos.map(video =>
                                video.socketId === socketListId ? { ...video, stream: event.stream } : video
                            );
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        })
                    } else {

                        let newVideo = {
                            socketId: socketListId,
                            stream: event.stream,
                            autoPlay: true,
                            playsinline: true,
                        }

                        setVideos(videos => {
                            const updatedVideos = [...videos, newVideo];
                            videoRef.current = updatedVideos;
                            return updatedVideos;
                        });
                    }
                };

                if (window.localStream !== undefined && window.localStream !== null) {
                    connections[socketListId].addStream(window.localStream);

                } else {
                    // TODO
                    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                    window.localStream = blackSilence();
                    connections[socketListId].addStream(window.localStream);
                }
            });

            if (id === socketIdRef.current) {
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current) continue;

                    try {
                        connections[id2].addStream(window.localStream);
                    } catch (e) {

                    }
                    connections[id2].createOffer().then((description) => {
                        connections[id2].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                }
            }
        });

        socketRef.current.on("connect", (id) => {
            if (id) {
                socketIdRef.current = id;
            }
            else if (socketRef.current.id) {
                socketIdRef.current = socketRef.current.id;
            }
            socketRef.current.emit("join-call", window.location.href, username || "Guest");
        });
    }

    let routeTo = useNavigate();

    let getMedia = () => {
        connectToSocketServer();
    }

    let connect = async () => {
        setaskForUsername(false);
        if (!window.localStream && (videoAvailable || audioAvailable)) {
            await getPermissions();
        }
        getMedia();
    }

    let handleVideo = () => {
        setVideo(prev => {
            const next = !prev;
            if (window.localStream) {
                window.localStream.getVideoTracks().forEach(track => {
                    track.enabled = next;
                });
            }
            return next;
        });
    }

    let handlleAudio = () => {
        setAudio(prev => {
            const next = !prev;
            if (window.localStream) {
                window.localStream.getAudioTracks().forEach(track => {
                    track.enabled = next;
                });
            }
            return next;
        });
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());

        } catch (e) { console.log(e) }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                    }).catch(e => console.log(e));

            }).catch(e => console.log(e));

        }
        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(t => t.stop());
            } catch (e) {
                console.log(e);
            }

            getPermissions().then((camStream) => {
                const activeStream = camStream || new MediaStream([black(), silence()]);
                window.localStream = activeStream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = activeStream;
                }

                for (let id in connections) {
                    if (id === socketIdRef.current) continue;
                    try {
                        connections[id].addStream(activeStream);
                        connections[id].createOffer().then((description) => {
                            connections[id].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        })
    }

    let getDisplayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDisplayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen);
    }

    let sendMessage = () => {
        if (!message || !message.trim()) return;
        if (socketRef.current) {
            socketRef.current.emit("chat-message", message.trim(), username || "Guest");
            setMessage("");
        }
    }

    let handleEndCall = () => {
        // 1. Stop all local media tracks (camera/mic/screen)
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) { }

        // 2. Close all RTCPeerConnections — stops media flow and frees bandwidth/CPU
        Object.values(connections).forEach(pc => {
            try { pc.close(); } catch (e) { }
        });
        connections = {}; // clear module-level object so stale refs don't persist into next call

        // 3. Explicitly disconnect the socket — server fires 'disconnect' immediately
        //    instead of waiting for the default timeout (~30s), so other users see you leave right away
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // 4. Close the shared AudioContext if it exists
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close();
            audioCtx = null;
        }

        // 5. Clear the window-level stream reference
        window.localStream = null;

        // 6. Reset all UI state so stale data doesn't persist if user rejoins
        setVideos([]);
        videoRef.current = [];   // clear the ref too — prevents ghost video canvases
        setMessages([]);         // clear chat history
        setNewMessages(0);       // reset unread badge
        setMessage("");          // clear unsent chat input

        routeTo("/home");
    }



    return (
        <div>
            {askForUsername === true ?
                <div className="lobbyPageContainer">
                    <div className="lobbyCard">
                        <div className="lobbyHeader">
                            <div className="lobbyIconCircle">
                                <PersonIcon sx={{ fontSize: '2.2rem', color: '#FF9839' }} />
                            </div>
                            <h2 className="lobbyTitle">Join Meeting</h2>
                            <p className="lobbySubtext">Enter your display name to continue</p>
                        </div>

                        <div className="lobbyForm">
                            <TextField
                                id="lobby-username"
                                placeholder="Your display name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                variant="outlined"
                                fullWidth
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: '14px',
                                        color: '#fff',
                                        fontSize: '1rem',
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
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={connect}
                                fullWidth
                                sx={{
                                    background: 'linear-gradient(135deg, #FF9839 0%, #ff5e62 100%)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '1.05rem',
                                    padding: '14px',
                                    borderRadius: '14px',
                                    textTransform: 'none',
                                    boxShadow: '0 8px 25px rgba(255,152,57,0.3)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #e68933 0%, #e65050 100%)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 12px 35px rgba(255,152,57,0.4)',
                                    },
                                }}
                            >
                                Connect
                            </Button>
                        </div>

                        <div className="lobbyVideoPreview">
                            <video ref={localVideoRef} autoPlay muted></video>
                        </div>
                    </div>
                </div> :
                <div className={styles.meetVideoContainer}>

                    {showModal ? <div className={styles.chatRoom}>
                        <div className={styles.chatContainer}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '18px 24px 14px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                flexShrink: 0,
                            }}>
                                <h1 style={{
                                    margin: 0,
                                    fontSize: '1.3rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    padding: 0,
                                    border: 'none',
                                }}>Chat</h1>
                                <IconButton
                                    onClick={() => { setModal(false); }}
                                    sx={{
                                        color: 'rgba(255,255,255,0.5)',
                                        '&:hover': { color: '#ff5e62', background: 'rgba(255,94,98,0.1)' },
                                    }}
                                    size="small"
                                >
                                    <CloseRoundedIcon />
                                </IconButton>
                            </div>

                            <div className={styles.chattingDisplay}>

                                {messages.length > 0 ? messages.map((item, index) => {
                                    return (
                                        <div key={index} style={{
                                            padding: '10px 14px',
                                            background: 'rgba(255,255,255,0.04)',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <p style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: '#FF9839',
                                                margin: '0 0 4px 0',
                                            }}>{item.sender}</p>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.9rem',
                                                color: 'rgba(255,255,255,0.85)',
                                                lineHeight: 1.5,
                                            }}>{item.data}</p>
                                        </div>
                                    )
                                }) : <p style={{
                                    color: 'rgba(255,255,255,0.3)',
                                    textAlign: 'center',
                                    marginTop: '2rem',
                                    fontSize: '0.9rem',
                                }}>Start a conversation</p>}

                            </div>
                            <div className={styles.chattingArea}>
                                <TextField
                                    value={message || ""}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    id="chat-input"
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    fullWidth
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '0.9rem',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,152,57,0.3)' },
                                            '&.Mui-focused fieldset': { borderColor: '#FF9839' },
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                            color: 'rgba(255,255,255,0.3)',
                                            opacity: 1,
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={sendMessage}
                                    sx={{
                                        background: 'linear-gradient(135deg, #FF9839, #ff5e62)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        width: '42px',
                                        height: '42px',
                                        flexShrink: 0,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #e68933, #e65050)',
                                        },
                                    }}
                                >
                                    <SendRoundedIcon fontSize="small" />
                                </IconButton>
                            </div>
                        </div>
                    </div> : <></>}


                    <div className={styles.buttonContainers}>
                        <IconButton
                            onClick={handleVideo}
                            sx={{
                                color: video ? '#fff' : '#ff5e62',
                                background: video ? 'rgba(255,255,255,0.08)' : 'rgba(255,94,98,0.15)',
                                borderRadius: '14px',
                                width: '52px',
                                height: '52px',
                                transition: 'all 0.2s ease',
                                '&:hover': { background: video ? 'rgba(255,255,255,0.14)' : 'rgba(255,94,98,0.25)' },
                            }}
                        >
                            {video ? <VideocamTwoToneIcon /> : <VideocamOffTwoToneIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handlleAudio}
                            sx={{
                                color: audio ? '#fff' : '#ff5e62',
                                background: audio ? 'rgba(255,255,255,0.08)' : 'rgba(255,94,98,0.15)',
                                borderRadius: '14px',
                                width: '52px',
                                height: '52px',
                                transition: 'all 0.2s ease',
                                '&:hover': { background: audio ? 'rgba(255,255,255,0.14)' : 'rgba(255,94,98,0.25)' },
                            }}
                        >
                            {audio ? <MicNoneTwoToneIcon /> : <MicOffTwoToneIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleEndCall}
                            sx={{
                                background: 'linear-gradient(135deg, #ff5e62, #d63031)',
                                color: '#fff',
                                borderRadius: '14px',
                                width: '56px',
                                height: '56px',
                                boxShadow: '0 4px 18px rgba(255,94,98,0.35)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #e64c50, #b52828)',
                                    transform: 'scale(1.05)',
                                },
                            }}
                        >
                            <CallEndTwoToneIcon />
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton
                                onClick={handleScreen}
                                sx={{
                                    color: screen ? '#FF9839' : '#fff',
                                    background: screen ? 'rgba(255,152,57,0.15)' : 'rgba(255,255,255,0.08)',
                                    borderRadius: '14px',
                                    width: '52px',
                                    height: '52px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { background: screen ? 'rgba(255,152,57,0.25)' : 'rgba(255,255,255,0.14)' },
                                }}
                            >
                                {screen ? <ScreenShare /> : <ScreenShareOff />}
                            </IconButton> : <></>}

                        <Badge
                            badgeContent={newMessages}
                            invisible={showModal || newMessages === 0}
                            max={99}
                            sx={{
                                '& .MuiBadge-badge': {
                                    background: 'linear-gradient(135deg, #FF9839, #ff5e62)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    minWidth: '20px',
                                    height: '20px',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(255,152,57,0.4)',
                                },
                            }}
                        >
                            <IconButton
                                onClick={() => { setModal(!showModal); }}
                                sx={{
                                    color: showModal ? '#FF9839' : '#fff',
                                    background: showModal ? 'rgba(255,152,57,0.15)' : 'rgba(255,255,255,0.08)',
                                    borderRadius: '14px',
                                    width: '52px',
                                    height: '52px',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { background: showModal ? 'rgba(255,152,57,0.25)' : 'rgba(255,255,255,0.14)' },
                                }}
                            >
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
                    <div className={styles.conferenceView}>
                        {videos.map((video) => (

                            <div key={video.socketId}>

                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }} autoPlay></video>
                            </div>

                        ))}
                    </div>

                </div>}
        </div>
    );
}