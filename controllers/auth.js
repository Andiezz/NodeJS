const crypto = require("crypto")

const bcrypt = require("bcryptjs")

const User = require("../models/user")
const mailer = require("../util/mailer")

// const accountSid = "AC0e3b3fb5103776c551a0351afda91d60"
// const authToken = ""
// const client = require("twilio")(accountSid, authToken)

exports.getLogin = (req, res, next) => {
    // console.log(req.session.isLoggedIn)
    // const isLoggedIn = req.get("Cookie").split("=")[1] == "true"
    let message = req.flash("error")
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: message,
    })
}

exports.getSignup = (req, res, next) => {
    let message = req.flash("error")
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Title",
        errorMessage: message,
    })
}

exports.postLogin = (req, res, next) => {
    //? Cookie: a global variable that save in the request
    //? it is customized for each user and is not shared among users
    //? store in client-side (front-end)
    // res.setHeader("Set-Cookie", "loggedIn=true; ") // Max-Age=10; Secure; HttpOnly

    //? Session: do not lose the info when send response
    //? not visible to other users
    //? store in server-side

    //? create User in Session

    const email = req.body.email
    const password = req.body.password
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash("error", "Invalid email or password.")
                return res.redirect("/login")
            }
            bcrypt
                .compare(password, user.password)
                .then((doMatch) => {
                    if (doMatch) {
                        // req.user = user //? mongoose model (can access to all methods)
                        req.session.isLoggedIn = true //? set any key you want
                        req.session.user = user
                        //? guarantee the session is saved before redirect
                        return req.session.save((err) => {
                            console.log(err)
                            res.redirect("/")
                        })
                    }
                    res.redirect("/login")
                })
                .catch((err) => {
                    console.log(err)
                    res.redirect("/login")
                })
        })
        .catch((err) => console.log(err))
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword

    //? another way is to use mongodb index
    User.findOne({ email: email })
        .then((userDoc) => {
            if (userDoc) {
                req.flash(
                    "error",
                    "E-Mail exists already, please pick a different one!"
                )
                return res.redirect("/signup")
            }
            return bcrypt
                .hash(password, 12)
                .then((hashedPassword) => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] },
                    })
                    return user.save()
                })
                .then((result) => {
                    res.redirect("/login")
                    return mailer.sendMail(
                        email,
                        "Signup succeeded!",
                        `<h1>You successfully signed up!</h1>`
                    )
                    // return client.messages
                    //     .create({
                    //         to: "+84584702251",
                    //         body: "Hello from Node",
                    //         from: "+18316035818",
                    //     })
                    //     .then((message) => console.log(message.sid))
                    //     .done()
                })
        })
        .catch((err) => console.log(err))
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err)
        res.redirect("/")
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash("error")
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset Password",
        errorMessage: message,
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err)
            return res.redirect("/reset")
        }
        const token = buffer.toString("hex")
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (!user) {
                    req.flash("error", "No account with that email found")
                    return res.redirect("/reset")
                }
                user.resetToken = token
                user.resetTokenExpiration = Date.now() + 3600000
                return user.save()
            })
            .then((result) => {
                res.redirect("/")
                mailer.sendMail(
                    req.body.email,
                    "Password reset",
                    `<p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>`
                )
                // return client.messages
                //         .create({
                //             to: "+84584702251",
                //             body: "Password reset",
                //             from: "+18316035818",
                //         })
                //         .then((message) => console.log(message.sid))
                //         .done()
            })
            .catch((err) => {
                console.log(err)
            })
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            let message = req.flash("error")
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null
            }
            res.render("auth/new-password", {
                path: "/new-password",
                pageTitle: "New Password",
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token,
            })
        })
        .catch((err) => {
            console.log(err)
        })
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password
    const userId = req.body.userId
    const passwordToken = req.body.passwordToken
    let resetUser

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId,
    })
        .then(user => {
            resetUser = user
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword
            resetUser.resetToken = null
            resetTokenExpiration = undefined
            return resetUser.save()
        })
        .then(result => {
            res.redirect("/login")
            mailer.sendMail(
                resetUser.email,
                "Reset password succeeded",
                `<h1>You've successfully resetted your password</h1>`
            )
        })
        .catch((err) => {
            console.log(err)
        })
}
