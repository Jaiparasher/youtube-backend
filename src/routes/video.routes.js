import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { VerifyJWT } from './../middlewares/auth.middleware.js';

const router = Router(); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        publishAVideo
    );

router
    .route("/v/:videoId")
    .get(VerifyJWT, getVideoById)
    .delete(VerifyJWT, deleteVideo)
    .patch(VerifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(VerifyJWT, togglePublishStatus);

export default router