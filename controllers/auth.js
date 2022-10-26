const User = require("../models/user")

exports.getLogin = (req, res, next) => {
    // console.log(req.session.isLoggedIn)
    // const isLoggedIn = req.get("Cookie").split("=")[1] == "true"
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: req.session.isLoggedIn,
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
    User.findById("6354a0844b68b83cd2ae48d4")
        .then((user) => {
            // req.user = user //! not the real
            req.session.isLoggedIn = true //? set any key you want
            req.session.user = user
            // req.user = user //? mongoose model (can access to all methods)
            res.redirect("/")
        })
        .catch((err) => console.log(err))
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        // console.log(err)
        res.redirect("/")
    })
}