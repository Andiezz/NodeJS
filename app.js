const path = require("path")
const fs = require("fs")
const https = require("https")

const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoDBStore = require("connect-mongodb-session")(session)
const csrf = require("csurf")
const flash = require("connect-flash")
const multer = require("multer")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")

const errorController = require("./controllers/error")
// const mongoConnect = require("./util/database").mongoConnect
const User = require("./models/user")
const dbConfig = require("./config/dbConfig")

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@nodejs-learning.odff7nk.mongodb.net/${process.env.MONGO_DATABASE}?authSource=admin`

const app = express()
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
})
const csrfProtection = csrf()

// const privateKey = fs.readFileSync("server.key")
// const certificate = fs.readFileSync("server.cert")

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images")
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname)
    },
})

const allowedMimeTypes = ["image/png", "image/jpg", "image/jpeg"]
const fileFilter = (req, file, cb) => {
    const allowedFile = allowedMimeTypes.includes(file.mimetype)
    cb(null, allowedFile)
}

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, "access.log"),
    { flags: "a" }
)

app.use(helmet())
app.use(compression())
app.use(morgan("combined", { stream: accessLogStream }))

//? urlencoded: data is just parsed in the form of text
app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
)
app.use(express.static(path.join(__dirname, "public")))
app.use("/images", express.static(path.join(__dirname, "images")))
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
    .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        // https
        //     .createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3000)
        app.listen(process.env.PORT || 3000)
    })
    .catch((err) => console.log(err))
