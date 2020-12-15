var http = require('http');
const MongoClient = require("mongodb");


const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

//takes the query to be performed and also a callback function, to ensure asynchronity
function APIquery(query, callback) {
    // An object of options to indicate where to post to
    var post_options = {
        host: '127.0.0.1',
        port: '8080',
        path: '/graphql',
        method: 'POST',
        headers: {
            'Content-Type': 'application/graphql',
            'Content-Length': Buffer.byteLength(query)
        }
    };
    let res
    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            let temp = chunk.split(":",1);
            callback(chunk);
        });
    });

    // post the data
    post_req.write(query);
    post_req.end();
}

setInterval(function(){
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        db.collection("consumers").find().toArray(function (err, result) {
            if (err) return console.log(err)
            let query = "{demand(numUsers:" + result.length + ")}";
            APIquery(query, function (q) {
                let d = JSON.parse(q);
                for (x in d.data) {
                    console.log(x + " : " + d.data[x])
                }
                //Update db with APIquery data.
            });
        });
    });
}, 3000);
