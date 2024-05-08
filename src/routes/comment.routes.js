import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {VerifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();


router.route("/:videoId").get(VerifyJWT,getVideoComments).post(VerifyJWT,addComment);
router.route("/c/:commentId").delete(VerifyJWT,deleteComment).patch(VerifyJWT,updateComment);

export default router