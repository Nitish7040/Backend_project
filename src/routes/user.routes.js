//user.routes.js

import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
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

router.route("/refresh-token").post( refreshAccessToken)



export default  router;
