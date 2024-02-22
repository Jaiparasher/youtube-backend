import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "./../models/video.models.js"
import {User} from "./../models/user.models.js"
import {ApiError} from "./../utils/ApiError.js"
import {ApiResponse} from "./../utils/ApiResponse.js"
import {asyncHandler} from "./../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "./../utils/cloudinary.js"

const checkOwner = async(videoId,id)=>{
    const video = await Video.findById(videoId);

    if(video?.owner !== id){
        return false;
    }
    return true;

}

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const sortOptions  = {}
    if (sortBy) {
        sortOptions[sortBy] = sortType == "desc" ? -1 : 1;
    }
    
    const result = await Video.aggregate([
        {
            $match: {
                $or: [
                  { title: { $regex: query, $options: "i" } },
                  { description: { $regex: query, $options: "i" } },
                ],
                owner: userId,
              },
        },
        {
            $sort: sortOptions,
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: parseInt(limit),
        },
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, result , "Successfully fetched all videos"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description} = req.body

    if( !title || !description ) throw new ApiError(400,'Please provide a valid video details')

    const videoLocalPath = req.files?.videoFile[0].path;
    
    if(!videoLocalPath){
        console.log('No file uploaded');
        return new ApiResponse(500,"No video uploaded");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!thumbnailLocalPath){
        console.log('No file uploaded');
        return new ApiResponse(500,"No thumbnail uploaded");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!video){
        throw new ApiError(500,"Something went wrong while uploading the video")
    }

    if(!thumbnail){
        throw new ApiError(500,"Something went wrong while uploading the thumbnail")
    }

    const createdVideo = await Video.create({
        videoFile:video?.url,
        thumbnail:thumbnail?.url,
        title,
        description,
        duration:video?.duration,
        owner:req?.user._id
    })

    res
    .status(201)
    .json(new ApiResponse(200,createdVideo,"Video Published Successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"videoId is required!")
    }
    const video = await Video.findById(videoId)
    if(!video || !video?.isPublished){
        throw new ApiError(404,"video not found!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video, "video fetched successfully!"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if(!videoId){
        throw new ApiError(400,'Invalid video Id')
    }
    if(!checkOwner(videoId?.owner,req.user?._id)){
        throw new ApiError(300,'Unauthorized Access')
    }

    const previousVideo = await Video.findById(videoId);

    if(!previousVideo){
        throw new ApiError(404, "video not found")
    }

    const {title,description} = req.body;

    if(!title || !description){
        throw new ApiError(404,"title and description are required")
    }

    const thumbnailLocalPath = req.file?.path;

    if(!thumbnailLocalPath){
        console.log('No file uploaded');
        return new ApiResponse(500,"No thumbnail uploaded");
    }

    const previousThumbnail = previousVideo.thumbnail?.public_id;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!thumbnail?.url){
        throw new ApiError(500,"Failed to save image on cloudinary!");
    }

    const video = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                thumbnail:thumbnail.url,
                title,
                description
            }
        },
        {new:true}
    )

    if(!video){
        throw new ApiError(500,"Something went wrong while updating the details")
    }

    await deleteOnCloudinary(previousThumbnail);

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video updated Successfully"))
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    // Check if videoId is provided
    if (!videoId) {
        throw new ApiError(404, "videoId is required!");
    }
    const video = await Video.findById(videoId)

    if(!checkOwner(videoId,req.user?._id)) {
        throw new ApiError(404, "Unauthorized Access")
    }

    if(video.videoFile){
        await deleteOnCloudinary(video.videoFile.public_id, "video")
    }

    if(video.thumbnail){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }
    
    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(400, "Something error happened while deleting the video")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"video deleted Successfully!")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(400,'Invalid video Id')
    }
    if(!checkOwner(videoId?.owner,req.user?._id)){
        throw new ApiError(300,'Unauthorized Access')
    }
    
    const video = await Video.findById(videoId);
    const updateVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },
        {new:true}
    )

    if(!updateVideo){
        throw new ApiError(500,"Something went wrong while updating the details")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateVideo,"PublishStatus of the video  is toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}