const http = require('http');
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
    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            chunk.split(":", 1);
            callback(chunk);
        });
    });

    // post the data
    post_req.write(query);
    post_req.end();
}

//resetDbValues()

console.log("Performing queries on API hosted on: " + host + ":" + port + path);

setInterval(function () {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        db.collection("managers").find().toArray(function (manErr, managers) {
            if (manErr) return console.log(manErr)
            db.collection("consumers").find().toArray(function (consErr, consumers) {
                if (consErr) return console.log(consErr)
                db.collection("prosumers").find().toArray(function (proErr, prosumers) {
                    if (proErr) return console.log(proErr)
                    let query = ""
                    if (consumers.length > 0 && prosumers.length > 0 && managers.length > 0) {
                        query = "{demand(numUsers:" + consumers.length + prosumers.length + 1 + ")\nwph\nproduction}";
                        APIquery(query, function (q) {
                            let d = JSON.parse(q);
                            let q_d = d.data["demand"];
                            let wind = d.data["wph"];
                            let production = d.data["production"];
                            let market_demand = 0;
                            let market_sell = 0;

                            /** PP PRODUCTION */
                            let pp_production = Number(managers[0].production);
                            let demand_production = pp_production * (1 - Number(managers[0].ratio)/100)
                            let old_charge = managers[0].battery;
                            /** Add the power plant demand to the market demand */
                            market_demand += q_d[consumers.length + prosumers.length]
                            /** Add the percent of production */
                            let pp_battery_charge = (old_charge + pp_production * Number(managers[0].ratio)/100);

                            /** If power plant is closed the the buffer gets used */
                            if (managers[0].pp_status === "stopped" ) {
                                demand_production = pp_battery_charge
                            }
                            for (let j = 0; j < prosumers.length; j++) {
                                let netto = production - q_d[j]
                                let battery = prosumers[j].battery
                                let blackout = false;
                                if (netto > 0) {
                                    if (prosumers[j].sell_block === 0 ) {
                                        battery += netto * (prosumers[j].battery_sell / 100)
                                        market_sell += netto * (1 - prosumers[j].battery_sell / 100);
                                    }
                                    else {
                                        battery += netto
                                    }
                                    if (battery > 1000) {
                                        market_sell += battery - 1000;
                                        battery = 1000;
                                    }
                                } else {
                                    if (battery + netto * (prosumers[j].battery_use / 100) >= 0 && demand_production - market_demand + netto * (1 - prosumers[j].battery_use / 100) >= 0) {
                                        battery += netto * (prosumers[j].battery_use / 100);
                                        market_demand -= netto * (1 - prosumers[j].battery_use / 100);
                                    }
                                    else if (battery + netto > 0) {
                                        battery += netto
                                    }
                                    else {
                                        battery += netto;
                                        market_demand -= battery;
                                        blackout = true;
                                    }
                                    if (battery < 0) {
                                        battery = 0;
                                    }
                                }
                                db.collection("prosumers").updateOne({_id: prosumers[j]._id},
                                    {
                                        $set: {
                                            "consumption": q_d[j], "production": production,
                                            "battery": battery, "blackout": blackout
                                        }
                                    }).catch((error) => {
                                    console.error(error);
                                });
                            }

                            for (let i = 0; i < consumers.length; i++) {
                                let blackout = false;
                                market_demand += q_d[prosumers.length + i - 1];
                                if (demand_production + market_sell - market_demand < 0) {
                                    blackout = true;
                                }
                                db.collection("consumers").updateOne({_id: consumers[i]._id},
                                    {
                                        $set: {
                                            "consumption": q_d[prosumers.length + i - 1],
                                            "blackout": blackout
                                        }
                                    }).catch((error) => {
                                    console.error(error);
                                });
                            }
                            /** db update managers and global variables*/
                            //demand_production = market_sell - market_demand + demand_production

                            /** When power plant us using buffer, update buffer with the new values */
                            if (managers[0].pp_status === "stopped" ) {
                                pp_battery_charge = market_sell - market_demand + demand_production
                            }

                            if (pp_battery_charge > 10000) {
                                pp_battery_charge = 10000;
                            } else if (pp_battery_charge < 0) {
                                pp_battery_charge = 0;
                            }
                            if (pp_battery_charge < 1000) {
                                alert = true;
                            } else {
                                alert = false;
                            }
                            db.collection("managers").updateMany({}, {
                                $set: {
                                    "consumption": q_d[consumers.length + prosumers.length],
                                    "production": pp_production,
                                    "battery": pp_battery_charge
                                }
                            }).catch((error) => {
                                console.error(error);
                            });
                            db.collection("wind").updateOne({_id: "wind"}, {
                                $set: {
                                    "speed": wind, "market_demand": market_demand,
                                    "market_sell": market_sell, "price": 2.17, "alert": alert
                                }
                            }).then(() => {
                                client.close()
                            });
                        });
                    }
                });
            });
        });
    });
}, 1000);

function resetDbValues() {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function (err,client) {
        if (err) return console.log(err)
        let db = client.db(dbName)
        db.collection("users").updateMany({},{$set:{"logged_in":false}})
        db.collection("consumers").updateMany({},{$set:{"consumption":0,"blackout":false,}})
        let proUpdate = {"consumption": 0, "production": 0, "battery": 0, "battery_use": 0, "battery_sell": 0,"blackout":false, "sell_block":0}
        db.collection("prosumers").updateMany({},{$set:proUpdate})
        let manUpdate = {"consumption": 0, "production": 0, "battery": 0, "blackouts": 0}
        db.collection("managers").updateMany({}, {$set:manUpdate})
        let generalUpdate = {"speed": 7, "market_demand": 0, "market_sell": 0, "price": 0, "alert":false}
        db.collection("wind").updateMany({},{$set:generalUpdate})
    })
}
