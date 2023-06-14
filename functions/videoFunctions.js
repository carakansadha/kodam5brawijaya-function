import { microgen, peertube } from "../libs/axios.js";
import fs from "fs";
import FormData from "form-data";
import queryString from "query-string";

const uploadVideo = async (req, res) => {
    const { content, location, completeLocation, province, subdistrict, regency } = req.body;

    const contentSplit = content.split(" ")
    const contentSlice = contentSplit.slice(0, 5)
    const title = contentSlice.join(" ")

    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const data = new FormData()
    const namep = content ? content : "Video Post";
    data.append("channelId", getUser.data.channelId)
    data.append("name", title)
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

    peertube.post('/videos/upload', data, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    })
        .then(async (result) => {
            let embedUrl = `https://video.kodam5.id/videos/embed/${result.data.video.uuid}`
            const post = await microgen.post('/Posts', {
                "content": content,
                "type": "video",
                "user": [getUser.data._id],
                "videoUrl": embedUrl,
                "title": title,
                "location": location,
                "regency": regency,
                "subdistrict": subdistrict,
                "province": province,
                "completeLocation": completeLocation
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

const createLive = async (req, res) => {
    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const data = {
        "channelId": getUser.data.channelId,
        "name": '',
        "latencyMode": 1,
        "saveReplay": true,
        "privacy": 2
    }

    peertube.post('/videos/live', data)

}

const deleteVideo = async (req, res) => {
    const { id } = req.params
    
    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const dataUser = queryString.stringify({
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET,
        "response_type": "code",
        "grant_type": "password",
        "scope": "upload",
        "username": getUser.data.email,
        "password": getUser.data.privateKey
    })

    const getToken = await peertube.post('/users/token', dataUser)
    const token = getToken.data.access_token

    const getPost = await microgen.get(`/Posts/${id}?$lookup=*`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const { videoUrl } = getPost.data
    const uuid = videoUrl.split("https://video.humaspolri.id/videos/embed/")[1]

    peertube.delete(`/videos/${uuid}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then((result) => {
        const deletePost = microgen.delete(`/Posts/${id}`, {
            headers: {
                "Authorization": req.headers.authorization
            }
        })
        return res.status(200).json(deletePost);
    }).catch((err) => {
        return res.status(400).json(err.response);
    });
}

export { uploadVideo, deleteVideo }