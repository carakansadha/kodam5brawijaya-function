import express from "express";
import { getPosts, likePost, postPhoto } from "../functions/legacyFunctions.js";
import { upload } from "../functions/upload.js";

const legacyRouter = express.Router();

legacyRouter.post("/likePost", likePost);

legacyRouter.post("/postPhoto", upload.array('attachment[]'), postPhoto);

legacyRouter.get("/getPosts", getPosts);

export default legacyRouter;