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

const router = Router();

router
    .route("/")
    .get(getAllVideos)
    .post(VerifyJWT, publishAVideo)

router
    .route("/v/:videoId")
    .get(VerifyJWT, getVideoById)
    .delete(VerifyJWT, deleteVideo)
    .patch(VerifyJWT, upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(VerifyJWT, togglePublishStatus);

export default router