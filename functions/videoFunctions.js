import { microgen, peertube } from "../libs/axios.js";
import fs from "fs";
import FormData from "form-data";
import queryString from "query-string";

const uploadVideo = async (req, res) => {
    const { channelId, content } = req.body;

    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const data = new FormData()
    data.append("channelId", getUser.data.channelId)
    data.append("name", content)
    data.append("privacy", 2)
    data.append("videofile", fs.createReadStream(req.file.path))

    const dataUser = queryString.stringify({
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET,
        "response_type": "code",
        "grant_type": "password",
        "scope": "upload",
        "username": getUser.data.email,
        "password": getUser.data.privateKey
    })

    let token
    const getToken = await peertube.post('/users/token', dataUser)
    token = getToken.data.access_token

    const contentSplit = content.split(" ")
    const contentSlice = contentSplit.slice(0, 5)
    const title = contentSlice.join(" ")

    peertube.post('/videos/upload', data, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(async (result) => {
            let embedUrl = `https://video.humaspolri.id/videos/embed/${result.data.video.uuid}`
            console.log(result)
            const post = await microgen.post('/Posts', {
                "content": content,
                "type": "video",
                "user": [getUser.data._id],
                "videoUrl": embedUrl,
                "title": title
            }, {
                headers: {
                    "Authorization": req.headers.authorization
                }
            })

            const createLike = await microgen.post('/Likes', {
                "post": [post.data._id]
            }, {
                headers: {
                    "Authorization": req.headers.authorization
                }
            })

            fs.unlinkSync(req.file.path)
            return await res.status(200).json(post.data);
        }).catch(async (err) => {
            return await res.status(400).json(err.response);
        });
}

const deleteVideo = async (req, res) => {
    const { id } = req.params
}

export { uploadVideo, deleteVideo }