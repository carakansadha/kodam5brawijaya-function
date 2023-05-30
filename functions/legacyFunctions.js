import { microgen } from "../libs/axios.js"
import fs from "fs";
import FormData from "form-data";

const likePost = async (req, res) => {
    const { postId } = req.body
    const post = await microgen.get(`/Posts/${postId}?$lookup=*`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    let arr = []
    const { Likes } = post.data

    // if (Likes.length == 0) {
    //     const getUser = await microgen.get('/auth/user', {
    //         headers: {
    //             "Authorization": req.headers.authorization
    //         }
    //     })

    //     arr.push(getUser.data._id)

    //     await microgen.post('/Likes', {
    //         "name": JSON.stringify(arr),
    //         "post": [postId]
    //     }, {
    //         headers: {
    //             "Authorization": req.headers.authorization
    //         }
    //     }).then((result) => {
    //         return res.status(200).json(result.data)
    //     }).catch((err) => {
    //         return res.status(400).json(err.data)
    //     });

    // } else {
    const getLike = await microgen.get(`/Likes/${Likes[0]._id}`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })
    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    if (getLike.data.name == null) {
        arr.push(getUser.data._id)

        await microgen.patch(`/Likes/${Likes[0]._id}`, {
            "name": JSON.stringify(arr)
        }, {
            headers: {
                "Authorization": req.headers.authorization
            }
        }).then((result) => {
            return res.status(200).json(result.data)
        }).catch((err) => {
            return res.status(400).json(err.data)
        });
    } else {

        arr = JSON.parse(getLike.data.name)

        if (arr.includes(getUser.data._id)) {
            let newArr = arr.filter((id) => id != getUser.data._id)

            await microgen.patch(`/Likes/${Likes[0]._id}`, {
                "name": JSON.stringify(newArr)
            }, {
                headers: {
                    "Authorization": req.headers.authorization
                }
            }).then((result) => {
                return res.status(200).json(result.data)
            }).catch((err) => {
                return res.status(400).json(err.data)
            });

        } else {
            arr.push(getUser.data._id)

            await microgen.patch(`/Likes/${Likes[0]._id}`, {
                "name": JSON.stringify(arr)
            }, {
                headers: {
                    "Authorization": req.headers.authorization
                }
            }).then((result) => {
                return res.status(200).json(result.data)
            }).catch((err) => {
                return res.status(400).json(err.data)
            });
        }
    }
    // }
}

const postPhoto = async (req, res) => {
    const { content } = req.body

    const contentSplit = content.split(" ")
    const contentSlice = contentSplit.slice(0, 5)
    const title = contentSlice.join(" ")

    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const data = new FormData()
    data.append("file", fs.createReadStream(req.file.path))

    const upload = await microgen.post('/storage/upload', data, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    const post = await microgen.post('/Posts', {
        "content": content,
        "title": title,
        "type": 'photo',
        "user": [getUser.data._id],
        "attachment": [{ url: upload.data.url, fileName: upload.data.fileName }]
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

    await microgen.get(`/Posts/${post.data._id}?$lookup=*`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    }).then((result) => {
        fs.unlinkSync(req.file.path)
        return res.status(200).json(result.data)
    }).catch((err) => {
        return res.status(400).json(err)
    });
}

const getPosts = async (req, res) => {
    const get = await microgen.get('/Posts?$lookup=*', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })
    let data = []
    await Promise.all(get.data.map(async post => {
        let getPost = await microgen.get(`/Posts/${post._id}?$lookup=*`, {
            headers: {
                "Authorization": req.headers.authorization
            }
        })
        let Post = getPost.data
        Post.Like = getPost.data.Likes[0] ?? {}
        let user = []

        let getUser = await microgen.get(`/Users/${Post._id}`, {
            headers: {
                "Authorization": req.headers.authorization
            }
        })
        // console.log(Post.Like)
        data.push(Post)
    }));
    // .then((result) => {
    return res.status(200).json(data)
    // }).catch((err) => {
    // return res.status(400).json(err)
    // });
}

const follow = async (req, res) => {
    const { userId } = req.body
    const user = await microgen.get(`/Users/${userId}?$lookup=*`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    let arr = []
    const { Follows } = user.data

    const getFollow = await microgen.get(`/Follows/${Follows[0]._id}`, {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    arr = JSON.parse(getFollow.data.name)

    const getUser = await microgen.get('/auth/user', {
        headers: {
            "Authorization": req.headers.authorization
        }
    })

    if (arr.includes(getUser.data._id)) {
        let newArr = arr.filter((id) => id != getUser.data._id)

        await microgen.patch(`/Follows/${Follows[0]._id}`, {
            "name": JSON.stringify(newArr)
        }, {
            headers: {
                "Authorization": req.headers.authorization
            }
        }).then((result) => {
            return res.status(200).json(result.data)
        }).catch((err) => {
            return res.status(400).json(err.data)
        });
    } else {
        arr.push(getUser.data._id)

        await microgen.patch(`/Follows/${Follows[0]._id}`, {
            "name": JSON.stringify(arr)
        }, {
            headers: {
                "Authorization": req.headers.authorization
            }
        }).then((result) => {
            return res.status(200).json(result.data)
        }).catch((err) => {
            return res.status(400).json(err.data)
        });
    }
}

export { likePost, postPhoto, getPosts, follow }