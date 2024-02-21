import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { userId } = req.params;
    const allLikes = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideoLikes: {
                    $sum: {
                        $cond: [
                            { $ifNull: ["$video", false] },
                            1, // not null then add 1
                            0 // else 0
                        ]
                    }
                },
                totalTweetLikes: {
                    $sum: {
                        $cond: [
                            { $ifNull: ["$tweet", false] },
                            1,
                            0
                        ]
                    }
                },
                totalCommentLikes:{
                    $sum: {
                        $cond: [
                            { $ifNull: ["$comment", false] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);
    // total subscriber 
    const allSubscribes = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: "subscribers"
        }
    ])
    // total videos 
    const allVideo = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $count: "Videos"
        }
    ])
    // total views 
    const allViews = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group: {
                _id: null,
                allVideosViews: {
                    $sum: "$views"
                }
            }
        }
    ])

    const stats = {
        Subscribers: allSubscribes[0].subscribers,
        totalVideos: allVideo[0].Videos,
        totalVideoViews: allViews[0].allVideosViews,
        totalVideoLikes: allLikes[0].totalVideoLikes,
        totalTweetLikes: allLikes[0].totalTweetLikes,
        totalCommentLikes: allLikes[0].totalCommentLikes
         
    }

    // return responce 
    return res.status(200).json(
        new ApiResponse(
            200,
            stats,
            "fetching channel stats successfully!!"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { userId } = req.params;
    try {
    const allVideos = await Video.find({
      owner: new mongoose.Types.ObjectId(userId),
    })
    if (!allVideos) throw new ApiError(404, "No videos available");
    return res.status(200).json(new ApiResponse(200, { allVideos }, "Success"));
    }  
    catch (e) {
    throw new ApiError(400, e.message || "Some error occurred");
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }