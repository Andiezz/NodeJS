const mongodb = require("mongodb")
const getDb = require("../util/database").getDb

class User {
    constructor(username, email) {
        this.username = username
        this.email = email
    }

    save() {
        const db = getDb()
        return db.collection("users").insertOne(this)
    }

    static findById(userId) {
        const db = getDb()
        return db
            .collection("users")
            .findOne({ _id: new mongodb.ObjectId(userId) })
            // .next() with find
    }
}

module.exports = User
