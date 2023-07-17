import { microgen } from "../libs/axios.js";

const sendEmail = async (req, res) => {
    console.log(req, res)
    return res.status(200).json(req)
}

export {
    sendEmail
}