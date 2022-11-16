const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoDBStore = require("connect-mongodb-session")(session)
const csrf = require("csurf")
const flash = require("connect-flash")
const multer = require("multer")

const errorController = require("./controllers/error")
// const mongoConnect = require("./util/database").mongoConnect
const User = require("./models/user")
const dbConfig = require("./config/dbConfig")

const MONGODB_URI = dbConfig.MONGODB_URI

const app = express()
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
})
const csrfProtection = csrf()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images")
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + "-" + file.originalname)
    },
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpge"
    ) {
        cb(null, true) //? (error, accept the file)
    } else {
        cb(null, false) //? (error, do not want to store the file)
    }
}

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

//? urlencoded: data is just parsed in the form of text
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
)
app.use(express.static(path.join(__dirname, "public")))
app.use(
    session({
        secret: "Grace's secret",
        resave: false,
        saveUninitialized: false,
        cookie: {},
        store: store,
    })
)
app.use(csrfProtection)
app.use(flash())

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use((req, res, next) => {
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then((user) => {
            // req.user = user //! not the real
            // req.session.isLoggedIn = true //? set any key you want
            // req.session.user = user //? mongoose does not recognize user model
            // req.user = user //? mongoose model (can access to all methods)
            if (!user) {
                return next()
            }
            req.user = user
            next()
        })
        .catch((err) => {
            // throw new Error(err)
            //? use next(err) to accessed error middleware
            next(new Error(err))
        })
})

app.use("/admin", adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get("/500", errorController.get500)

app.use(errorController.get404)

//? execute when call next(error)
//? only can be accessed by synchronous code
app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...)
    // res.redirect("/500")
    res.status(500).render("500", {
        pageTitle: "Error!",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn,
    })
})

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        app.listen(3000)
    })
    .catch((err) => console.log(err))
