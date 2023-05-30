import axios from "axios";
import dotenv from "dotenv"

dotenv.config()

const microgen = axios.create({ baseURL: process.env.BASE_URL });

const peertube = axios.create({ baseURL: process.env.PEERTUBE_URL });

export { microgen, peertube }