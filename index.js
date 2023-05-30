import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";

import authRouter from "./routes/authRoutes.js"
import videoRouter from "./routes/videoRoutes.js"
import legacyRouter from  "./routes/legacyRoutes.js"

dotenv.config();

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: false}));

app.get("/", (req, res) => {    
    res.send('HumasPolri');
});

app.use('/function/auth', authRouter);

app.use('/function/video', videoRouter);

app.use('/function/legacy', legacyRouter)

app.listen(process.env.PORT, () => {
    console.log(`running on port ${process.env.PORT}`);
});