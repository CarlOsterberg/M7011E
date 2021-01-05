
//https://github.com/rsp/node-static-http-servers/blob/master/express.js
var path = require('path');
let ejs = require('ejs');
var express = require('express');
var session = require('express-session');
var redis   = require("redis");
var redisStore = require('connect-redis')(session);
var redisClient  = redis.createClient();
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
const MongoClient = require("mongodb");
const bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
    secret: 'wewo',
    // create new redis store.
    store: new redisStore({ host: 'localhost', port: 6379, client: redisClient,ttl :  260}),
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

function updateDisplayVals(req,callback) {
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
        db.collection("wind").find({_id:"wind"}).toArray(function (err, windRes) {
            if (err) return console.log(err)
            if (windRes) {
                wind = windRes[0].speed
                price = windRes[0].price
                market_demand = windRes[0].market_demand
                market_sell = windRes[0].market_sell
            }
            db.collection(role).find({_id:req.session.user}).toArray(function (err,result) {
                if (err) return console.log(err)
                if (result) {
                    if(role === "consumers") {
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
                        req.session.blackouts =  result[0].blackouts;
                    }
                    client.close();
                    callback(true);
                }
                else {
                    client.close()
                    callback(false);
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
                    res.render('home', {ssn: req.session, windSpeed : wind, price: price,
                    market_demand:market_demand, market_sell:market_sell});
                }
                else {
                    res.render('home', {ssn: req.session, windSpeed : wind, price: price});
                }
            }
            else {
                console.log("Something went wrong")
            }
        });
    }
    else {
        res.render('home',{ssn: "Login"});
    }
});

app.get('/personal', (req, res) => {

    if (req.session.user) {
        res.render('personal', {ssn: req.session.user, username: req.session.user,
            name: req.session.name, email: req.session.email, role: req.session.role,
            consumption: req.session.consumption});
    }
    else {
        res.render('personal',{ssn: "Login"});
    }
});

app.get('/settings', (req, res) => {
    if (req.session.user) {
        res.render('settings', {ssn: req.session.user});
    }
    else {
        res.render('settings',{ssn: "Login"});
    }
});

app.get('/login', (req, res) => {
    res.render('login', {});
});

app.get('/logged_in', (req, res) => {
    res.render('logged_in', {});
});

