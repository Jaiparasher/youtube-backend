import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary= async (localFilePath) => {
    try {
        if(!localFilePath) return  null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{ 
            resource_type: "auto" 
        })

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log('Error in uploading image to Cloudinary', error);
        return null;
    }
}

const deleteOnCloudinary = async(public_id, resource_type)=>{
    if(!public_id) return null
    try {
        return await cloudinary.uploader.destroy(public_id, {
            resource_type,
        })
    } catch (error) {
        console.log(error)
        return null
    }
}

export { uploadOnCloudinary, deleteOnCloudinary }