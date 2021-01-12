//https://github.com/rsp/node-static-http-servers/blob/master/express.js
const path = require('path');
let ejs = require('ejs');
const express = require('express');
const session = require('express-session');
const redis = require("redis");
const redisStore = require('connect-redis')(session);
const redisClient = redis.createClient();
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const MongoClient = require("mongodb");
const bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
const multer = require('multer');

const deleteFile = (file) => {
    fs.unlink(file, (err) => {
        if (err) throw err;
    });
}

// Set The Storage Engine
const storage = multer.diskStorage({
    destination: './views/partials/public/uploads/',
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits: {fileSize: 1000000},
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image');

// Check File Type
function checkFileType(file, callback) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const ext = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (ext) {
        return callback(null, true);
    } else {
        callback('Error: Not an image!');
    }
}

app.use(session({
    secret: 'wewo',
    // create new redis store.
    store: new redisStore({host: 'localhost', port: 6379, client: redisClient, ttl: 260}),
    saveUninitialized: true,
    resave: false
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));

const url = 'mongodb://127.0.0.1:27017'
const dbName = 'M7011E'

let wind = 0;
let price = 0;
let market_demand = 0;
let market_sell = 0;
let alert = false;

function formattedUserJSON(req, callback) {
    if (req.session.user) {
        if (req.session.role === "Manager") {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName)
                db.collection("users").find().toArray(function (manErr, users) {
                    if (manErr) return console.log(manErr)
                    db.collection("consumers").find().toArray(function (consErr, consumers) {
                        if (consErr) return console.log(consErr)
                        db.collection("prosumers").find().toArray(function (proErr, prosumers) {
                            if (consErr) return console.log(proErr)

                            let formattedUsers = {
                                "consumers": {"name": [], "logged_in": []},
                                "prosumers": {"name": [], "logged_in": [], "sell_block": []}
                            }
                            let nmbrConsumers = 0
                            let nmbrProsumers = 0
                            for (let i = 0; i < users.length; i++) {
                                for (let j = 0; j < consumers.length; j++) {
                                    if (users[i].username === consumers[j]._id) {
                                        formattedUsers.consumers.name[nmbrConsumers] = consumers[j]._id
                                        if (users[i].logged_in) {
                                            formattedUsers.consumers.logged_in[nmbrConsumers] = users[i].logged_in
                                        } else {
                                            formattedUsers.consumers.logged_in[nmbrConsumers] = false;
                                        }
                                        nmbrConsumers++;
                                    }
                                }
                                for (let k = 0; k < prosumers.length; k++) {
                                    if (users[i].username === prosumers[k]._id) {
                                        formattedUsers.prosumers.name[nmbrProsumers] = prosumers[k]._id
                                        formattedUsers.prosumers.sell_block[nmbrProsumers] = prosumers[k].sell_block
                                        if (users[i].logged_in) {
                                            formattedUsers.prosumers.logged_in[nmbrProsumers] = users[i].logged_in
                                        } else {
                                            formattedUsers.prosumers.logged_in[nmbrProsumers] = false;
                                        }
                                        nmbrProsumers++;
                                    }
                                }
                            }
                            client.close()
                            callback(formattedUsers)
                        });
                    });
                });
            });
        } else {
            callback("Error not user")
        }
    } else {
        callback("Error not logged in")
    }
}

function blockLoop(user) {
    setTimeout(function () {
        MongoClient.connect(url, {
            useNewUrlParser: true, useUnifiedTopology: true
        }, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName);
            db.collection("prosumers").find({"_id": user}).toArray(function (err, prosumer) {
                if (prosumer.length === 1) {
                    prosumer[0].sell_block = parseInt(prosumer[0].sell_block, 10)
                    if (prosumer[0].sell_block - 1 >= 0) {
                        prosumer[0].sell_block = prosumer[0].sell_block - 1
                        blockLoop(user)
                    }
                    db.collection("prosumers").updateOne({"_id": user},
                        {$set: {"sell_block": prosumer[0].sell_block}}, function (err, writeRes) {
                            if (err) {
                                console.log(err)
                            }
                        })
                }
            })
        })
    }, 1000)
}

