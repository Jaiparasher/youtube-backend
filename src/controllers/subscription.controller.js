import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId){
        throw new ApiError(400,"Channel id is required")
    }
    
    const channel = await User.findById(channelId);

    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    const isSubscribed = await Subscription.findOne({subscriber: req.user?._id, channel: channelId});

    if(!isSubscribed){
        // create a new one
        const subscribe = await Subscription.create({
            subscriber : req.user?._id ,
            channel : channelId
        })
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Subscribed Successfully"))
    }
    else{
        await Subscription.findByIdAndDelete(isSubscribed._id)

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Unsubscribed Successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    
    if(!channelId){
        throw new ApiError(400,"Channel id is required")
    }
    
    const channel = await User.findById(channelId);

    if(!channel){
        throw new ApiError(404,"Channel not found")
    }

    const subscriber = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId),
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber:{
                    $first: "$subscribers"
                }
            }
        },
        {
            $project:{
                subscribers:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,subscriber,subscriber.length == 0?"No subscriber found":"Subscribers successfully fetched"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if(!subscriberId){
        throw new ApiError(400,"subscriber id is required")
    }
    
    const subscriber = await User.findById(subscriberId);

    if(!subscriber){
        throw new ApiError(404,"Subscriber not found")
    }

    const subscriberToChannel = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedTo",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscribedTo:{
                    $first: "$subscribedTo"
                }
            }
        },
        {
            $project:{
                subscribedTo:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscriberToChannel, "Subscriptions to the channel were successfully retrieved"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}