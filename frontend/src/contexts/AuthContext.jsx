import { createContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useContext } from "react";
import httpStatus from "http-status";

import { IS_PROD, server } from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})

export default function AuthProvider({ children }) {

    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();


    const handleRegister = async (name, userName, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: userName,
                password: password
            })

            if (request.status === httpStatus.CREATED && request.data.token) {
                localStorage.setItem("token", request.data.token);
                navigate("/home");
            }
            return request.data.message;
        } catch(err) {
            // Re-throw the error so it can be handled in the component
            throw err;
        }
    }

        const handleLogin = async (userName, password) => {
            try {
                let request = await client.post("/login", {
                    username: userName,
                    password: password
                })

                if (request.status === httpStatus.OK) {
                    localStorage.setItem("token", request.data.token);
                    navigate("/home");
                }
            } catch(err) {
                throw err;
            }
        }

    const getHistoryOfuser = async () => {
        try {
            let request = await client.get("/get_all_activity", {params: {
                token: localStorage.getItem("token")
            }});
            return request.data;
        } catch(err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request;
        } catch(err) {
            throw err;
        }
    }

    const data = {
        userData,
        setUserData,
        addToUserHistory,
        getHistoryOfuser,
        handleRegister,
        handleLogin,
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}