function updateDisplayVals(req, callback) {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        let role = ""
        switch (req.session.role) {
            case "Consumer":
                role = "consumers"
                break;
            case "Prosumer":
                role = "prosumers"
                break;
            case "Manager":
                role = "managers"
                break;
            default:
                console.log("Something went wrong")
        }
        db.collection("wind").find({_id: "wind"}).toArray(function (err, windRes) {
            if (err) return console.log(err)
            if (windRes) {
                wind = windRes[0].speed
                price = windRes[0].price
                market_demand = windRes[0].market_demand
                market_sell = windRes[0].market_sell
                alert = windRes[0].alert
            }
            db.collection("users").find({"username": req.session.user}).toArray(function (err, result) {
                if (err) return console.log(err)
                if (result) {
                    req.session.image = result[0].image
                    req.session.name = result[0].name
                    req.session.email = result[0].email
                    db.collection(role).find({_id: req.session.user}).toArray(function (err, result) {
                        if (err) return console.log(err)
                        if (result) {
                            if (role === "consumers") {
                                req.session.consumption = result[0].consumption
                                req.session.blackout = result[0].blackout
                            } else if (role === "prosumers") {
                                req.session.production = result[0].production
                                req.session.battery = result[0].battery
                                req.session.battery_use = result[0].battery_use
                                req.session.battery_sell = result[0].battery_sell
                                req.session.consumption = result[0].consumption
                                req.session.blackout = result[0].blackout
                            } else if (role === "managers") {
                                req.session.production = result[0].production
                                req.session.battery = result[0].battery
                                req.session.consumption = result[0].consumption
                                req.session.blackouts = result[0].blackouts
                                req.session.pp_status = result[0].pp_status
                            }
                            client.close();
                            callback(true);
                        } else {
                            client.close()
                            callback(false);
                        }
                    });
                }
            });
        });
    });

}

app.get('/', (req, res) => {
    return res.redirect('/home');
});

app.get('/home', (req, res) => {
    if (req.session.user) {
        updateDisplayVals(req, function (status) {
            if (status) {
                if (req.session.role == "Manager") {
                    res.render('home', {
                        ssn: req.session, windSpeed: wind, price: price,
                        market_demand: market_demand, market_sell: market_sell
                    });
                } else {
                    res.render('home', {ssn: req.session, windSpeed: wind, price: price, alert: alert});
                }
            } else {
                console.log("Something went wrong")
            }
        });
    } else {
        res.render('home', {ssn: "Login"});
    }
});

app.get('/personal', (req, res) => {
    if (req.session.user) {
        res.render('personal', {
            ssn: req.session, image: req.session.image
        });
    } else {
        res.render('personal', {ssn: "Login"});
    }
});

app.get('/user_overview', (req, res) => {
    formattedUserJSON(req, function (formattedUsers) {
        if (formattedUsers === "Error not logged in") {
            res.render('user_overview', {ssn: "Login"});
        } else if (formattedUsers === "Error not logged in") {
            res.render('user_overview', {ssn: req.session});
        } else {
            res.render('user_overview', {ssn: req.session, statuses: formattedUsers});
        }
    })
});

app.get('/user_overview_ajax', (req, res) => {
    formattedUserJSON(req, function (formattedUsers) {
        let consumerList = ""
        for (let i = 0; i < formattedUsers.consumers.name.length; i++) {
            consumerList += "<li class=\"list-group-item\">"
            consumerList += "<button name=\"consumer_username\" type=\"submit\" class=\"btn btn-link\"" +
                "value=\"" + formattedUsers.consumers.name[i] + "\">" + formattedUsers.consumers.name[i] + "</button>";
            if (formattedUsers.consumers.logged_in[i]) {
                consumerList += "<span class=\"badge badge-primary badge-pill\">Logged in</span>"
            } else {
                consumerList += "<span class=\"badge badge-secondary badge-pill\">Logged out</span>"
            }
            consumerList += "</li>"
        }
        let prosumerList = ""
        for (let i = 0; i < formattedUsers.prosumers.name.length; i++) {
            prosumerList += "<li class=\"list-group-item\">"
            prosumerList += "<button name=\"prosumer_username\" type=\"submit\" class=\"btn btn-link\"" +
                "value=\"" + formattedUsers.prosumers.name[i] + "\">" + formattedUsers.prosumers.name[i] + "</button>";
            if (formattedUsers.prosumers.logged_in[i]) {
                prosumerList += "<span class=\"badge badge-primary badge-pill\">Logged in</span>"
            } else {
                prosumerList += "<span class=\"badge badge-secondary badge-pill\">Logged out</span>"
            }
            if (parseInt(formattedUsers.prosumers.sell_block[i], 10) === 0) {
                prosumerList += "<button name=\"block_prosumer_username\" class=\"btn btn-danger\" type=\"submit\" " +
                    "value=\"" + formattedUsers.prosumers.name[i] + "\">Block</button>"
            } else {
                prosumerList += "User is blocked from selling for: " + formattedUsers.prosumers.sell_block[i] + "  seconds"
            }
        }
        res.send({"consumers": consumerList, "prosumers": prosumerList})
    })
})

app.get('/login', (req, res) => {
    res.render('login', {});
});

app.get('/logged_in', (req, res) => {
    res.render('logged_in', {});
});

app.get('/logout', (req, res) => {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName);
        db.collection("users").updateOne({"username": req.session.user}, {$set: {"logged_in": false}})
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                return res.redirect('/home');
            }
        });
    });
});

app.get('/createUser', (req, res) => {
    res.render('createUser', {});
});

app.get('/user_created', (req, res) => {
    res.render('user_created', {});
});

app.get('/user_exists', (req, res) => {
    res.render('user_exists', {});
});

app.get('/login_error', (req, res) => {
    res.render('login_error', {});
});

app.post('/personal', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.render('personal',
                {
                    ssn: req.session, msg: err, image: req.session.image
                });
        } else {
            if (req.file == undefined) {
                res.render('personal',
                    {
                        ssn: req.session,
                        msg: 'Error: No File Selected!',
                        image: req.session.image
                    });
            } else {
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                    if (err) return console.log(err)
                    let db = client.db(dbName)
                    let displayPath = req.file.path.slice(6);
                    let query = {username: req.session.user}
                    db.collection("users").find(query).toArray(function (err, result) {
                        if (err) return console.log(err)
                        if (result[0].image !== "partials/public/uploads/harry.png" && result[0].image !== "partials/public/uploads/default.jpg" && result[0].image !== "partials/public/uploads/manager_default.png") {
                            deleteFile("views/" + result[0].image)
                        }
                        db.collection("users").updateOne({"username": req.session.user},
                            {$set: {"image": displayPath}});
                        res.render('personal',
                            {
                                ssn: req.session, msg: 'File Uploaded!',
                                image: displayPath
                            });
                    });
                });

            }
        }
    });
});

app.post('/createUser', function (req, res) {
    if (!req.session.user) {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {username: req.body.username}
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                if (!result.length) {
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            let imagepath = "partials/public/uploads/harry.png"
                            if (req.body.role === "Consumer") {
                                roles = "Consumer"
                                imagepath = "partials/public/uploads/default.jpg"
                            } else if (req.body.role === "Prosumer") {
                                roles = "Prosumer"
                                imagepath = "partials/public/uploads/default.jpg"
                            } else {
                                roles = "Manager"
                                imagepath = "partials/public/uploads/manager_default.png"
                            }
                            let user = {
                                name: req.body.name,
                                username: req.body.username,
                                password: hash,
                                email: req.body.email,
                                role: roles,
                                logged_in: false,
                                image: imagepath
                            }
                            db.collection("users").insertOne(user, function (err, result) {
                                if (err) {
                                    return console.log(err)
                                } else {
                                    if (req.body.role === "Consumer") {
                                        let consumers = {
                                            _id: req.body.username,
                                            consumption: 0,
                                            blackout: false
                                        }
                                        db.collection("consumers").insertOne(consumers, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                client.close();
                                                return res.redirect('/user_created');
                                            }
                                        });
                                    } else if (req.body.role === "Prosumer") {
                                        let prosumers = {
                                            _id: req.body.username,
                                            consumption: 0,
                                            production: 0,
                                            battery: 0,
                                            battery_use: 0,
                                            battery_sell: 0,
                                            blackout: false,
                                            sell_block: 0
                                        }
                                        db.collection("prosumers").insertOne(prosumers, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                client.close();
                                                return res.redirect('/user_created');
                                            }
                                        });

                                    } else if (req.body.role === "Manager") {
                                        let managers = {
                                            _id: req.body.username,
                                            consumption: 0,
                                            production: 0,
                                            battery: 0,
                                        }
                                        db.collection("managers").insertOne(managers, function (err, result) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                client.close();
                                                return res.redirect('/user_created');
                                            }
                                        });
                                    } else {
                                        return res.redirect('/user_created');
                                    }
                                }
                            });
                        });
                    });
                } else {
                    /*return res.end("User already exists");*/
                    return res.redirect('/user_exists');
                }
            });
        });
    } else {
        return res.redirect('/logged_in');
    }
});

