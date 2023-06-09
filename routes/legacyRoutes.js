import express from "express";
import { followUser, getPosts, likePost, postPhoto } from "../functions/legacyFunctions.js";
import { upload } from "../functions/upload.js";

const legacyRouter = express.Router();

legacyRouter.post("/likePost", likePost);

legacyRouter.post("/followUser", followUser)

legacyRouter.post("/postPhoto", upload.array('attachment[]'), postPhoto);

legacyRouter.get("/getPosts", getPosts);

export default legacyRouter;