import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const isLiked = await Like.findOne({video: videoId});

    if(!isLiked){
        // create a new one
     const like = await Like.create({
            video : videoId,
            likedBy:req.user?._id
        })
        return res
        .status(200)
        .json(new ApiResponse(200,{like},"Liked Successfully"))
    }
    else{
        await Like.findByIdAndDelete(isLiked._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{},"UnLiked Successfully"))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const isLiked = await Like.findOne({comment: commentId});

    if(!isLiked){
        // create a new one
     const like = await Like.create({
        comment : commentId,
        likedBy:req.user._id
        })
        return res
        .status(200)
        .json(new ApiResponse(200,{like},"Comment liked successfully"))
    }
    else{
        await Like.findByIdAndDelete(isLiked._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Comment unLiked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Video ID")
    }

    const isLiked = await Like.findOne({tweet: tweetId});

    if(!isLiked){
        // create a new one
     const like = await Like.create({
        tweet : tweetId,
        likedBy:req.user._id
        })
        return res
        .status(200)
        .json(new ApiResponse(200,{like},"Tweet liked successfully"))
    }
    else{
        await Like.findByIdAndDelete(isLiked._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Tweet unLiked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "This user id is not valid")
    }

    // find user in database 
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const likedVideos = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                },
                likedBy: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            ownerDetails: {
                                $first: "$ownerDetails"
                            }
                        }
                    },
                    {
                        $project: {
                            videoFile: 1,
                            thumbnail: 1,
                            views: 1,
                            duration: 1,
                            title: 1,
                            description: 1,
                            ownerDetails: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: {
                    $first: "$likedVideos"
                }
            }
        },
        {
            $project: {
                video: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "liked videos!"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}