app.post('/login', function (req, res) {
    if (req.session.user) {
        return res.redirect('/logged_in');
    } else {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {username: req.body.login}
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                if (result.length < 1) {
                    return res.redirect('/login_error');
                }
                bcrypt.compare(req.body.password, result[0].password).then(function (result2) {
                    if (result2) {
                        db.collection("users").updateOne(query, {$set: {"logged_in": true}})
                        req.session.user = req.body.login;
                        req.session.email = result[0].email;
                        req.session.name = result[0].name;
                        req.session.image = result[0].image;
                        if (result[0].role === "Prosumer") {
                            let query2 = {_id: req.session.user}
                            db.collection("prosumers").find(query2).toArray(function (err, result3) {
                                if (result3) {
                                    req.session.role = "Prosumer";
                                    req.session.consumption = result3[0].consumption;
                                    req.session.production = result3[0].production;
                                    req.session.battery = result3[0].battery;
                                    req.session.battery_sell = result3[0].battery_sell;
                                    req.session.battery_use = result3[0].battery_use;
                                    req.session.blackout = result3[0].blackout;
                                    req.session.pp_status = result3[0].pp_status;
                                    client.close();
                                    return res.redirect('/home');
                                } else {
                                    console.log("cant find prosumer db");
                                }
                            });
                        } else if (result[0].role === "Consumer") {
                            let query2 = {_id: req.session.user}
                            db.collection("consumers").find(query2).toArray(function (err, result3) {
                                if (result3) {
                                    req.session.role = "Consumer";
                                    req.session.consumption = result3[0].consumption;
                                    req.session.blackout = result3[0].blackout;
                                    client.close();
                                    return res.redirect('/home');
                                } else {
                                    console.log("cant find consumer db");
                                }
                            });
                        } else if (result[0].role === "Manager") {
                            let query2 = {_id: req.session.user}
                            db.collection("managers").find(query2).toArray(function (err, result3) {
                                if (result3) {
                                    req.session.role = "Manager";
                                    req.session.consumption = result3[0].consumption;
                                    req.session.production = result3[0].production;
                                    req.session.battery = result3[0].battery;
                                    req.session.battery_sell = result3[0].battery_sell;
                                    req.session.battery_use = result3[0].battery_use;
                                    client.close();
                                    return res.redirect('/home');
                                } else {
                                    console.log("cant find managers db");
                                }
                            });
                        } else {
                            req.session.role = "Admin";
                            client.close();
                            return res.redirect('/home');
                        }
                        ;
                    } else {
                        client.close();
                        return res.redirect('/login_error');
                    }
                });
            });
        });
    }
});

app.get('/ajax', function (req, res) {
    if (req.session.user) {
        updateDisplayVals(req, function (status) {
            if (status) {
                let ajaxVals = req.session;
                ajaxVals["wind"] = wind;
                ajaxVals["price"] = price;
                ajaxVals["market_sell"] = market_sell;
                ajaxVals["market_demand"] = market_demand;
                ajaxVals["alert"] = alert;
                res.json(ajaxVals)
            } else {
                console.log("Something went wrong")
            }
        });
    } else {
        res.json({});
    }
});

app.post('/ajax', function (req, res) {
    if (req.session.user) {
        let role = ""
        switch (req.session.role) {
            case "Consumer":
                role = "consumers"
                break;
            case "Prosumer":
                role = "prosumers"
                break;
            case "Manager":
                role = "managers"
                break;
            default:
                console.log("Something went wrong")
        }
        if (role === "prosumers") {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName);
                db.collection(role).updateOne({_id: req.session.user},
                    {$set: {"battery_use": req.body.use, "battery_sell": req.body.storage}})
                req.session.battery_use = req.body.use;
                req.session.battery_sell = req.body.storage;
                return res.json({"use": req.body.use, "storage": req.body.storage});
            });
        } else if (role === "managers") {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName);
                db.collection("managers").find().toArray(function (err, managers) {
                    if (err) return console.log(err)
                    if (managers[0].pp_status === "running" || managers[0].pp_status === "stopped") {
                        if (managers[0].production === 0 && req.body.pp_production > 0) {
                            db.collection("managers").updateMany({}, {$set: {"pp_status": "starting"}}).then(() => {
                                client.close()
                            });
                        } else if (managers[0].production > 0 && req.body.pp_production === 0) {
                            db.collection("managers").updateMany({}, {$set: {"pp_status": "stopping"}}).then(() => {
                                client.close()
                            });
                        } else if (managers[0].production < req.body.pp_production) {
                            db.collection("managers").updateMany({}, {$set: {"pp_status": "increasing"}}).then(() => {
                                client.close()
                            });
                        } else if (managers[0].production > req.body.pp_production) {
                            db.collection("managers").updateMany({}, {$set: {"pp_status": "decreasing"}}).then(() => {
                                client.close()
                            });
                        } else {
                            client.close()
                        }
                        setTimeout(function () {
                            MongoClient.connect(url, {
                                useNewUrlParser: true,
                                useUnifiedTopology: true
                            }, (err, client) => {
                                if (err) return console.log(err)
                                let db = client.db(dbName);
                                let query = ""
                                if (req.body.pp_production == 0) {
                                    query = {
                                        "production": req.body.pp_production,
                                        "pp_status": "stopped"
                                    }
                                }
                                else {
                                    query = {
                                        "production": req.body.pp_production,
                                        "pp_status": "running"
                                    }
                                }
                                db.collection("managers").updateMany({}, {
                                    $set: query
                                }).then(() => {
                                    client.close()
                                });
                                req.session.production = req.body.pp_production;
                                return res.json({"pp_production": req.body.pp_production});
                            });
                        }, 30000);
                    }
                })
            })
        } else {
            return res.json({});
        }
    } else {
        return res.json({});
    }
});

