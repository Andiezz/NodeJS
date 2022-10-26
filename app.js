const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const session = require("express-session")
const MongoDBStore = require("connect-mongodb-session")(session)

const errorController = require("./controllers/error")
// const mongoConnect = require("./util/database").mongoConnect
const User = require("./models/user")

const MONGODB_URI =
    "mongodb+srv://AndiexPie6:JnoRVDRbvQXk4kPl@nodejs-learning.odff7nk.mongodb.net/shop?authSource=admin"

const app = express()
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
})

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")
const authRoutes = require("./routes/auth")

app.use(bodyParser.urlencoded({ extended: false }))
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
            req.user = user
            next()
        })
        .catch((err) => console.log(err))
})

app.use("/admin", adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.use(errorController.get404)

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        User.findOne().then((user) => {
            if (!user) {
                const user = new User({
                    name: "An",
                    email: "An@test.com",
                    cart: {
                        items: [],
                    },
                })
                user.save()
            }
        })
        app.listen(3000)
    })
    .catch((err) => console.log(err))
