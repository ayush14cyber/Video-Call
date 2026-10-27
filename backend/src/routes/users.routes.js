import { Router } from "express";
import { login, register, getuserHistory, addToHistory} from "../controllers/user.controller.js";


const router = Router(); // creating a new router instance

router.route("/login").post(login); // defining POST route for /login
router.route("/register").post(register); // defining POST route for /register
router.route("/add_to_activity").post(addToHistory); // defining POST route for /add_to_activity
router.route("/get_all_activity").get(getuserHistory); // defining GET route for /get_all_activity


export default router;