app.post('/manager_inspection', function (req, res) {
    if (req.session.user) {
        if (req.session.role === "Manager") {
            if (req.body.block_prosumer_username) {
                if (req.body.block_time <= 100 && req.body.block_time >= 10) {
                    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                        if (err) return console.log(err)
                        let db = client.db(dbName)
                        db.collection("prosumers").updateOne({"_id": req.body.block_prosumer_username},
                            {$set: {"sell_block": req.body.block_time}}, function (err, writeRes) {
                                if (err) {
                                    console.log(err)
                                    res.send("Error, something went wrong.")
                                } else if (writeRes.matchedCount === 0) {
                                    res.send("Error, something went wrong.")
                                } else {
                                    blockLoop(req.body.block_prosumer_username)
                                    res.redirect("/user_overview")
                                }
                            })
                    })
                } else {
                    res.send("No block time value given!")
                }
            } else if (req.body.prosumer_username) {
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                    if (err) return console.log(err)
                    let db = client.db(dbName)
                    db.collection("users").find({"username": req.body.prosumer_username}).toArray(function (userErr, userDetails) {
                        if (userErr) return console.log(userErr)
                        db.collection("prosumers").find({"_id": req.body.prosumer_username}).toArray(function (prosErr, prosumers) {
                            if (prosErr) return console.log(prosErr)
                            prosumers[0].user = req.session.user
                            prosumers[0].name = userDetails[0].name
                            prosumers[0].email = userDetails[0].email
                            prosumers[0].role = userDetails[0].role
                            res.render('lookup_prosumer', {ssn: prosumers[0], windSpeed: wind})
                        });
                    });
                });
            } else if (req.body.consumer_username) {
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                    if (err) return console.log(err)
                    let db = client.db(dbName)
                    db.collection("users").find({"username": req.body.consumer_username}).toArray(function (userErr, userDetails) {
                        if (userErr) return console.log(userErr)
                        db.collection("consumers").find({"_id": req.body.consumer_username}).toArray(function (consErr, consumers) {
                            if (consErr) return console.log(consErr)
                            consumers[0].user = req.session.user
                            consumers[0].name = userDetails[0].name
                            consumers[0].email = userDetails[0].email
                            consumers[0].role = userDetails[0].role
                            res.render('lookup_consumer', {ssn: consumers[0]})
                        });
                    });
                });
            } else {
                res.send("Error, something went wrong.")
            }
        } else {
            res.send("Only managers can se this page")
        }
    } else {
        res.send("Login first!")
    }
})

app.post('/manager_lookup_ajax', function (req, res) {
    if (req.session.user) {
        if (req.session.role === "Manager") {
            updateDisplayVals(req, function (status) {
                if (status) {
                    if (req.body.prosumer) {
                        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                            if (err) return console.log(err)
                            let db = client.db(dbName)
                            db.collection("prosumers").find({"_id": req.body.prosumer}).toArray(function (proErr, prosumers) {
                                if (proErr) return console.log(proErr)
                                res.json({"prosumer": prosumers[0], "wind": wind})
                            })
                        })
                    } else if (req.body.consumer) {
                        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                            if (err) return console.log(err)
                            let db = client.db(dbName)
                            db.collection("consumers").find({"_id": req.body.consumer}).toArray(function (conErr, consumers) {
                                if (conErr) return console.log(conErr)
                                res.json({"consumer": consumers[0], "wind": wind})
                            })
                        })
                    }
                } else {
                    res.json({})
                }
            })
        }
    }
})

