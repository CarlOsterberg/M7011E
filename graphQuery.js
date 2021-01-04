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
        db.collection("managers").find().toArray(function (manErr,managers) {
            if (manErr) return console.log(manErr)
            db.collection("consumers").find().toArray(function (consErr, consumers) {
                if (consErr) return console.log(consErr)
                db.collection("prosumers").find().toArray(function (proErr,prosumers) {
                    if (consErr) return console.log(proErr)
                    let query = "{demand(numUsers:" + consumers.length + prosumers.length + 1 + ")\nwph\nproduction}";
                    APIquery(query, function (q) {
                        let d = JSON.parse(q);
                        let q_d = d.data["demand"];
                        let wind = d.data["wph"];
                        let production = d.data["production"];
                        let market_demand = 0;
                        let market_sell = 0;

                        /** PP PRODUCTION */
                        let pp_production = Number(managers[0].production);
                        let old_charge = managers[0].battery;
                        let con = q_d[consumers.length+prosumers.length]
                        let pp_battery_charge = (old_charge + pp_production - con);

                        for (let j=0;j<prosumers.length;j++) {
                            let netto = production-q_d[consumers.length + j - 1]
                            let battery = prosumers[j].battery
                            if (netto>0) {
                                battery += netto * (prosumers[j].battery_sell/100)
                                market_sell += netto * (1 - prosumers[j].battery_sell/100);
                                if (battery>1000) {
                                    battery = 1000;
                                }
                            }
                            else {
                                battery += netto * (prosumers[j].battery_use/100);
                                market_demand -= netto * (1 - prosumers[j].battery_use/100);
                                if (battery<0) {
                                    battery = 0;
                                    //blackout
                                }
                            }
                            db.collection("prosumers").updateOne({_id:prosumers[j]._id},
                                {$set: {"consumption": q_d[consumers.length + j - 1], "production":production, "battery":battery, "blackout": false } })
                        }

                        for (let i = 0;i<consumers.length;i++) {
                            //console.log({_id:result[i]._id}, {$set: {"kWh": q_d[j]} })
                            market_demand += q_d[i];
                            db.collection("consumers").updateOne({_id:consumers[i]._id}, {$set: {"consumption": q_d[i]}, "blackout": false })
                        }

                        /** db update managers and global variables*/
                        if (pp_battery_charge>10000) {
                            pp_battery_charge = 10000;
                        }
                        else if (pp_battery_charge<0) {
                            pp_battery_charge = 0;
                        }
                        db.collection("managers").updateMany({},{$set: {"consumption": q_d[consumers.length+prosumers.length],
                                "production":pp_production, "battery":pp_battery_charge}});
                        db.collection("wind").updateOne({_id:"wind"}, {$set: {"speed": wind, "market_demand": market_demand,
                                "market_sell": market_sell,"price": 2.17}})
                    });
                });
            });
        });
    });
}, 3000);
