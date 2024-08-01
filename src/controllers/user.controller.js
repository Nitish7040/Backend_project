//user.controller.js

import { asyncHandler } from "../Utils/asyncHandler.js";
import {ApiError} from "../Utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../Utils/cloudinary.js";
import { ApiResponce} from "../Utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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


const refreshAccessToken = asyncHandler(async (req ,res ) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

     if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request")
     }

    
   try {
     const decodedToken = jwt.verify(
       incomingRefreshToken,
       process.env.REFRESH_TOKEN_SECRET
     )
 
   const user = await User.findById(decodedToken?._id);
      
   if (!user) {
     throw new ApiError(401, "Invalid refresh Token")
    }
 
    
    if (incomingRefreshToken!== user?.refreshToken) {
     throw new ApiError(401, "Refreshed token is expired or used")
    }
 
   
   const options={
     httpOnly :true ,
     secure : true,
   }
 
 const {accessToken , newrefreshToken} = await generateAccessAndRefreshToken(user._id);
 
  return res
  .status(200)
  .cookie("accessToken", accessToken , options)
  .cookie("refreshToken", newrefreshToken ,options)
  .json(
   new ApiResponce(
     200,
     {
       accessToken, refreshToken: newrefreshToken 
     },
     "Access token refreshed"
   
   )
 )
   } catch (error) {
    throw new ApiError (401, error?.message || "Invalid refresh token")
   }


})
  
//  Change Current Password

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword , newPassword} = req.body
    //confpassword
    // if(!(newpassword === confpasswoed)){
    // throw err ""}


    // req.user?.id
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   
    // check old password
    if (!isPasswordCorrect) {
      throw new ApiError(400,"Invalid old password")
    }


    // set new password
    user.password = newPassword
     await user.save ({validateBeforeSave : false})
    
     return res
     .status(200)
     .json( new ApiResponce (200, {}, "Password changed Successfully..!! "))


})


// Get current user
const getCurrentUser = asyncHandler(async(req ,res) =>{
  return res
  .status(200)
  .json(new ApiResponce( 
    200,
     req.user ,
    " current user fetched successfully"))
})


// update account details
  // always make file update controller in onother file

const updateAccountDetails = asyncHandler(async(req , res) =>{

  const{fullName , email} = req.body

  if (!fullName || !email) {
    throw new ApiError(400,"all fileds are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email //email : email
      }
    },
    {new : true}
    
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponce(200, user, "Account deatils uupdated sucessfully"))

})


// update user avatar

const updateUserAvatar =asyncHandler(async(req ,res) => {
    const avatarLocalPath =req.file?.path

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
      throw new ApiError(400,"error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url
        }
      },
      {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponce(200, user , "Avatar image changed successfully..!!")
    )
})


// Update user Cover-Image

const updateUserCoverImage =asyncHandler(async(req ,res) => {
  const coverImageLocalPath =req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover-img file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
    throw new ApiError(400,"error while uploading on coverimage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponce(200, user , "cover image changed successfully..!!")
  )
})


// user channel profile

const getUserChannelProfile = asyncHandler(async (req , res ) => {
  
  const {username} = req.params
     if (!username?.trim) {
      throw new ApiError(400, "username is missing")
     }
// mongodb pipeline like sde2

  // await user.find({username})
  const channel = await User.aggregate([
       {
// pipeline for user match
        $match: {
          username: username?.toLowerCase()
        },
// count subscribers through channels
        $lookup :{
            from : "Subscription",
            localField : "_id",
            foreignField : "channel",
            as : "subscribers"
          }
        
       },
// how many we are subscribed
        {
          $lookup :{
            from : "Subscription",
            localField : "_id",
            foreignField : "subscriber",
            as : "subscribedTo"
          }
        },
// add fields like subcribercount , channnel subs , issubscribed

        {
          $addFields:{
            subscriberCount : { 
              $size : "$subscribers"
             },
            channelsSubscribedToCount :{
              $size : "$subscribedTo"
            },
    // subscribe buttons logic
        isSubscribed :{
          $cond :{
            if : {$in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else : false
          }
        }
          }
        },
// select item to prject on frontend
        {
          $project :{
            fullName:1,
            username:1,
            subscriberCount:1,
            channelsSubscribedToCount:1,
            isSubscribed :1,
            avatar:1,
            coverImage:1,
            email:1

          }
        }
  ])


  if (!channel?.length) {
    throw new ApiError(400,"channel does not exits")
  }


return res
.status(200)
.json(
  new ApiResponce(200, channel[0], "User channel fetched sucessfully")
)
})











export {
       registerUser ,
        loginUser ,
        logoutUser,
        refreshAccessToken,
        getCurrentUser,
        changeCurrentPassword,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
};
