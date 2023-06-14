import { microgen, peertube } from "../libs/axios.js";
import queryString from "query-string";

const register = async (req, res) => {
    const { email, firstName, password } = req.body;

    const data = queryString.stringify({
        "username": firstName.toLowerCase(),
        "password": password,
        "email": email,
        "displayName": firstName,
        // "channel": {
        //     "name": firstName +'ch',
        //     "displayName": firstName
        // }
    })

    const dataUser = queryString.stringify({
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET,
        "response_type": "code",
        "grant_type": "password",
        "scope": "upload",
        "username": email,
        "password": password
    })

    let token
    let channelId

    peertube.post('/users/register', data)
        .then(async (result) => {
            const getToken = await peertube.post('/users/token', dataUser)
            token = getToken.data.access_token

            const getUser = await peertube.get('/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
            channelId = getUser.data.videoChannels[0].id

            const register = await microgen.post('/auth/register', {
                ...req.body, "channelId": channelId, "privateKey": password, "address": firstName
            })

            const createFollow = await microgen.post('/Follows', {
                "follower": [register.data.user._id]
            }, {
                headers: {
                    "Authorization": `Bearer ${register.data.token}`
                }
            })

            let response = register.data
            response.access_token = token

            return res.status(200).json(response);
        }).catch((err) => {
            console.log(err)
            return res.status(400).json(err.response.data);
        });
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const data = queryString.stringify({
        "client_id": process.env.CLIENT_ID,
        "client_secret": process.env.CLIENT_SECRET,
        "response_type": "code",
        "grant_type": "password",
        "scope": "upload",
        "username": email,
        "password": password
    })

    let token

    const login = await microgen.post('/auth/login', {
        "email": email,
        "password": password
    })

    let response = login.data
    const { Follows } = response.user

    if (response.user.channelId == null) {
        const data = queryString.stringify({
            "username": response.user.firstName.toLowerCase(),
            "password": password,
            "email": email,
            "displayName": response.user.firstName,
        })
        let channelId
        peertube.post('/users/register', data)
            .then(async (result) => {
                const dataUser = queryString.stringify({
                    "client_id": process.env.CLIENT_ID,
                    "client_secret": process.env.CLIENT_SECRET,
                    "response_type": "code",
                    "grant_type": "password",
                    "scope": "upload",
                    "username": email,
                    "password": password
                })

                const getToken = await peertube.post('/users/token', dataUser)
                token = getToken.data.access_token

                const createFollow = await microgen.post('/Follows', {
                    "follower": [login.data.user._id]
                }, {
                    headers: {
                        "Authorization": `Bearer ${response.token}`
                    }
                })

                const getUser = await peertube.get('/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
                channelId = getUser.data.videoChannels[0].id

                const updateUser = await microgen.patch(`/Users/${response.userId}`, {
                    "channelId": channelId
                }, {
                    headers: {
                        'Authorization': `Bearer ${response.token}`
                    }
                })

                response.channelId = updateUser.data.channelId
                return res.status(200).json(response);
            }).catch((err) => {
                return res.status(400).json(err);
            });
    } else if (Follows.length == 0) {
        const createFollow = await microgen.post('/Follows', {
            "follower": [login.data.user._id]
        }, {
            headers: {
                "Authorization": `Bearer ${response.token}`
            }
        }).then(async (result) => {
            token = result.data.access_token

            response.access_token = token

            return res.status(200).json(response);
        }).catch((err) => {
            return res.status(400).json(err.response.data);
        });
    } else {
        peertube.post('/users/token', data)
            .then(async (result) => {
                token = result.data.access_token

                response.access_token = token

                return res.status(200).json(response);
            }).catch((err) => {
                return res.status(400).json(err.response.data);
            });
    }
};

export { register, login };