import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {VerifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(VerifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats/:userId").get(getChannelStats);
router.route("/videos/:userId").get(getChannelVideos);

export default router