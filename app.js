const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")

const errorController = require("./controllers/error")
// const mongoConnect = require("./util/database").mongoConnect
const User = require("./models/user")

const app = express()

app.set("view engine", "ejs")
app.set("views", "views")

const adminRoutes = require("./routes/admin")
const shopRoutes = require("./routes/shop")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, "public")))

app.use((req, res, next) => {
    User.findById("6354a0844b68b83cd2ae48d4")
        .then((user) => {
            // req.user = user //! not the real user
            req.user = user //? mongoose model (can access to all methods)
            next()
        })
        .catch((err) => console.log(err))
})

app.use("/admin", adminRoutes)
app.use(shopRoutes)

app.use(errorController.get404)

mongoose
    .connect(
        "mongodb+srv://AndiexPie6:JnoRVDRbvQXk4kPl@nodejs-learning.odff7nk.mongodb.net/shop?authSource=admin"
    )
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
