import dotenv from "dotenv"
import { connectDB } from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path: "./.env"
})


connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log('Error while connecting to MongoDB')
        process.exit(1)
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO DB Connection failed !!! ",err);
})












/*
import express from "express";
import { process } from './../node_modules/ipaddr.js/lib/ipaddr.js.d';
const app = express();

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log('Error while connecting to MongoDB')
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
})()

*/