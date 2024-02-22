import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const checkOwner = async(commentId,id)=>{
    const comment = await Comment.findById(commentId);

    if(comment?.owner !== id){
        return false;
    }
    return true;
    }

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)) throw new ApiError('Invalid Video ID',400)

    const videoComments = await Comment.aggregate([
        {
            $match:{
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit:parseInt(limit, 10)
        }
    ])

    if(!videoComments){
        throw new ApiError(400, "No comments found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videoComments,  "Success"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid VideoId")
    }

    const { content } = req.body

    if(!content){
        throw new ApiError(400,"content is required")
    }
    const comment= await Comment.create(
        {
            content: content,
            video: videoId,
            owner: req.user?._id
        }
    )
    if(!comment){
        throw new ApiError(500,"something went wrong while adding comment!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment added successfully!")
    )


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body 
    const { commentId } = req.params

    if(!content || content?.trim()===""){
        throw new ApiError(400, "content is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "This video id is not valid")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found!");
    }

    if (!checkOwner(commentId,req.user?._id)) {
        throw new ApiError(403, "You don't have permission to update this comment!");
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content: content
            }
        },
        {
            new: true
        }
    )

    if(!updateComment){
        throw new ApiError(500, "something went wrong while updating comment")
    }

    // return responce
   return res.status(201).json(
    new ApiResponse(200, updateComment, "comment updated successfully!!"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(400, "commentId is required!");
    }
    if(!checkOwner(commentId,req.user?._id)) {
        throw new ApiError(404, "Unauthorized Access")
    }
    // Find the video by its ID in the database
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    await Comment.findByIdAndDelete(comment)

    return res
    .status(200)
    .json(new ApiResponse(200,{},"comment deleted Successfully!"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }