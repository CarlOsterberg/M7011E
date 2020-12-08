const MongoClient = require('mongodb').MongoClient

const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

let db

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
    if (err) return console.log(err)

    // Storing a reference to the database so you can use it later
    db = client.db(dbName)
    console.log(`Connected MongoDB: ${url}`)
    console.log(`Database: ${dbName}`)
    db.listCollections().toArray(function(err, collInfos) {
        // collInfos is an array of collection info objects that look like:
        // { name: 'test', options: {} }
        console.log(collInfos)
    });
})