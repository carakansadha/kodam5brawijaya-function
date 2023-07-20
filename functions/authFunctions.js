import { microgen, peertube } from "../libs/axios.js";
import nodemailer from "nodemailer";
import queryString from "query-string";
import fs from "fs";
import FormData from "form-data";

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

            let body = new FormData();
            body.append('file', fs.createReadStream('uploads/user.svg'))

            const upload = await microgen.post('/storage/upload', body, {
                headers: {
                    "Authorization": `Bearer ${register.data.token}`
                }
            })

            let obj = { url: upload.data.url, fileName: upload.data.fileName }
            let images = [obj]

            const update = await microgen.patch(`/Users/${register.data.userId}`, {
                profilePicture: images
            }, {
                headers: {
                    "Authorization": `Bearer ${register.data.token}`
                }
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

            const transport = nodemailer.createTransport({
                host: "mail.kodam5.id",
                port: 465,
                secure: true,
                auth: {
                    user: "admin@kodam5.id",
                    pass: "#EDC2wsx1qaz"
                },
                tls: {
                    rejectUnauthorized: false
                }
            })

            const mailOptions = {
                from: "admin@kodam5.id",
                to: response.user.emailUser,
                subject: "Registrasi berhasil",
                html: `
                <html style="margin: 0; box-sizing: border-box;">
              <head>
                <link
                  href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
                  rel="stylesheet"
                />
              </head>
              <body style=" font-family: 'Poppins', sans-serif;  max-width: 500px;
                margin: 0 auto;
                padding: 4rem;
                background: rgb(0,0,0);
                background: linear-gradient(173deg, rgba(0,0,0,1) 0%, rgba(187,187,187,0.5324630096179097) 47%, rgba(255,255,255,1) 100%); height: max-content;">
                <div>
                    <div style="display: flex;
                    align-items: center;
                    padding-bottom: 2rem">
                    </div>
                
                    <div>
                        <div class="box_content" style="padding: 2rem;
                        background: rgba(240, 240, 240, .6);
                        box-shadow: 1px 0px 4px rgba(0, 0, 0, .5);
                        border-radius: 3rem;">
                        <div style="  width: 100%;
                        max-width: 422px;
                        margin: 0 auto;">
                            <p style="margin-top: 1.7rem; text-align: center; font-size: small;">
                            Selamat bergabung di aplikasi Kodam5! <br>
                            Berikut adalah dompet digital anda:
                            </p>
                            <p class="code" style="margin-top: 1rem;  font-weight: 600;
                            color: black;
                            text-align: center; font-size: large;">${response.user.firstName}</p>
                        </div>
                        </div>
                
                        <p class="help_contact" style=" max-width: 50rem;
                        font-size: small;
                        margin: 2rem auto 0;
                        color: black; text-align: center;">
                            Mohon disimpan. Terima kasih
                        </p>
                    </div>
                
                </div>
              </body>
            </html>
            `
            }

            const send = transport.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error)
                }
            })

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