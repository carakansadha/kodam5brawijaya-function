import express from "express";
import { sendEmail } from "../functions/sendEmail.js";

const sendEmailRouter = express.Router();

sendEmailRouter.post("/sendEmail", sendEmail);

export default sendEmailRouter