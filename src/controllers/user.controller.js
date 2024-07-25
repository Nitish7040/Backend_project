//user.controller.js

import { asyncHandler } from "../Utils/asyncHandler.js";
import {ApiError} from "../Utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../Utils/cloudinary.js";
import { ApiResponce} from "../Utils/ApiResponse.js";


// user registration controller


const registerUser = asyncHandler(async (req,res) => {
//get user detail from frontend
// validation - not empty
// check if user already exits : username ,email
// check for img and avatar
// upload them to cloudinary , avatar
// create user object - create entery in db
// remove passord and refreshtoken filed from response
// check for user creation 
// return response

    const {fullName , email , username , password} = req.body  
    // console.log("email:", email);
      /*
      if (fullName ==="") {
        throw new ApiError(400,"fullname is requried")
      }
        */
    if (
        [fullName,email,username,password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError (409, "user with email or username already exists")
    }


  // Debugging: Log the req.files object
  // console.log("req.files:", req.files);
  
  
  
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  
  // console.log("req.files:", req.files);
  
  if (!avatarLocalPath) {
    throw new ApiError (400,"avatar file is required")
  }
  

  const avatar =  await uploadOnCloudinary(avatarLocalPath) ;

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError (400,"avatar file is not upload on cloudinary")
  }

    const user = await User.create({
    fullName,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    email ,
    password,
    username : username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user")
}


return res.status(201).json(
    new ApiResponce(200, createdUser , "User register sucessfully !!")
)

})



// login controllers


const generateAccessAndRefreshToken = async (userId)=>{
  try {
      const user = await User.findById(userId);
     const accessToken = user.generateAccessToken();
     const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken
   await user.save({validateBeforeSave : false})
  
      return{accessToken , refreshToken};


  } catch (error) {
    throw new ApiError(500,"something went wrong while generating refresh and access token")
  }
}

const loginUser = asyncHandler (async (req , res) => {

// req body -> data
// username or email
// find the user
// password check
// acess and refresh token
// send cookies



const {email , username , password} = req.body
   if (!username && !email) { 
    // {!email for mail and !username for username}
    throw new ApiError(400, "username and email is required")
   }

// User.findOne({username}) 
const user = await User.findOne({
  $or : [{username} , {email}]
}) 


    if (!user) {
      throw new ApiError(404,"user doesnot exits")
    }


  const isPasswordValid = await user.isPasswordCorrect(password)

      if (!isPasswordValid) {
        throw new ApiError(401, "invalid user crenditials")
      }

    
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

      
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken");


    //send cookie-------------

    const options ={
      httpOnly : true ,
      secure : true ,
    }
    return res
    .status(200)
    .cookie("accessToken" ,accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
      new ApiResponce(
        200,
        {
          user : loggedInUser , accessToken, refreshToken ,
        },
        "User logged In Sucessfully"
      )
    )

});

// logout handler

const logoutUser = asyncHandler (async(req ,res) => {
        User.findByIdAndUpdate(
          req.user._id,
          {
            $set :{
              refreshToken : undefined
            }
          },
          {
            new : true
          }
        )
        const options ={
          httpOnly :true ,
          secure : true
        }
      return res 
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponce(200,{},"User Loggrd Out !!"))
})



export {
       registerUser ,
        loginUser , logoutUser
};
