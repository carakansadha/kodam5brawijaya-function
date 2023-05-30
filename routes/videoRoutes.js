import express from "express";
import { upload } from "../functions/upload.js";
import { uploadVideo } from "../functions/videoFunctions.js";

const videoRouter = express.Router();

videoRouter.post("/upload", upload.single('videoFile'), uploadVideo);

export default videoRouter;