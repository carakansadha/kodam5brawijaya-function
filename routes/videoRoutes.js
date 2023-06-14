import express from "express";
import { upload } from "../functions/upload.js";
import { deleteVideo, uploadVideo } from "../functions/videoFunctions.js";

const videoRouter = express.Router();

videoRouter.post("/upload", upload.single('videoFile'), uploadVideo);

videoRouter.delete("/delete/:id", deleteVideo);

export default videoRouter;