app.post('/update_details', function (req, res) {
    if (req.session.user) {
        if (req.session.role === "Manager") {
            if (req.body.old_username) {
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                    if (err) return console.log(err)
                    let db = client.db(dbName)
                    db.collection("users").find({"username": req.body.username}).toArray(function (err, control_user) {
                        if (err) return console.log(err)
                        if (control_user.length === 0) {
                            db.collection("users").find({"username": req.body.old_username}).toArray(function (err, user) {
                                if (err) return console.log(err)
                                if (user[0].logged_in) {
                                    return res.send("Selected user is logged in, changes can only be made when the user is logged out.")
                                }
                                req.body.role = user[0].role
                                if (req.body.old_username !== req.body.username) {
                                    role = ""
                                    switch (req.body.role) {
                                        case "Consumer":
                                            role = "consumers"
                                            break;
                                        case "Prosumer":
                                            role = "prosumers"
                                            break;
                                        default:
                                            console.log("Something went wrong")
                                            res.send("Something went wrong!")
                                    }
                                    db.collection(role).find({"_id": req.body.old_username}).toArray(function (err, query_res) {
                                        let old = query_res[0]
                                        if (role === "prosumers") {
                                            if (parseInt(old.sell_block, 10) > 0) {
                                                return res.send("Cannot change details while user is sell blocked");
                                            }
                                        }
                                        db.collection("users").updateOne({"username": req.body.old_username}, {
                                            $set: {
                                                "name": req.body.name,
                                                "username": req.body.username,
                                                "email": req.body.email
                                            }
                                        }).catch((error) => {
                                            console.error(error);
                                        });
                                        db.collection(role).deleteOne({"_id": req.body.old_username}, function (err, writeRes) {
                                            if (role === "consumers") {
                                                db.collection(role).insertOne({
                                                    "_id": req.body.username,
                                                    "consumption": old.consumption,
                                                    "blackout": old.blackout
                                                }, function (err, writeRes) {
                                                    if (err) {
                                                        return console.log(err)
                                                    }
                                                    if (writeRes.insertedCount !== 1) {
                                                        res.send("Something went wrong when inserting")
                                                    }
                                                    client.close();
                                                    res.redirect('/home')
                                                });
                                            } else {
                                                db.collection(role).insertOne({
                                                    "_id": req.body.username,
                                                    "consumption": old.consumption,
                                                    "production": old.production,
                                                    "battery": old.battery,
                                                    "battery_use": old.battery_use,
                                                    "battery_sell": old.battery_sell,
                                                    "blackout": old.blackout,
                                                    "sell_block": old.sell_block
                                                }, function (err, writeRes) {
                                                    if (err) {
                                                        return console.log(err)
                                                    }
                                                    if (writeRes.insertedCount !== 1) {
                                                        res.send("Something went wrong when inserting")
                                                    }
                                                    client.close();
                                                    res.redirect('/home')
                                                });
                                            }
                                        })
                                    })
                                }
                            })
                        }
                        else {
                            return res.send("Username already taken, choose another")
                        }
                    })
                })
            } else if (req.body.delete_username) {
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                    if (err) return console.log(err)
                    let db = client.db(dbName)
                    db.collection("users").find({"username": req.body.delete_username}).toArray(function (err, user) {
                        if (err) return console.log(err)
                        if (user[0].logged_in) {
                            return res.send("Selected user is logged in, changes can only be made when the user is logged out.")
                        }
                        req.body.role = user[0].role
                        role = ""
                        switch (req.body.role) {
                            case "Consumer":
                                role = "consumers"
                                break;
                            case "Prosumer":
                                role = "prosumers"
                                break;
                            default:
                                console.log("Something went wrong")
                                res.send("Something went wrong!")
                        }
                        db.collection("users").deleteOne({"username": req.body.delete_username}, function (err, writeRes) {
                            if (err) return console.log(err)
                            else {
                                db.collection(role).deleteOne({"_id": req.body.delete_username}, function (err, writeRes) {
                                    if (err) return console.log(err)
                                    else {
                                        client.close(function (err) {
                                            res.redirect("/home");
                                        })
                                    }
                                })
                            }
                        })
                    })
                })
            } else {
                res.send("Something went wrong, try again");
            }
        }
    }
})


