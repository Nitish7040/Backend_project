//user.routes.js

import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

// routes for register........
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },                      // using middlewares
        {
            name : "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

//routes for login and logout
router.route("/login").post(loginUser)
//secured routes
router.route("/logout").post(verifyJWT , logoutUser)




export default  router;
