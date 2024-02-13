import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from './../models/user.models.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { async } from './../db/index';
import { updateAccountDetails } from './user.controller';

const generateAccessAndRefreshTokens = async ( userId ) => {
    try {
        const user  = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })

        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, 'Failed to create tokens');
    }
}

export const registerUser = asyncHandler( async ( req, res )=> {
    // get user details from frontend
    //validation - not empty
    //check if user already exist -(username, email)
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    const {fullName, email, username, password } = req.body;

    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All  fields are required"); 
    }

    const existedUser = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    });
    
    if(existedUser){
        throw new ApiError(409,"User with email or username is already in use");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
        console.log(coverImageLocalPath);
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong when registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );

})

export const loginUser = asyncHandler( async ( req, res ) => {
    const {email, username, password} = req.body;

    // Validate data
    if (!(username || email)) {
      throw new ApiError(400,'Email or Username is required');
    }
  
    // Check if user exists
    const user = await User.findOne({
        $or: [
            { email },
            { username }
        ]
    });
  
    if (!user) {
      throw new ApiError(404,'Invalid Credentials');
    }
  
    // Verify the password
    const isMatch = await user.isPasswordCorrect(password);
  
    if (!isMatch) {
      throw new ApiError(401,'Invalid Credentials');
    }
    //Create access token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser =  await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
            )
    )
})

export const logoutUser = asyncHandler( async ( req, res ) => {
    await User.findByIdAndUpdate(req.user._id,
        { 
            $unset : { 
                refreshToken : undefined
            }
        },
        {
            new:true
        })
    const options = {
      httpOnly: true,
      secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "Logged Out Successfully"))
})

export const refreshAccessToken = asyncHandler( async ( req, res )=>{
    
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        if (!decodeToken) {
            throw new ApiResponse(401,"Invalid or expired token");
        }
    
        const user = User.findById(decodeToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken}= await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed"
                )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

export const changeCurrentPassword = asyncHandler( async ( req,res )=>{
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Wrong password')")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

export const getCurrentUser = asyncHandler( async( req, res )=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched"))
})

export const updateAccountDetails = asyncHandler( async( req, res )=>{
    const {fullName, email} = req.body;
    if(!fullName && !email){
        throw new ApiError(400,'At least one field must be updated')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set: {
            fullName,
            email
            }
        },
        { new: true}
        ).select("-password");
    
    return res
    .status(200)
    .json(new ApiResponse(200, user,"Account Details Updated"));
})

export const updateUserAvatar = asyncHandler(async( req, res )=>{
    const avatarLocalPath = req.file?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400,"No Avatar uploaded")
    }

    const avatar = uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"Image could not be uploaded");
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
        ).select("-password");
        return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully" )
    )
});

export const updateUserCoverImage = asyncHandler(async( req, res )=>{
    const coverImageLocalPath = req.file?.path;
    
    if(!coverImageLocalPath){
        throw new ApiError(400,"No cover image uploaded")
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"Image could not be uploaded");
    }

    const user =  await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
        ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully" )
    )
});