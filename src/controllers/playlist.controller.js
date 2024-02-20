import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { response } from "express"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name || !description) {
        throw new ApiError(400,"name and description is required")
    }
    const isPlaylistExist = await Playlist.findOne({
        name,
        owner:req.user?._id
    })

    if(isPlaylistExist){
        throw new ApiError(400,'Playlist already exist')
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })

    if(!playlist){
        throw new ApiError(500,'Error while creating playlist')
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Created a playlist successfully"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User ID")
    }

    const userPlaylist = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                name: 1,
                description: 1,
                videoCount: {
                    $size: "$videos"
                },
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "Playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if( !isValidObjectId(playlistId)) {
        throw new ApiError(400,'Invalid Playlist Id')
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    res
    .status(200)
    .json(new ApiResponse(200, {playlist}, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid ID provided")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist does not exist.")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized to perform this action")
    }
    if(playlist.videos.includes(videoId)) {
        throw new ApiError(400, "This Video is already in the playlist")
    }

    const addToPlaylist = await Playlist.updateOne(
        { _id: new mongoose.Types.ObjectId(playlistId) },
        { $push: { videos: videoId } }
    );

    if (!addToPlaylist) 
        throw new ApiError(500, "Unable to update playlist");

    return res
    .status(200)
    .json(new ApiResponse(200, addToPlaylist, "Video added to playlist"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid ID provided")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist does not exist.")
    }

    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized to perform this action")
    }

    const removeVideoFromPlaylistRequest = await Playlist.updateOne(
        {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
        { $pull: { videos: new mongoose.Types.ObjectId(videoId) } }
    );

    if (!removeVideoFromPlaylistRequest)
        throw new ApiError(500, "Unable to update playlist");

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video removed to playlist"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    if(playlist.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "Unauthorized to perform this action")
    }

    await Playlist.findByIdAndDelete(playlistId);

    res
    .status(200)
    .json(new ApiResponse(200,{}, "Playlist deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!name && !description) {
        throw new ApiError(400,"name or description is required")
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    
    const updatedPlaylist = await Playlist.updateOne(
        {_id: new mongoose.Types.ObjectId(playlistId)},
        { 
            $set: {
            name,
            description
            }
        },
        {new: true})

    if (!updatePlaylist)
        throw new ApiError(500, "some error occurred");

    res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist has been updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}