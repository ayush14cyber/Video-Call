import { User } from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt, { hash } from 'bcrypt';
import crypto from 'crypto';
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) { // checks if username and password are provided
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username }); // finds user by username
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }
        if (await bcrypt.compare(password, user.password)) {
            let token = crypto.randomBytes(20).toString('hex'); // generates random token for session
            user.token = token;
            await user.save(); // saves token to database
            return res.status(httpStatus.OK).json({ message: "User logged in successfully", token: token });
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }
    } catch(e) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;

    // Validate required fields
    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Name, username, and password are required" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already taken" });
        }

        // register new user
        const hashedPassword = await bcrypt.hash(password, 10);

        const token = crypto.randomBytes(20).toString('hex'); // log the user in right away

        const newUser = new User({
            name: name,
            username: username,
            password: hashedPassword,
            token: token
        });

        await newUser.save(); // saves new user to database
        res.status(httpStatus.CREATED).json({ message: "User registered successfully", token: token });
    } catch(e) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal Server Error" });
    }
}

const getuserHistory = async (req, res) => {
    const {token} = req.query;

    try {
        const user = await User.findOne({token: token});
        const meetings = await Meeting.find({user_id: user.username});
        res.json(meetings);
    } catch (e) {
        res.json({message: `Something went wrong: ${e}`});
    }
}

const addToHistory = async (req, res) => {
    const {token, meeting_code} = req.body;

    try {
        const user = await User.findOne({token: token});

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        });

        await newMeeting.save(); // saves new meeting to database
        res.status(httpStatus.CREATED).json({ message: "Meeting added to history successfully" });
    } catch(e) {
        res.json({message: `Something went wrong: ${e}`});
    }
}

export { login, register, getuserHistory, addToHistory};