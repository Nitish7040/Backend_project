//user.routes.js

import { Router } from "express";
import {
     changeCurrentPassword, 
     getCurrentUser, 
     getUserChannelProfile,
      getWatchHistory, 
      loginUser,
       logoutUser,
        registerUser,
         updateAccountDetails, 
         updateUserAvatar, 
         updateUserCoverImage 
        } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import{refreshAccessToken} from "../controllers/user.controller.js"

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

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router
.route("/cover-image")
.patch(
    verifyJWT, 
    upload.single("cover-image"), updateUserCoverImage
)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default  router;
