import express from "express";
import {register, login} from "../functions/authFunctions.js";

const authRouter = express.Router();

authRouter.post("/register", register);

authRouter.post("/login", login);

export default authRouter;