app.post('/update_personal', function (req, res) {
    MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
        if (err) return console.log(err)
        let db = client.db(dbName)
        db.collection("users").find({"username": req.session.user}).toArray(function (err, result) {
            if (err) return console.log(err)
            let pw = result[0].password
            res.render('update_personal', {ssn: req.session});
        });
    });
});

app.post('/update_val_pers', function (req, res) {
    if (req.session.user) {
        if (req.body.old_username === req.body.username) {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName)
                db.collection("users").find({"username": req.body.old_username}).toArray(function (err, user) {
                    if (err) return console.log(err)
                    //check old password input is correct
                    bcrypt.compare(req.body.old_password, user[0].password).then(function (result2) {
                        if (result2) {
                            //check if user wants new password
                            console.log(req.body.new_password)
                            if (req.body.new_password !== "") {
                                //hash new password
                                bcrypt.genSalt(10, function (err, salt) {
                                    bcrypt.hash(req.body.new_password, salt, function (err, hash) {
                                        bcrypt.compare(req.body.cont_new_password, hash).then(function (result3) {
                                            if (result3) {
                                                db.collection("users").updateOne({"username": req.body.username}, {
                                                    $set: {
                                                        "name": req.body.name,
                                                        "username": req.body.username,
                                                        "email": req.body.email,
                                                        "password": hash
                                                    }
                                                }).catch((error) => {
                                                    console.error(error);
                                                });
                                                updateDisplayVals(req, function (status) {
                                                    if (status) {
                                                        res.redirect('/personal')
                                                    } else {
                                                        console.log("Something went wrong")
                                                    }
                                                });

                                            } else {
                                                return res.render('update_error');
                                            }
                                        });
                                    });
                                });
                            } else {
                                db.collection("users").updateOne({"username": req.body.username}, {
                                    $set: {
                                        "name": req.body.name,
                                        "username": req.body.username,
                                        "email": req.body.email
                                    }
                                }).catch((error) => {
                                    console.error(error);
                                });
                                updateDisplayVals(req, function (status) {
                                    if (status) {
                                        res.redirect('/personal')
                                    } else {
                                        console.log("Something went wrong")
                                    }
                                });
                            }
                        } else {
                            return res.render('update_error');
                        }

                    });
                });
            });
        } else {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName)
                db.collection("users").find({"username": req.body.old_username}).toArray(function (err, user) {
                    if (err) return console.log(err)
                    //check old password input is correct
                    bcrypt.compare(req.body.old_password, user[0].password).then(function (result2) {
                        if (result2) {
                            //check if user wants new password
                            console.log(req.body.new_password)
                            if (req.body.new_password !== "") {
                                //hash new password
                                bcrypt.genSalt(10, function (err, salt) {
                                    bcrypt.hash(req.body.new_password, salt, function (err, hash) {
                                        bcrypt.compare(req.body.cont_new_password, hash).then(function (result3) {
                                            if (result3) {
                                                req.session.user = req.body.username
                                                req.session.name = req.body.name
                                                req.body.role = user[0].role
                                                role = ""
                                                switch (req.body.role) {
                                                    case "Consumer":
                                                        role = "consumers"
                                                        break;
                                                    case "Prosumer":
                                                        role = "prosumers"
                                                        break;
                                                    case "Manager":
                                                        role = "managers"
                                                        break;
                                                    default:
                                                        console.log("Something went wrong")
                                                        res.send("Something went wrong!")
                                                }
                                                db.collection(role).find({"_id": req.body.old_username}).toArray(function (err, query_res) {
                                                    let old = query_res[0]
                                                    db.collection("users").updateOne({"username": req.body.old_username}, {
                                                        $set: {
                                                            "name": req.body.name,
                                                            "username": req.body.username,
                                                            "email": req.body.email,
                                                            "password": hash
                                                        }
                                                    }).catch((error) => {
                                                        console.error(error);
                                                    });
                                                    db.collection(role).deleteOne({"_id": req.body.old_username}, function (err, writeRes) {
                                                        if (role === "consumers") {
                                                            db.collection(role).insertOne({
                                                                "_id": req.body.username,
                                                                "consumption": old.consumption,
                                                                "blackout": old.blackout
                                                            }, function (err, writeRes) {
                                                                if (err) {
                                                                    return console.log(err)
                                                                }
                                                            });
                                                        } else if (role === "prosumers") {
                                                            db.collection(role).insertOne({
                                                                "_id": req.body.username,
                                                                "consumption": old.consumption,
                                                                "production": old.production,
                                                                "battery": old.battery,
                                                                "battery_use": old.battery_use,
                                                                "battery_sell": old.battery_sell,
                                                                "blackout": old.blackout,
                                                                "sell_block": old.sell_block
                                                            }, function (err, writeRes) {
                                                                if (err) {
                                                                    return console.log(err)
                                                                }
                                                            });
                                                        } else {
                                                            db.collection(role).insertOne({
                                                                "_id": req.body.username,
                                                                "consumption": old.consumption,
                                                                "production": old.production,
                                                                "battery": old.battery,
                                                                "blackouts": old.blackouts
                                                            }, function (err, writeRes) {
                                                                if (err) {
                                                                    return console.log(err)
                                                                }
                                                            });
                                                        }
                                                    })
                                                    updateDisplayVals(req, function (status) {
                                                        if (status) {
                                                            res.redirect('/personal')
                                                        } else {
                                                            console.log("Something went wrong")
                                                        }
                                                    });
                                                })
                                            } else {
                                                return res.render('update_error');
                                            }
                                        });
                                    });
                                });
                            } else {
                                req.session.user = req.body.username
                                req.body.role = user[0].role
                                role = ""
                                switch (req.body.role) {
                                    case "Consumer":
                                        role = "consumers"
                                        break;
                                    case "Prosumer":
                                        role = "prosumers"
                                        break;
                                    case "Manager":
                                        role = "managers"
                                        break;
                                    default:
                                        console.log("Something went wrong")
                                        res.send("Something went wrong!")
                                }
                                db.collection(role).find({"_id": req.body.old_username}).toArray(function (err, query_res) {
                                    let old = query_res[0]
                                    db.collection("users").updateOne({"username": req.body.old_username}, {
                                        $set: {
                                            "name": req.body.name,
                                            "username": req.body.username,
                                            "email": req.body.email
                                        }
                                    }).catch((error) => {
                                        console.error(error);
                                    });
                                    db.collection(role).deleteOne({"_id": req.body.old_username}, function (err, writeRes) {
                                        if (role === "consumers") {
                                            db.collection(role).insertOne({
                                                "_id": req.body.username,
                                                "consumption": old.consumption,
                                                "blackout": old.blackout
                                            }, function (err, writeRes) {
                                                if (err) {
                                                    return console.log(err)
                                                }
                                            });
                                        } else if (role === "prosumers") {
                                            db.collection(role).insertOne({
                                                "_id": req.body.username,
                                                "consumption": old.consumption,
                                                "production": old.production,
                                                "battery": old.battery,
                                                "battery_use": old.battery_use,
                                                "battery_sell": old.battery_sell,
                                                "blackout": old.blackout,
                                                "sell_block": old.sell_block
                                            }, function (err, writeRes) {
                                                if (err) {
                                                    return console.log(err)
                                                }
                                            });
                                        } else {
                                            db.collection(role).insertOne({
                                                "_id": req.body.username,
                                                "consumption": old.consumption,
                                                "production": old.production,
                                                "battery": old.battery,
                                                "blackouts": old.blackouts
                                            }, function (err, writeRes) {
                                                if (err) {
                                                    return console.log(err)
                                                }
                                            });
                                        }
                                    })
                                    updateDisplayVals(req, function (status) {
                                        if (status) {
                                            res.redirect('/personal')
                                        } else {
                                            console.log("Something went wrong")
                                        }
                                    });
                                })
                            }
                        } else {
                            return res.render('update_error');
                        }

                    });
                });
            });
        }
    }
});

app.get('/get_blackouts', function (req, res) {
    if (req.session.user) {
        if (req.session.role === "Manager") {
            MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName)
                db.collection("consumers").find().toArray(function (err, consumers) {
                    if (err) return console.log(err)
                    db.collection("prosumers").find().toArray(function (err, prosumers) {
                        if (err) return console.log(err)
                        client.close()
                        let nmbr_blackouts = 0
                        let prosumer_blackouts = ""
                        for (let i = 0; i < consumers.length; i++) {
                            if (consumers[i].blackout) {
                                nmbr_blackouts++
                            }
                        }
                        for (let i = 0; i < prosumers.length; i++) {
                            if (prosumers[i].blackout) {
                                nmbr_blackouts++
                                prosumer_blackouts += "<li>" + prosumers[i]._id + "</li>"
                            }
                        }
                        res.send({"nmbr_blackouts": nmbr_blackouts, "prosumer_blackouts": prosumer_blackouts})
                    })
                })
            })
        }
    }
})

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000');
});