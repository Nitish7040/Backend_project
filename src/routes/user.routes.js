//user.routes.js

import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"


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




export default  router;
