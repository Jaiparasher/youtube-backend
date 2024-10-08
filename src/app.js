import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import morgan from "morgan";
import bodyParser from "body-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({ extended: true , limit: "50mb"}));
app.use(express.static("public"))
app.use(cookieParser());
app.use(morgan("dev")); 

import userRouter from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import commentRouter from "./routes/comment.routes.js"

//routes declaration
app.use("/users", userRouter)
app.use("/video", videoRouter)
app.use("/tweet", tweetRouter)
app.use("/subscriptions", subscriptionRouter)
app.use("/playlist", playlistRouter)
app.use("/likes", likeRouter)
app.use("/dashboard", dashboardRouter)
app.use("/healthcheck", healthcheckRouter)
app.use("/comment", commentRouter)

export { app }