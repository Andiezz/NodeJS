const mongodb = require("mongodb")
const getDb = require("../util/database").getDb

class Product {
    constructor(title, price, description, imageUrl, id, userId) {
        this.title = title
        this.price = price
        this.description = description
        this.imageUrl = imageUrl
        this._id = id ? new mongodb.ObjectId(id) : null
        this.userId = userId
    }

    save() {
        const db = getDb()
        let dbOp
        if (this._id) {
            // Update the product
            dbOp = db
                .collection("products")
                //? UPDATE
                .updateOne(
                    { _id: this._id },
                    { $set: this } //? update
                )
        } else {
            dbOp = db.collection("products").insertOne(this)
        }
        return dbOp
            .then((result) => {
                console.log(result)
            })
            .catch((err) => {
                console.log(err)
            })
    }

    static fetchAll() {
        //? find all products
        //? return a cursor
        const db = getDb()
        return db
            .collection("products")
            .find()
            .toArray()
            .then((products) => {
                return products
            })
            .catch((err) => {
                console.log(err)
            })
    }

    static findById(prodId) {
        const db = getDb()
        return db
            .collection("products")
            .find({ _id: new mongodb.ObjectId(prodId) }) //? object id type of MongoDB
            .next() //? find the last document
            .then((product) => {
                return product
            })
            .catch((err) => {
                console.log(err)
            })
    }

    static deleteById(prodId) {
        const db = getDb()
        return db.collection("products")
            .deleteOne({ _id: new mongodb.ObjectId(prodId) })
            .then(() => {
                console.log("Deleted!")
            })
            .catch((err) => {
                console.log(err)
            })
    }
}

module.exports = Product