app.get('/logout', (req, res) => {
    req.session.destroy(function(err){
        if(err){
            console.log(err);
        } else {
            return res.redirect('/home');
        }
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

app.post('/createUser',function(req,res) {
    if (!req.session.user) {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = { username: req.body.username }
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                if(!result.length) {
                    bcrypt.genSalt(10, function (err, salt) {
                        bcrypt.hash(req.body.password, salt, function (err, hash) {
                            if(req.body.role === "Consumer") {
                                roles = "Consumer"
                            } else if (req.body.role === "Prosumer") {
                                roles = "Prosumer"
                            } else {
                                roles = "Manager"
                            }
                            let user = { name: req.body.name,
                                username: req.body.username,
                                password: hash,
                                email: req.body.email,
                                role: roles
                            }
                            db.collection("users").insertOne(user,function (err, result) {
                                if(err){
                                    return console.log(err)
                                } else {
                                    if(req.body.role === "Consumer") {
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
                                    }else if(req.body.role === "Prosumer") {
                                        let prosumers = {
                                            _id: req.body.username,
                                            consumption: 0,
                                            production: 0,
                                            battery: 0,
                                            battery_use: 0,
                                            battery_sell: 0,
                                            blackout: false
                                        }
                                        db.collection("prosumers").insertOne(prosumers,function (err, result) {
                                            if(err) {
                                                console.log(err);
                                            }
                                            else {
                                                client.close();
                                                return res.redirect('/user_created');
                                            }
                                        });

                                    }else if(req.body.role === "Manager") {
                                        let managers = {
                                            _id: req.body.username,
                                            consumption: 0,
                                            production: 0,
                                            battery: 0,
                                        }
                                        db.collection("managers").insertOne(managers,function (err, result) {
                                            if(err) {
                                                console.log(err);
                                            }
                                            else {
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

app.post('/login',function(req,res) {
    if (req.session.user) {
        return res.redirect('/logged_in');
    }
    else{
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
            if (err) return console.log(err)
            let db = client.db(dbName)
            let query = {username: req.body.login}
            db.collection("users").find(query).toArray(function (err, result) {
                if (err) return console.log(err)
                if (result.length<1) {
                    return res.redirect('/login_error');
                }
                bcrypt.compare(req.body.password, result[0].password).then(function (result2) {
                    if (result2) {
                        req.session.user = req.body.login;
                        req.session.email = result[0].email;
                        req.session.name = result[0].name;
                        if(result[0].role === "Prosumer") {
                            let query2 = {_id: req.session.user}
                            db.collection("prosumers").find(query2).toArray(function (err, result3) {
                                if(result3) {
                                    req.session.role = "Prosumer";
                                    req.session.consumption = result3[0].consumption;
                                    req.session.production =  result3[0].production;
                                    req.session.battery =  result3[0].battery;
                                    req.session.battery_sell =  result3[0].battery_sell;
                                    req.session.battery_use =  result3[0].battery_use;
                                    req.session.blackout = result3[0].blackout;
                                    client.close();
                                    return res.redirect('/home');
                                } else {
                                    console.log("cant find prosumer db");
                                }
                            });
                        } else if (result[0].role === "Consumer") {
                            let query2 = {_id: req.session.user}
                            db.collection("consumers").find(query2).toArray(function (err, result3) {
                                if(result3) {
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
                                if(result3) {
                                    req.session.role = "Manager";
                                    req.session.consumption = result3[0].consumption;
                                    req.session.production =  result3[0].production;
                                    req.session.battery =  result3[0].battery;
                                    req.session.battery_sell =  result3[0].battery_sell;
                                    req.session.battery_use =  result3[0].battery_use;
                                    req.session.blackouts =  result3[0].blackouts;
                                    client.close();
                                    return res.redirect('/home');
                                } else {
                                    console.log("cant find prosumer db");
                                }
                            });
                        } else {
                            req.session.role = "Admin";
                            client.close();
                            return res.redirect('/home');
                        };
                    }
                    else {
                        client.close();
                        return res.redirect('/login_error');
                    }
                });
            });
        });
    }
});

app.get('/ajax', function (req,res) {
    if (req.session.user) {
        updateDisplayVals(req, function (status) {
            if (status) {
                let ajaxVals = req.session;
                ajaxVals["wind"] = wind;
                ajaxVals["price"] = price;
                ajaxVals["market_sell"] = market_sell;
                ajaxVals["market_demand"] = market_demand;
                res.json(ajaxVals)
            }
            else {
                console.log("Something went wrong")
            }
        });
    }
    else {
        res.json({});
    }
});

app.post('/ajax', function (req,res) {
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
                db.collection(role).updateOne({_id:req.session.user},
                    {$set: {"battery_use": req.body.use, "battery_sell":req.body.storage} })
                req.session.battery_use = req.body.use;
                req.session.battery_sell = req.body.storage;
                return res.json({"use": req.body.use, "storage": req.body.storage});
            });
        } else if (role === "managers") {
            setTimeout(function(){
                MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) return console.log(err)
                let db = client.db(dbName);
                db.collection("managers").updateMany({},{$set: {"production":req.body.pp_production}});
                req.session.production = req.body.pp_production;
                return res.json({"pp_production":req.body.pp_production});
                });
            }, 30000);
        }
        else {
            return res.json({});
        }
    }
    else {
        return res.json({});
    }
});

app.listen(3000, function () {
    console.log('Listening on http://localhost:3000');
});