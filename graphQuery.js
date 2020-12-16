var http = require('http');
const MongoClient = require("mongodb");


const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

let host = '127.0.0.1'
let port = '8080'
let path = '/graphql'

//takes the query to be performed and also a callback function, to ensure asynchronity
function APIquery(query, callback) {
    // An object of options to indicate where to post to
    var post_options = {
        host: host,
        port: port,
        path: path,
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
console.log("Performing queries on API hosted on: "+host+":"+port+path);

setInterval(function(){
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        db.collection("consumers").find().toArray(function (consErr, consumers) {
            if (consErr) return console.log(consErr)
            db.collection("prosumers").find().toArray(function (proErr,prosumers) {
                if (consErr) return console.log(proErr)
                let query = "{demand(numUsers:" + consumers.length + prosumers.length + ")\nproduction\nwpd\nwph}";
                APIquery(query, function (q) {
                    let d = JSON.parse(q);
                    let q_d = d.data["demand"];
                    let wind = d.data["wph"];
                    let production = d.data["production"];
                    for (let i = 0;i<consumers.length;i++) {
                        //console.log({_id:result[i]._id}, {$set: {"kWh": q_d[j]} })
                        db.collection("consumers").updateOne({_id:consumers[i]._id}, {$set: {"consumption": q_d[i]} })
                    }
                    for (let j=0;j<prosumers.length;j++) {
                        db.collection("prosumers").updateOne({_id:prosumers[j]._id},
                            {$set: {"consumption": q_d[consumers.length + j - 1], "production":production} })
                    }
                    db.collection("wind").updateOne({_id:"wind"}, {$set: {"speed": wind}})
                });
            });
        });
    });
}, 3000);
