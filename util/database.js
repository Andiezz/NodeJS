const mongodb = require("mongodb")
const MongoClient = mongodb.MongoClient
const dbConfig = require("../config/dbConfig")

let _db

const mongoConnect = (callback) => {
    MongoClient.connect(
        dbConfig.MONGODB_URI
    )
        .then((client) => {
            console.log("Connected!")
            //? store connection to the db in _db
            //? create new db if have not existed
            _db = client.db("shop")
            callback(client)
        })
        .catch((err) => {
            console.log(err)
            throw err
        })
}

const getDb = () => {
  if (_db) {
    return _db
  }
  throw new Error("No database found!")
}

exports.mongoConnect = mongoConnect
exports.getDb = getDb
