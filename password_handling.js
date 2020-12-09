const bcrypt = require('bcrypt');
const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'
const saltRounds = 10;

//Returns true if the password and username matches database values
module.exports = async function checkUser(username, password) {
    await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        let query = {name: username}
        db.collection("users").find(query).toArray(function (err, result) {
            if (err) return console.log(err)
            client.close();
            console.log(result)
            bcrypt.compare(password, result[0].password).then(function (result) {
                console.log(result)
                return result
            });
        });
    });
}

//checkUser("admin","M455IV3");